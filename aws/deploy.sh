#!/bin/bash

# Groceries Guru AWS ECS Deployment Script
# This script builds the Docker image, pushes to ECR, and updates ECS service

set -e

# Configuration
AWS_PROFILE="myprofile"
AWS_REGION="us-west-2"
AWS_ACCOUNT_ID="211125743595"
ECR_REPOSITORY_URI="211125743595.dkr.ecr.us-west-2.amazonaws.com/groceries-guru"
CLUSTER_NAME="groceries-guru-cluster"
SERVICE_NAME="groceries-guru-service"
TASK_DEFINITION_FAMILY="groceries-guru"

# Get git commit hash for image tagging
COMMIT_HASH=$(git rev-parse --short HEAD)
IMAGE_TAG="${COMMIT_HASH}"

echo "🚀 Starting Groceries Guru deployment..."
echo "AWS Profile: $AWS_PROFILE"
echo "Region: $AWS_REGION"
echo "ECR URI: $ECR_REPOSITORY_URI"
echo "Image Tag: $IMAGE_TAG"
echo ""

# Authenticate Docker to ECR
echo "🔐 Authenticating Docker with ECR..."
aws ecr get-login-password --region $AWS_REGION --profile $AWS_PROFILE | \
    docker login --username AWS --password-stdin $ECR_REPOSITORY_URI

# Build Docker image
echo "🔨 Building Docker image..."
docker build --platform linux/amd64 -t $ECR_REPOSITORY_URI:$IMAGE_TAG .
docker tag $ECR_REPOSITORY_URI:$IMAGE_TAG $ECR_REPOSITORY_URI:latest

# Push to ECR
echo "📤 Pushing image to ECR..."
docker push $ECR_REPOSITORY_URI:$IMAGE_TAG
docker push $ECR_REPOSITORY_URI:latest

# Update task definition with new image
echo "📋 Updating ECS task definition..."
TASK_DEFINITION=$(aws ecs describe-task-definition \
    --task-definition $TASK_DEFINITION_FAMILY \
    --profile $AWS_PROFILE \
    --region $AWS_REGION)

NEW_TASK_DEFINITION=$(echo $TASK_DEFINITION | jq --arg IMAGE "$ECR_REPOSITORY_URI:$IMAGE_TAG" \
    '.taskDefinition | .containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn) | del(.revision) | del(.status) | del(.requiresAttributes) | del(.placementConstraints) | del(.compatibilities) | del(.registeredAt) | del(.registeredBy)')

NEW_TASK_INFO=$(aws ecs register-task-definition \
    --region $AWS_REGION \
    --profile $AWS_PROFILE \
    --cli-input-json "$NEW_TASK_DEFINITION")

NEW_REVISION=$(echo $NEW_TASK_INFO | jq '.taskDefinition.revision')

# Update ECS service
echo "🔄 Updating ECS service..."
aws ecs update-service \
    --region $AWS_REGION \
    --profile $AWS_PROFILE \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --task-definition $TASK_DEFINITION_FAMILY:$NEW_REVISION \
    --force-new-deployment

# Wait for deployment to complete
echo "⏳ Waiting for service to stabilize..."
aws ecs wait services-stable \
    --region $AWS_REGION \
    --profile $AWS_PROFILE \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME

echo "✅ Deployment completed successfully!"
echo "🏷️  Image: $ECR_REPOSITORY_URI:$IMAGE_TAG"
echo "📋 Task Definition: $TASK_DEFINITION_FAMILY:$NEW_REVISION"
echo ""
echo "📊 Service status:"
aws ecs describe-services \
    --region $AWS_REGION \
    --profile $AWS_PROFILE \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --query 'services[0].{ServiceName:serviceName,Status:status,Running:runningCount,Desired:desiredCount}'