import { applyDecorators, UseGuards } from '@nestjs/common';

import { JwtGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';
import { UserRoles } from '../../generated/prisma';

export function Authorization(...roles: UserRoles[]) {
  if (roles.length > 0) {
    return applyDecorators(Roles(...roles), UseGuards(JwtGuard, RolesGuard));
  }

  return applyDecorators(UseGuards(JwtGuard));
}
