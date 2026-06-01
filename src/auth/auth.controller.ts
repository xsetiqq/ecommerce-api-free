import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterRequest } from './dto/register.dto';
import { LoginRequest } from './dto/login.dto';
import type { Response, Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Authorization } from './decorators/authorization.decorator';
import { Authorized } from './decorators/authorized.decorator';
import { UserRole } from '../generated/prisma';
import { ChangePhotoDto } from './dto/change-photo.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { AuthorizedUser } from './interfaces/authorized-user.interface';
import { CreateAdminDto } from './dto/create-admin.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'User successfully created. Returns a message with email and role',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email already exists',
  })
  public async register(@Body() dto: RegisterRequest) {
    return this.authService.register(dto);
  }

  @ApiBearerAuth()
  @Authorization(UserRole.ADMIN)
  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new admin user',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Admin user successfully created',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied. ADMIN role required',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email already exists',
  })
  public async createAdmin(@Body() dto: CreateAdminDto) {
    return this.authService.createAdmin(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successful login, returns access token (refresh in cookies)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid email or password',
  })
  public async login(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginRequest,
  ) {
    return this.authService.login(res, dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh tokens' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'New token pair successfully issued',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Refresh token is missing, expired, or invalid',
  })
  public async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refresh(req, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout (clear cookie)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successful logout, refresh token removed from cookies',
  })
  public logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @ApiBearerAuth()
  @Authorization(UserRole.USER, UserRole.ADMIN)
  @Get('@me')
  @ApiOperation({
    summary: 'Get current authorized user data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile successfully retrieved',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token is missing, expired, or invalid',
  })
  public me(@Authorized() user: AuthorizedUser) {
    const { name, email, role, photoUrl, createdAt, updatedAt, id } = user;
    const res = {
      id,
      name,
      email,
      role,
      photoUrl,
      createdAt,
      updatedAt,
    };
    return res;
  }

  @Post('change-my-password')
  @Authorization(UserRole.USER, UserRole.ADMIN)
  public async changePassword(
    @Authorized('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(userId, dto);
  }

  @Patch('change-photo')
  @Authorization(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  public async changePhoto(
    @Authorized('id') userId: string,
    @Body() dto: ChangePhotoDto,
  ): Promise<void> {
    await this.authService.updatePhoto(userId, dto);
  }
}
