# S3 File Storage Setup Guide

This document explains how the S3 file storage functionality works in the Groceries Guru application.

## Overview

The application now supports uploading images and PDFs as attachments in chat conversations. Files are stored in AWS S3 with:

- Human-readable naming conventions
- Secure signed URLs for access
- Graceful error handling for connectivity issues
- Integration with chat history persistence

## Architecture

### File Upload Flow

1. **User uploads file** → Chat interface validates file type and size
2. **File processed** → Convert to data URL for immediate AI SDK usage
3. **Background upload** → File uploaded to S3 with retry logic
4. **S3 metadata stored** → S3 key and metadata saved in PostgreSQL
5. **AI processing** → AI models can analyze the uploaded content
6. **History retrieval** → Fresh signed URLs generated when loading chat history

### File Storage Structure

Files are organized in S3 with this structure:
```
/{userId}/{year}/{month}/{day}/{conversationId?}/readable-filename-{uuid}.{ext}
```

Example:
```
/123/2025/01/15/456/my-grocery-list-a1b2c3.pdf
/123/2025/01/15/product-photo-d4e5f6.jpg
```

## Setup Instructions

### 1. AWS S3 Configuration

1. Create an S3 bucket (e.g., `groceries-guru-attachments`)
2. Configure bucket permissions for your application
3. Create IAM user with S3 access permissions

### 2. Environment Variables

Add these to your `.env.local`:

```bash
# AWS S3 Configuration
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
S3_BUCKET_NAME=groceries-guru-attachments
```

### 3. IAM Permissions

Your AWS IAM user needs these S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::groceries-guru-attachments/*"
    }
  ]
}
```

## Testing

### Run S3 Upload Test

```bash
npm run test:s3
```

This will:
- Check environment variables
- Test file upload functionality
- Test signed URL generation
- Verify error handling

### Manual Testing

1. Start the development server: `npm run dev`
2. Navigate to the chat interface
3. Click the camera button to upload an image or PDF
4. Verify file appears in chat with preview
5. Refresh page and check chat history loads with files

## File Support

### Supported Formats

- **Images**: JPEG, PNG, GIF, WebP
- **Documents**: PDF

### File Limits

- **Maximum size**: 10MB per file
- **Multiple files**: Supported per message

## Error Handling

The system gracefully handles:

- **Network connectivity issues**: Retry with exponential backoff
- **S3 service unavailable**: Files kept locally with error indicators
- **Invalid file types**: Client-side validation with user feedback
- **File size limits**: Validation before upload attempt
- **Expired URLs**: Fresh signed URLs generated on history load

## Database Schema

File metadata is stored in the `messages.attachments` JSON column:

```json
{
  "name": "product-photo.jpg",
  "contentType": "image/jpeg",
  "url": "https://signed-s3-url...",
  "s3Key": "123/2025/01/15/456/product-photo-a1b2c3.jpg",
  "s3Bucket": "groceries-guru-attachments",
  "s3Region": "us-west-2",
  "uploadStatus": "completed",
  "uploadedAt": "2025-01-15T10:30:00.000Z"
}
```

## API Endpoints

### File Upload
- **Endpoint**: `POST /api/upload`
- **Purpose**: Direct file upload (alternative to inline upload)
- **Auth**: Required

### Chat with Attachments
- **Endpoint**: `POST /api/chat`
- **Purpose**: Send message with file attachments
- **Processing**: Files uploaded to S3, AI SDK receives signed URLs

## Troubleshooting

### Common Issues

1. **"Upload failed" errors**
   - Check AWS credentials in `.env.local`
   - Verify S3 bucket exists and has correct permissions
   - Check network connectivity

2. **"Image unavailable" in chat history**
   - S3 signed URLs may have expired
   - Check S3 service status
   - Verify file still exists in S3 bucket

3. **File validation errors**
   - Ensure file type is supported (images/PDF only)
   - Check file size is under 10MB limit

### Debug Commands

```bash
# Test S3 connectivity
npm run test:s3

# Check environment variables
node -e "console.log(process.env.AWS_REGION, process.env.S3_BUCKET_NAME)"

# View application logs
npm run dev
# Then check browser console and server logs
```

## Security Considerations

- **Signed URLs**: Expire after 24 hours for security
- **File validation**: Client and server-side validation
- **Access control**: Files accessible only via signed URLs
- **No public access**: S3 bucket should not allow public read access

## Performance

- **Upload optimization**: Files processed in background during chat
- **Retry logic**: Exponential backoff for network issues
- **Caching**: Signed URLs cached for 24 hours
- **Preview generation**: Client-side image previews for immediate feedback