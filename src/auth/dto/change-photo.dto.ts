import { IsOptional, IsString } from 'class-validator';

export class ChangePhotoDto {
  @IsOptional()
  @IsString()
  photoUrl: string | null;
}
