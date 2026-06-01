import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  S3ServiceException,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

interface UploadedFileLike {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}

@Injectable()
export class FileStorageService implements OnModuleInit {
  private readonly logger = new Logger(FileStorageService.name);

  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      endpoint: this.configService.get<string>('MINIO_ENDPOINT'),
      forcePathStyle: true,
      region: this.configService.get<string>('MINIO_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('MINIO_ROOT_USER') ?? '',
        secretAccessKey:
          this.configService.get<string>('MINIO_ROOT_PASSWORD') ?? '',
      },
    });

    this.bucketName =
      this.configService.get<string>('MINIO_BUCKET_NAME') ?? 'product-images';
  }

  public async onModuleInit(): Promise<void> {
    await this.ensureProductImagesBucketExists();
  }

  private async ensureProductImagesBucketExists(): Promise<void> {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
    } catch (error) {
      if (error instanceof S3ServiceException && error.name === 'NotFound') {
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucketName }),
        );
        this.logger.log(`Bucket "${this.bucketName}" was created`);
      } else {
        this.logger.error(
          'Failed to check or create product images bucket',
          error,
        );
        throw new InternalServerErrorException(
          'Failed to initialize product images storage',
        );
      }
    }

    await this.makeProductImagesBucketPublic();
  }

  private async makeProductImagesBucketPublic(): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadProductImages',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucketName}/*`],
        },
      ],
    };

    try {
      await this.s3Client.send(
        new PutBucketPolicyCommand({
          Bucket: this.bucketName,
          Policy: JSON.stringify(policy),
        }),
      );
      this.logger.log(`Public read policy enabled for "${this.bucketName}"`);
    } catch (error) {
      this.logger.error('Failed to set product images bucket policy', error);
      throw new InternalServerErrorException(
        'Failed to initialize product images storage policy',
      );
    }
  }

  public async uploadProductImage(file: UploadedFileLike): Promise<{
    url: string;
    mimeType: string;
    key: string;
    originalName: string;
  }> {
    const safeOriginalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    const fileExtension = safeOriginalName.split('.').pop()?.toLowerCase();

    if (!fileExtension) {
      throw new BadRequestException('Product image extension is required');
    }

    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: uniqueFileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl: 'public, max-age=31536000',
        }),
      );

      const endpoint = this.configService.get<string>('MINIO_ENDPOINT');

      return {
        url: `${endpoint}/${this.bucketName}/${uniqueFileName}`,
        mimeType: file.mimetype,
        key: uniqueFileName,
        originalName: safeOriginalName,
      };
    } catch (error) {
      this.logger.error('Failed to upload product image to MinIO', error);
      throw new InternalServerErrorException('Failed to save product image');
    }
  }

  public async deleteProductImage(key: string): Promise<{ success: boolean }> {
    this.validateProductImageKey(key);

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete product image: ${key}`, error);
      throw new InternalServerErrorException('Failed to delete product image');
    }
  }

  private validateProductImageKey(key: string): void {
    const isValid = /^[a-f0-9-]+\.(jpg|jpeg|png|webp)$/i.test(key);

    if (!isValid) {
      throw new BadRequestException('Invalid product image key');
    }
  }
}
