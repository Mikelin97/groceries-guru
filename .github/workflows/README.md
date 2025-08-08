# GitHub Actions Deployment Setup

This directory contains GitHub Actions workflows for automated deployment to AWS ECS.

## Required GitHub Secrets

To enable automated deployment, you need to configure the following secrets in your GitHub repository:

### AWS Credentials
- `AWS_ACCESS_KEY_ID` - Your AWS access key ID
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret access key

### How to Add Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Navigate to **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with the exact names listed above

## Workflow Details

### deploy-to-aws.yml
- **Trigger**: Pushes to `dev` branch or manual trigger
- **Environment**: development
- **Actions**:
  1. Builds Docker image
  2. Pushes to AWS ECR
  3. Updates ECS task definition
  4. **Runs database migrations** (as separate ECS task)
  5. Deploys to ECS service
  6. Waits for deployment completion

### Database Migration Process
The workflow includes an automated database migration step that:
- Creates a temporary ECS task definition for migrations
- Runs `npm run db:migrate:run` in a separate container
- Waits for migration completion before proceeding
- Fails the deployment if migrations fail
- Provides detailed logs for debugging migration issues

## AWS Resources Used
- **ECR Repository**: groceries-guru
- **ECS Cluster**: groceries-guru-cluster  
- **ECS Service**: groceries-guru-service
- **Task Definition**: groceries-guru
- **Region**: us-west-2

## Deployment URL
After successful deployment: https://dev.groceriesguru.com

## Manual Deployment
You can trigger deployments manually by:
1. Go to **Actions** tab in your repository
2. Select **Deploy to AWS ECS** workflow
3. Click **Run workflow**
4. Choose the `dev` branch
5. Click **Run workflow**