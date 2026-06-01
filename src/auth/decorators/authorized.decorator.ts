import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthorizedUser } from '../interfaces/authorized-user.interface';

export interface RequestWithUser extends Request {
  user: AuthorizedUser;
}

export const Authorized = createParamDecorator(
  (data: keyof AuthorizedUser, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    const user = request.user;

    return data ? user[data] : user;
  },
);
