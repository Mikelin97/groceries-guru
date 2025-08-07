#!/bin/bash

# AWS RDS PostgreSQL Setup Script for Groceries Guru
# This script creates a PostgreSQL RDS instance

set -e

AWS_PROFILE="myprofile"
AWS_REGION="us-west-2"
DB_INSTANCE_IDENTIFIER="groceries-guru-postgres"
DB_NAME="groceries_guru"
DB_USERNAME="postgres"
DB_PASSWORD="$(openssl rand -base64 32)"  # Generate secure random password

echo "🗄️  Setting up AWS RDS PostgreSQL for Groceries Guru..."
echo "AWS Profile: $AWS_PROFILE"
echo "Region: $AWS_REGION"
echo "DB Identifier: $DB_INSTANCE_IDENTIFIER"
echo ""

# Create DB subnet group (you'll need to replace with your subnet IDs)
echo "🔗 Creating DB subnet group..."
aws rds create-db-subnet-group \
    --db-subnet-group-name groceries-guru-db-subnet-group \
    --db-subnet-group-description "Subnet group for Groceries Guru PostgreSQL" \
    --subnet-ids subnet-0d3f010a7b4f877c8 subnet-0ffe5bacfb2a50623 \
    --region $AWS_REGION \
    --profile $AWS_PROFILE || echo "Subnet group may already exist"

# Create security group for RDS
echo "🔒 Creating security group for RDS..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --profile $AWS_PROFILE --region $AWS_REGION)

DB_SG_ID=$(aws ec2 create-security-group \
    --group-name groceries-guru-db-sg \
    --description "Security group for Groceries Guru PostgreSQL" \
    --vpc-id $VPC_ID \
    --region $AWS_REGION \
    --profile $AWS_PROFILE \
    --query 'GroupId' --output text 2>/dev/null || \
aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=groceries-guru-db-sg" \
    --query 'SecurityGroups[0].GroupId' --output text \
    --region $AWS_REGION --profile $AWS_PROFILE)

# Allow PostgreSQL access from ECS security group
echo "🔓 Configuring security group rules..."
aws ec2 authorize-security-group-ingress \
    --group-id $DB_SG_ID \
    --protocol tcp \
    --port 5432 \
    --source-group sg-09a44d5e77735baf4 \
    --region $AWS_REGION \
    --profile $AWS_PROFILE || echo "Rule may already exist"

# Create RDS instance
echo "🚀 Creating RDS PostgreSQL instance..."
aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 16.4 \
    --allocated-storage 20 \
    --storage-type gp3 \
    --storage-encrypted \
    --master-username $DB_USERNAME \
    --master-user-password $DB_PASSWORD \
    --db-name $DB_NAME \
    --vpc-security-group-ids $DB_SG_ID \
    --db-subnet-group-name groceries-guru-db-subnet-group \
    --backup-retention-period 7 \
    --deletion-protection \
    --region $AWS_REGION \
    --profile $AWS_PROFILE \
    --tags Key=Environment,Value=production Key=Application,Value=groceries-guru

echo "⏳ Waiting for RDS instance to be available..."
aws rds wait db-instance-available \
    --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
    --region $AWS_REGION \
    --profile $AWS_PROFILE

# Get the endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text \
    --region $AWS_REGION \
    --profile $AWS_PROFILE)

echo "✅ PostgreSQL RDS instance created successfully!"
echo "Endpoint: $DB_ENDPOINT"
echo "Database: $DB_NAME"
echo "Username: $DB_USERNAME"
echo ""
echo "📝 Update your AWS Secrets Manager 'groceries-guru' secret with:"
echo "POSTGRES_URL: postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_ENDPOINT:5432/$DB_NAME"
echo "POSTGRES_PASSWORD: $DB_PASSWORD"
echo ""
echo "🚨 IMPORTANT: Replace placeholder subnet and security group IDs before running this script!"