import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'scribeai-audio-uploads';

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadAudioToS3(
  buffer: Buffer,
  fileName: string,
  contentType: string = 'audio/webm'
): Promise<string> {
  const key = `audio/${Date.now()}-${fileName}`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    },
  });

  await upload.done();
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

export { s3Client, bucketName };
