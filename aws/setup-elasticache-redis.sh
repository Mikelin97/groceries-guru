#!/bin/bash

# AWS ElastiCache Redis Setup Script for Groceries Guru
# This script creates a Redis ElastiCache cluster

set -e

AWS_PROFILE="myprofile"
AWS_REGION="us-west-2"
CACHE_CLUSTER_ID="groceries-guru-redis"

echo "🔄 Setting up AWS ElastiCache Redis for Groceries Guru..."
echo "AWS Profile: $AWS_PROFILE"
echo "Region: $AWS_REGION"
echo "Cache Cluster ID: $CACHE_CLUSTER_ID"
echo ""

# Create cache subnet group
echo "🔗 Creating cache subnet group..."
aws elasticache create-cache-subnet-group \
    --cache-subnet-group-name groceries-guru-cache-subnet-group \
    --cache-subnet-group-description "Subnet group for Groceries Guru Redis" \
    --subnet-ids subnet-0d3f010a7b4f877c8 subnet-0ffe5bacfb2a50623 \
    --region $AWS_REGION \
    --profile $AWS_PROFILE || echo "Cache subnet group may already exist"

# Create security group for Redis
echo "🔒 Creating security group for Redis..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --profile $AWS_PROFILE --region $AWS_REGION)

REDIS_SG_ID=$(aws ec2 create-security-group \
    --group-name groceries-guru-redis-sg \
    --description "Security group for Groceries Guru Redis" \
    --vpc-id $VPC_ID \
    --region $AWS_REGION \
    --profile $AWS_PROFILE \
    --query 'GroupId' --output text 2>/dev/null || \
aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=groceries-guru-redis-sg" \
    --query 'SecurityGroups[0].GroupId' --output text \
    --region $AWS_REGION --profile $AWS_PROFILE)

# Allow Redis access from ECS security group
echo "🔓 Configuring security group rules..."
aws ec2 authorize-security-group-ingress \
    --group-id $REDIS_SG_ID \
    --protocol tcp \
    --port 6379 \
    --source-group sg-09a44d5e77735baf4 \
    --region $AWS_REGION \
    --profile $AWS_PROFILE || echo "Rule may already exist"

# Create ElastiCache Redis cluster
echo "🚀 Creating ElastiCache Redis cluster..."
aws elasticache create-cache-cluster \
    --cache-cluster-id $CACHE_CLUSTER_ID \
    --cache-node-type cache.t3.micro \
    --engine redis \
    --engine-version 7.0 \
    --num-cache-nodes 1 \
    --cache-subnet-group-name groceries-guru-cache-subnet-group \
    --security-group-ids $REDIS_SG_ID \
    --region $AWS_REGION \
    --profile $AWS_PROFILE \
    --tags Key=Environment,Value=production Key=Application,Value=groceries-guru

echo "⏳ Waiting for Redis cluster to be available..."
aws elasticache wait cache-cluster-available \
    --cache-cluster-id $CACHE_CLUSTER_ID \
    --region $AWS_REGION \
    --profile $AWS_PROFILE

# Get the endpoint
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
    --cache-cluster-id $CACHE_CLUSTER_ID \
    --show-cache-node-info \
    --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
    --output text \
    --region $AWS_REGION \
    --profile $AWS_PROFILE)

echo "✅ Redis ElastiCache cluster created successfully!"
echo "Endpoint: $REDIS_ENDPOINT:6379"
echo ""
echo "📝 Update your AWS Secrets Manager 'groceries-guru' secret with:"
echo "REDIS_URL: redis://$REDIS_ENDPOINT:6379"
echo ""
echo "🚨 IMPORTANT: Replace placeholder subnet and security group IDs before running this script!"