import {
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
  Logger,
  NotFoundException,
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
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
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
  private readonly userBucketName: string;
  private readonly workspaceBucketName: string;

  private readonly userBucketSeedFileName: string;
  private readonly userBucketSeedObjectKey: string;

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
      this.configService.get<string>('MINIO_BUCKET_NAME') ?? 'default-bucket';
    this.userBucketName =
      this.configService.get<string>('MINIO_USER_BUCKET_NAME') ??
      'netiak-users';

    // Имя нового публичного бакета
    this.workspaceBucketName =
      this.configService.get<string>('MINIO_WORKSPACE_BUCKET_NAME') ??
      'workspace-attachments';

    this.userBucketSeedFileName =
      this.configService.get<string>('MINIO_USER_BUCKET_SEED_FILE') ??
      'TestUser.png';
    this.userBucketSeedObjectKey =
      this.configService.get<string>('MINIO_USER_BUCKET_SEED_KEY') ??
      `${this.userBucketSeedFileName}`;
  }

  public async onModuleInit(): Promise<void> {
    await this.ensureBucketExists();
    await this.ensureUserBucketExists();
    await this.ensureWorkspaceBucketExists();
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
    } catch (error) {
      if (error instanceof S3ServiceException && error.name === 'NotFound') {
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucketName }),
        );
        await this.makeSupportBucketPublicIfNeeded();
        this.logger.log(`Бакет "${this.bucketName}" успешно создан`);
      } else {
        this.logger.error('Ошибка при проверке/создании бакета', error);
      }
    }
  }

  private async makeSupportBucketPublicIfNeeded(): Promise<void> {
    if (this.bucketName !== 'support-files') {
      return;
    }

    // NOTE: Публичность support-files настраивается здесь.
    // Если в будущем понадобится закрыть доступ, удалите/измените эту policy.
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucketName}/*`],
        },
      ],
    };

    await this.s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: this.bucketName,
        Policy: JSON.stringify(policy),
      }),
    );
    this.logger.log(
      `Для бакета "${this.bucketName}" включено публичное чтение`,
    );
  }

  private async ensureWorkspaceBucketExists(): Promise<void> {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.workspaceBucketName }),
      );
    } catch (error) {
      if (error instanceof S3ServiceException && error.name === 'NotFound') {
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.workspaceBucketName }),
        );

        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'PublicReadGetObjectWorkspace',
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.workspaceBucketName}/*`],
            },
          ],
        };

        await this.s3Client.send(
          new PutBucketPolicyCommand({
            Bucket: this.workspaceBucketName,
            Policy: JSON.stringify(policy),
          }),
        );

        this.logger.log(
          `Бакет "${this.workspaceBucketName}" успешно создан и открыт для чтения`,
        );
      } else {
        this.logger.error(
          'Ошибка при проверке/создании публичного бакета воркспейсов',
          error,
        );
      }
    }
  }

  private async ensureUserBucketExists(): Promise<void> {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.userBucketName }),
      );
    } catch (error) {
      if (error instanceof S3ServiceException && error.name === 'NotFound') {
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.userBucketName }),
        );
        this.logger.log(`Бакет "${this.userBucketName}" успешно создан`);
        await this.seedUserBucket();
      } else {
        this.logger.error(
          'Ошибка при проверке/создании пользовательского бакета',
          error,
        );
      }
    }
  }

  private async seedUserBucket(): Promise<void> {
    const filePath = resolve(
      process.cwd(),
      'assets',
      this.userBucketSeedFileName,
    );

    try {
      const fileBuffer = await readFile(filePath);
      const fileExtension = extname(this.userBucketSeedFileName).toLowerCase();
      const contentType =
        fileExtension === '.png' ? 'image/png' : 'application/octet-stream';

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.userBucketName,
          Key: this.userBucketSeedObjectKey,
          Body: fileBuffer,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000',
        }),
      );

      this.logger.log(
        `Стартовый файл "${this.userBucketSeedFileName}" загружен в "${this.userBucketName}" как "${this.userBucketSeedObjectKey}"`,
      );
    } catch (error) {
      this.logger.warn(
        `Не удалось загрузить стартовый файл из ${filePath}. Бакет создан без seed-файла.`,
      );
      this.logger.debug(error);
    }
  }

  public async uploadFile(file: UploadedFileLike): Promise<{
    url: string;
    mimeType: string;
    key: string;
    originalName: string;
  }> {
    // Иногда Multer искажает кириллицу в originalname, Buffer помогает это исправить
    const safeOriginalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    const fileExtension = safeOriginalName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: uniqueFileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          // NOTE: privacy самих объектов для support-files управляется bucket policy выше.
          CacheControl: 'private, max-age=86400',
        }),
      );

      const endpoint = this.configService.get<string>('MINIO_ENDPOINT');

      return {
        url: `${endpoint}/${this.bucketName}/${uniqueFileName}`,
        mimeType: file.mimetype,
        key: uniqueFileName,
        originalName: safeOriginalName, // Возвращаем реальное имя файла
      };
    } catch (error) {
      this.logger.error('Ошибка загрузки файла в MinIO', error);
      throw new InternalServerErrorException('Ошибка при сохранении файла');
    }
  }

  public async deleteFile(fileName: string): Promise<{ success: boolean }> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
        }),
      );
      return { success: true };
    } catch (error) {
      this.logger.error(`Ошибка удаления файла: ${fileName}`, error);
      throw new InternalServerErrorException('Не удалось удалить файл');
    }
  }

  public async uploadUserFile(file: UploadedFileLike): Promise<{
    url: string;
    mimeType: string;
    key: string;
    originalName: string;
  }> {
    const safeOriginalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    const fileExtension = safeOriginalName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.userBucketName,
          Key: uniqueFileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl: 'private, max-age=86400',
        }),
      );

      const endpoint = this.configService.get<string>('MINIO_ENDPOINT');

      return {
        url: `${endpoint}/${this.userBucketName}/${uniqueFileName}`,
        mimeType: file.mimetype,
        key: uniqueFileName,
        originalName: safeOriginalName,
      };
    } catch (error) {
      this.logger.error(
        'Ошибка загрузки файла в пользовательский бакет',
        error,
      );
      throw new InternalServerErrorException('Ошибка при сохранении файла');
    }
  }

  public async deleteUserFile(fileName: string): Promise<{ success: boolean }> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.userBucketName,
          Key: fileName,
        }),
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Ошибка удаления файла из пользовательского бакета: ${fileName}`,
        error,
      );
      throw new InternalServerErrorException('Не удалось удалить файл');
    }
  }

  public async getUserFileContent(fileName: string): Promise<{
    buffer: Buffer;
    contentType: string;
    cacheControl: string;
  }> {
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.userBucketName,
          Key: fileName,
          ResponseCacheControl: 'private, max-age=86400',
        }),
      );

      if (!response.Body) {
        throw new NotFoundException('Файл не найден');
      }

      const bytes = await response.Body.transformToByteArray();

      return {
        buffer: Buffer.from(bytes),
        contentType: response.ContentType ?? 'application/octet-stream',
        cacheControl: response.CacheControl ?? 'private, max-age=86400',
      };
    } catch (error) {
      if (
        error instanceof S3ServiceException &&
        (error.name === 'NotFound' || error.name === 'NoSuchKey')
      ) {
        throw new NotFoundException('Файл не найден');
      }

      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Ошибка получения файла из пользовательского бакета: ${fileName}`,
        error,
      );
      throw new InternalServerErrorException('Не удалось получить файл');
    }
  }
  // ==========================================
  // ПУБЛИЧНЫЕ ФАЙЛЫ ВОРКСПЕЙСА
  // ==========================================

  public async uploadWorkspaceFile(file: UploadedFileLike): Promise<{
    url: string;
    mimeType: string;
    key: string;
    originalName: string;
  }> {
    const safeOriginalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );
    const fileExtension = safeOriginalName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.workspaceBucketName,
          Key: uniqueFileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          // Файлы публичные, так что можем безопасно кешировать их на клиенте
          CacheControl: 'public, max-age=31536000',
        }),
      );

      const endpoint = this.configService.get<string>('MINIO_ENDPOINT');

      return {
        url: `${endpoint}/${this.workspaceBucketName}/${uniqueFileName}`,
        mimeType: file.mimetype,
        key: uniqueFileName,
        originalName: safeOriginalName,
      };
    } catch (error) {
      this.logger.error('Ошибка загрузки файла воркспейса', error);
      throw new InternalServerErrorException(
        'Ошибка при сохранении файла воркспейса',
      );
    }
  }

  public async deleteWorkspaceFile(
    fileName: string,
  ): Promise<{ success: boolean }> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.workspaceBucketName,
          Key: fileName,
        }),
      );
      return { success: true };
    } catch (error) {
      this.logger.error(`Ошибка удаления файла воркспейса: ${fileName}`, error);
      throw new InternalServerErrorException(
        'Не удалось удалить файл воркспейса',
      );
    }
  }
}
