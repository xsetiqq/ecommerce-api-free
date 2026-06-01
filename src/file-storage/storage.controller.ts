import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FileStorageService } from './storage.service';
import { Authorization } from '../auth/decorators/authorization.decorator';
import { UserRole } from '../generated/prisma';

interface UploadedFileLike {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}

@ApiTags('Product Images')
@ApiBearerAuth()
@Authorization(UserRole.ADMIN)
@Controller('upload')
export class FileStorageController {
  private static readonly ALLOWED_IMAGE_MIME_TYPES = new Set<string>([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);

  private static readonly ALLOWED_IMAGE_EXTENSIONS = new Set<string>([
    'jpg',
    'jpeg',
    'png',
    'webp',
  ]);

  constructor(private readonly fileStorageService: FileStorageService) {}

  @Post('products')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a product image',
    description: 'Uploads a product image to the product-images bucket.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Product image file. Allowed types: jpg, jpeg, png, webp. Max size: 10 MB.',
        },
      },
      required: ['file'],
    },
  })
  public async uploadProductImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 })],
      }),
    )
    file: UploadedFileLike,
  ) {
    this.validateProductImage(file);
    return this.fileStorageService.uploadProductImage(file);
  }

  @Delete('products')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a product image',
    description:
      'Deletes a product image from the product-images bucket by object key.',
  })
  @ApiQuery({
    name: 'key',
    required: true,
    description: 'Product image object key returned by upload endpoint.',
    example: 'f2ea5c4a-4d55-4d2e-a091-4e8ffb2741fd.webp',
  })
  public async deleteProductImage(@Query('key') key: string) {
    if (!key) {
      throw new BadRequestException('Image key is required');
    }

    return this.fileStorageService.deleteProductImage(key);
  }

  private validateProductImage(file: UploadedFileLike): void {
    const mimeType = file.mimetype?.split(';')[0]?.trim().toLowerCase() ?? '';
    const extension =
      file.originalname?.split('.').pop()?.trim().toLowerCase() ?? '';

    const isAllowedMime =
      FileStorageController.ALLOWED_IMAGE_MIME_TYPES.has(mimeType);
    const isAllowedExtension =
      extension.length > 0 &&
      FileStorageController.ALLOWED_IMAGE_EXTENSIONS.has(extension);

    if (!isAllowedMime || !isAllowedExtension) {
      throw new BadRequestException(
        'Unsupported product image type. Allowed types: jpg, jpeg, png, webp',
      );
    }
  }
}
