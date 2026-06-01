import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from './../prisma/prisma.service';
import { RegisterRequest } from './dto/register.dto';
import { LoginRequest } from './dto/login.dto';
import { hash, verify } from 'argon2';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { JwtPayload } from './interfaces/jwt.interface';
import { isDev } from '../utils/is-dev.util';
import { Request, Response } from 'express';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangePhotoDto } from './dto/change-photo.dto';
import type { AuthorizedUser } from './interfaces/authorized-user.interface';
import { User, UserRole } from '../generated/prisma';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AuthService {
  private readonly JWT_ACCESS_TOKEN_TTL: StringValue | number = process.env
    .JWT_ACCESS_TOKEN_TTL as StringValue;
  private readonly JWT_REFRESH_TOKEN_TTL: StringValue | number = process.env
    .JWT_REFRESH_TOKEN_TTL as StringValue;

  private readonly COOKIE_DOMAIN: string;

  public constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.JWT_ACCESS_TOKEN_TTL = configService.getOrThrow<StringValue>(
      'JWT_ACCESS_TOKEN_TTL',
    );
    this.JWT_REFRESH_TOKEN_TTL = configService.getOrThrow<StringValue>(
      'JWT_REFRESH_TOKEN_TTL',
    );
    this.COOKIE_DOMAIN = configService.getOrThrow<string>('COOKIE_DOMAIN');
  }

  public async register(dto: RegisterRequest) {
    const { name, email, password, photoUrl } = dto;

    const existUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.prismaService.user.create({
      data: {
        name,
        email,
        passwordHash: await hash(password),
        photoUrl,
        role: UserRole.USER,
      },
    });

    return {
      message: `User ${user.email} successfully created with role ${user.role}`,
    };
  }
  public async createAdmin(dto: CreateAdminDto) {
    const { name, email, password, photoUrl } = dto;

    const existUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.prismaService.user.create({
      data: {
        name,
        email,
        passwordHash: await hash(password),
        photoUrl,
        role: UserRole.ADMIN,
      },
    });

    return {
      message: `Admin ${user.email} successfully created`,
    };
  }

  public async login(res: Response, dto: LoginRequest) {
    const { email, password } = dto;

    const user = await this.prismaService.user.findUnique({
      where: {
        email,
        isActive: true,
      },
      select: {
        id: true,
        passwordHash: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid login or password');
    }

    const isValidPassword = await verify(user.passwordHash, password);

    if (!isValidPassword) {
      throw new NotFoundException('Invalid login or password');
    }

    return this.auth(res, user.id, user.role);
  }

  public async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies['refreshToken'] as string;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prismaService.user.findUnique({
      where: {
        id: payload.id,
        isActive: true,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.auth(res, user.id, user.role);
  }

  public logout(res: Response) {
    this.setCookie(res, '', new Date(0));
    return true;
  }

  public async validate(id: string): Promise<AuthorizedUser> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        photoUrl: true,
        role: true,
        isDelete: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  public async changePassword(
    id: string,
    dto: ChangePasswordDto,
  ): Promise<User> {
    return await this.prismaService.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          passwordHash: await hash(dto.passwordHash),
        },
      });
      return updatedUser;
    });
  }

  public async updatePhoto(id: string, dto: ChangePhotoDto): Promise<User> {
    return await this.prismaService.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          photoUrl: dto.photoUrl,
        },
      });
      return updatedUser;
    });
  }

  private auth(res: Response, userId: string, role: string) {
    const { accessToken, refreshToken } = this.generateTokens(userId, role);

    this.setCookie(
      res,
      refreshToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );

    return { accessToken };
  }

  private generateTokens(userId: string, role: string) {
    const payload: JwtPayload = { id: userId, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_ACCESS_TOKEN_TTL,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_REFRESH_TOKEN_TTL,
    });

    return { accessToken, refreshToken };
  }

  private setCookie(res: Response, value: string, expires: Date) {
    const isDevelopment: boolean = isDev(this.configService);
    res.cookie('refreshToken', value, {
      httpOnly: true,
      domain: this.COOKIE_DOMAIN,
      expires,
      secure: !isDevelopment,
      sameSite: isDevelopment ? 'lax' : 'none',
    });
  }
}
