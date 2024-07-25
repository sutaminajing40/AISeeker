import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { fromIni } from '@aws-sdk/credential-providers'

export class S3Service {
  private s3Client: S3Client
  private bucketName: string
  private environment: string

  constructor() {
    this.s3Client = new S3Client({
      region: 'ap-northeast-1',
      credentials: fromIni({ profile: 'private_AISeeker' }),
    })
    if (!process.env.S3_BUCKET_NAME) {
      throw new Error('S3_BUCKET_NAME環境変数が設定されていません。')
    }
    this.bucketName = process.env.S3_BUCKET_NAME || ''
    this.environment = process.env.ENVIRONMENT || 'dev'
  }

  private getFullKey(key: string): string {
    return `${this.environment}/${key}`
  }

  async uploadToS3(key: string, body: Buffer): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: this.getFullKey(key),
      Body: body,
    })
    await this.s3Client.send(command)
    return this.getFullKey(key)
  }

  async getFromS3(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: this.getFullKey(key),
    })
    const response = await this.s3Client.send(command)
    return Buffer.from(await response.Body!.transformToByteArray())
  }

  async deleteFromS3(): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: this.environment,
    })
    await this.s3Client.send(command)
  }
}
