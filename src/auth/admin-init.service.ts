import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { hash } from 'argon2';
import { UserRole } from '../generated/prisma';

@Injectable()
export class AdminInitService implements OnModuleInit {
  private readonly logger = new Logger(AdminInitService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const email = this.configService.get<string>('INIT_ADMIN_EMAIL');
    const password = this.configService.get<string>('INIT_ADMIN_PASSWORD');

    if (!email || !password) return;

    const adminExists = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!adminExists) {
      await this.prismaService.user.create({
        data: {
          name: 'Initial Admin',
          email,
          passwordHash: await hash(password),
          role: UserRole.ADMIN,
        },
      });
      this.logger.log(`Initial admin [${email}] created successfully.`);
    }
  }
}
