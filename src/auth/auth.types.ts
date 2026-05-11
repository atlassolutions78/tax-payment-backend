import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  taxpayerId?: string;
  agentId?: string;
}
