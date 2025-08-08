import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'groceries-guru-attachments';

export interface UploadResult {
  key: string;
  url: string;
  publicUrl: string;
  fileName: string;
  contentType: string;
  size: number;
}

export interface FileMetadata {
  userId: string;
  conversationId?: number;
  originalName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

/**
 * Generates a human-readable S3 key for uploaded files
 */
function generateS3Key(
  userId: string, 
  fileName: string, 
  conversationId?: number
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Create human-readable filename
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const sanitizedBaseName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const uuid = uuidv4().split('-')[0];
  const readableFileName = `${sanitizedBaseName}-${uuid}`;
  
  const basePath = `${userId}/${year}/${month}/${day}`;
  const conversationPath = conversationId ? `/${conversationId}` : '';
  
  return `${basePath}${conversationPath}/${readableFileName}.${fileExtension}`;
}

/**
 * Uploads a file to S3 with retry logic
 */
export async function uploadFileToS3(
  file: File,
  userId: string,
  conversationId?: number,
  maxRetries: number = 3
): Promise<UploadResult> {
  const s3Key = generateS3Key(userId, file.name, conversationId);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`S3 upload attempt ${attempt}/${maxRetries} for file: ${file.name}`);
      
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Simple metadata without special characters
      const uploadCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream',
        // Remove complex metadata to avoid header issues
      });
      
      await s3Client.send(uploadCommand);
      console.log(`S3 upload successful for ${s3Key}`);
      
      // Generate signed URL
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
      });
      
      const signedUrl = await getSignedUrl(s3Client, getCommand, { 
        expiresIn: 86400 // 24 hours
      });
      
      const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-west-2'}.amazonaws.com/${s3Key}`;
      
      return {
        key: s3Key,
        url: signedUrl,
        publicUrl,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      };
    } catch (error) {
      console.error(`S3 upload attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to upload file after ${maxRetries} attempts: ${errorMessage}`);
      }
      
      // Wait before retrying
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`Retrying S3 upload in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error('Unexpected error in S3 upload');
}

/**
 * Generates a new signed URL for an existing S3 object
 */
export async function getSignedUrlForFile(s3Key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });
    
    return await getSignedUrl(s3Client, getCommand, { expiresIn });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Utility function to extract metadata from S3 key
 */
export function parseS3Key(s3Key: string) {
  const parts = s3Key.split('/');
  if (parts.length < 4) return null;
  
  const [userId, year, month, day, ...rest] = parts;
  const fileName = rest[rest.length - 1];
  const conversationId = rest.length > 1 ? parseInt(rest[0]) : undefined;
  
  return {
    userId,
    year: parseInt(year),
    month: parseInt(month),
    day: parseInt(day),
    conversationId,
    fileName,
  };
}