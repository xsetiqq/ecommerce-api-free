import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma';

export class ProfileResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Smith' })
  lastName: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2001-05-20T00:00:00.000Z',
    nullable: true,
  })
  dateOfBirth: Date | null;

  @ApiProperty({ example: 'john.smith@example.com', format: 'email' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role: UserRole;

  @ApiProperty({
    type: String,
    format: 'uri',
    example: 'https://example.com/avatar.webp',
    nullable: true,
  })
  photoUrl: string | null;

  @ApiProperty({
    example: '2026-06-15T18:00:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-06-16T10:30:00.000Z',
    format: 'date-time',
  })
  updatedAt: Date;
}
