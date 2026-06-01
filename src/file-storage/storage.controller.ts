import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  Get,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileStorageService } from './storage.service';
import { Authorization } from '../auth/decorators/authorization.decorator';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';

interface UploadedFileLike {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}

@ApiTags('File Storage')
// @Authorization()
@Controller('upload') // Вынес upload в уровень контроллера для чистоты
export class FileStorageController {
  private static readonly ALLOWED_MIME_TYPES = new Set<string>([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-matroska',
    'audio/mpeg',
    'audio/ogg',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/vnd.rar',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',
    'application/x-gzip',
  ]);

  private static readonly ALLOWED_EXTENSIONS = new Set<string>([
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'pdf',
    'mp4',
    'mov',
    'webm',
    'mkv',
    'mp3',
    'ogg',
    'doc',
    'xls',
    'ppt',
    'docx',
    'xlsx',
    'pptx',
    'odt',
    'ods',
    'odp',
    'zip',
    'rar',
    '7z',
    'tar',
    'gz',
    'tgz',
  ]);

  constructor(private readonly fileStorageService: FileStorageService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Загрузить файл поддержки',
    description:
      'Загружает файл в бакет support-files для хранения файлов системы поддержки.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Файл (максимум 100 МБ)',
        },
      },
      required: ['file'],
    },
  })
  public async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 100 })],
      }),
    )
    file: UploadedFileLike,
  ) {
    this.validateFileType(file);
    return this.fileStorageService.uploadFile(file);
  }

  @Delete(':fileName')
  @ApiOperation({
    summary: 'Удалить файл поддержки',
    description: 'Удаляет файл из бакета support-files.',
  })
  public async deleteFile(@Param('fileName') fileName: string) {
    return this.fileStorageService.deleteFile(fileName);
  }

  @Post('user')
  @Authorization()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Загрузить файл пользователя',
    description:
      'Загружает файл в бакет netiak-users для хранения файлов пользователей (аватары, документы). Требует авторизации.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Файл (максимум 100 МБ)',
        },
      },
      required: ['file'],
    },
  })
  public async uploadUserFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 24 })],
      }),
    )
    file: UploadedFileLike,
  ) {
    this.validateFileType(file);
    return this.fileStorageService.uploadUserFile(file);
  }

  @Delete('user/:fileName')
  @Authorization()
  @ApiOperation({
    summary: 'Удалить файл пользователя',
    description: 'Удаляет файл из бакета netiak-users. Требует авторизации.',
  })
  public async deleteUserFile(@Param('fileName') fileName: string) {
    return this.fileStorageService.deleteUserFile(fileName);
  }

  @Get('user/:fileName/content')
  @Authorization()
  @ApiOperation({
    summary: 'Получить содержимое файла пользователя',
    description:
      'Возвращает содержимое файла из бакета netiak-users. Требует авторизации.',
  })
  public async getUserFileContent(
    @Param('fileName') fileName: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.fileStorageService.getUserFileContent(fileName);

    res.setHeader('Cache-Control', file.cacheControl);

    return new StreamableFile(file.buffer, {
      type: file.contentType,
      disposition: 'inline',
      length: file.buffer.length,
    });
  }

  // ==========================================
  // ПУБЛИЧНЫЕ ФАЙЛЫ ДОСОК И КАРТОЧЕК
  // ==========================================

  @Post('workspace')
  @Authorization()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Загрузить вложение воркспейса',
    description: 'Загружает файл в публичный бакет workspace-attachments.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Файл (макс 100 МБ)',
        },
      },
      required: ['file'],
    },
  })
  public async uploadWorkspaceFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 100 })],
      }),
    )
    file: UploadedFileLike,
  ) {
    this.validateFileType(file);
    return this.fileStorageService.uploadWorkspaceFile(file);
  }

  @Delete('workspace/:fileName')
  @Authorization()
  @ApiOperation({
    summary: 'Удалить вложение воркспейса',
    description: 'Удаляет файл из публичного бакета workspace-attachments.',
  })
  public async deleteWorkspaceFile(@Param('fileName') fileName: string) {
    return this.fileStorageService.deleteWorkspaceFile(fileName);
  }

  private validateFileType(file: UploadedFileLike): void {
    const mimeType = file.mimetype?.split(';')[0]?.trim().toLowerCase() ?? '';
    const extension =
      file.originalname?.split('.').pop()?.trim().toLowerCase() ?? '';

    const isAllowedMime =
      FileStorageController.ALLOWED_MIME_TYPES.has(mimeType);
    const isAllowedExtension =
      extension.length > 0 &&
      FileStorageController.ALLOWED_EXTENSIONS.has(extension);

    if (!isAllowedMime && !isAllowedExtension) {
      throw new BadRequestException('Неподдерживаемый тип файла');
    }
  }
}
