import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from '../users/users.repository';
import { TaxpayersRepository } from '../taxpayers/taxpayers.repository';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly taxpayersRepository: TaxpayersRepository,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const invalid = () => new UnauthorizedException('Invalid credentials');

    if (dto.identifier.includes('@')) {
      const user = await this.usersRepository.findByEmail(dto.identifier);
      if (!user) throw invalid();

      const valid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!valid) throw invalid();

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        ...(user.agent && { agentId: user.agent.id }),
      };

      return {
        accessToken: this.jwt.sign(payload),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          ...(user.agent && {
            agentId: user.agent.id,
            assignedZone: user.agent.assignedZone,
          }),
        },
      };
    } else {
      const taxpayer = await this.taxpayersRepository.findByTin(dto.identifier);
      if (!taxpayer) throw invalid();

      const valid = await bcrypt.compare(
        dto.password,
        taxpayer.user.passwordHash,
      );
      if (!valid) throw invalid();

      const payload: JwtPayload = {
        sub: taxpayer.user.id,
        email: taxpayer.user.email,
        role: taxpayer.user.role,
        taxpayerId: taxpayer.id,
      };

      return {
        accessToken: this.jwt.sign(payload),
        user: {
          id: taxpayer.user.id,
          name: taxpayer.user.name,
          email: taxpayer.user.email,
          role: taxpayer.user.role,
          taxpayerId: taxpayer.id,
          tin: taxpayer.tin,
          businessName: taxpayer.businessName,
        },
      };
    }
  }

  async me(payload: JwtPayload) {
    const user = await this.usersRepository.findById(payload.sub);
    if (!user) throw new UnauthorizedException();

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ...(user.taxpayer && {
        taxpayerId: user.taxpayer.id,
        tin: user.taxpayer.tin,
        businessName: user.taxpayer.businessName,
        sector: user.taxpayer.sector,
        status: user.taxpayer.status,
      }),
      ...(user.agent && {
        agentId: user.agent.id,
        assignedZone: user.agent.assignedZone,
        isActive: user.agent.isActive,
      }),
    };
  }
}
