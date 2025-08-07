#!/bin/bash

# AWS ECS Infrastructure Setup Script for Groceries Guru
# This script creates the necessary AWS resources for ECS deployment

set -e

# Configuration
AWS_PROFILE="myprofile"
AWS_REGION="us-west-2"
AWS_ACCOUNT_ID="211125743595"
CLUSTER_NAME="groceries-guru-cluster"

echo "🏗️  Setting up AWS ECS infrastructure for Groceries Guru..."
echo "AWS Profile: $AWS_PROFILE"
echo "Region: $AWS_REGION"
echo "Cluster: $CLUSTER_NAME"
echo ""

# Create ECS cluster
echo "🏢 Creating ECS cluster..."
aws ecs create-cluster \
    --cluster-name $CLUSTER_NAME \
    --region $AWS_REGION \
    --profile $AWS_PROFILE \
    --capacity-providers FARGATE \
    --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
    --tags key=Environment,value=production key=Application,value=groceries-guru || echo "Cluster may already exist"

# Create CloudWatch log group
echo "📊 Creating CloudWatch log group..."
aws logs create-log-group \
    --log-group-name /ecs/groceries-guru \
    --region $AWS_REGION \
    --profile $AWS_PROFILE || echo "Log group may already exist"

# Set log retention to 30 days
aws logs put-retention-policy \
    --log-group-name /ecs/groceries-guru \
    --retention-in-days 30 \
    --region $AWS_REGION \
    --profile $AWS_PROFILE

echo "✅ Infrastructure setup completed!"
echo ""
echo "Next steps:"
echo "1. Create AWS Secrets Manager secrets with ./aws/setup-secrets.sh"
echo "2. Create or update your VPC, subnets, and security groups"
echo "3. Update service-definition.json with your subnet and security group IDs"
echo "4. Register the initial task definition: aws ecs register-task-definition --cli-input-json file://aws/task-definition.json --profile myprofile"
echo "5. Create the ECS service: aws ecs create-service --cli-input-json file://aws/service-definition.json --profile myprofile"
echo "6. Deploy with ./aws/deploy.sh"