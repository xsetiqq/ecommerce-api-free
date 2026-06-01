import { User } from '../../generated/prisma';

export type AuthorizedUser = Omit<User, 'passwordHash'>;
