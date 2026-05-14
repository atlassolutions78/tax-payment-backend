import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/auth.types';
import { RemittancesService } from './remittances.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.AGENT)
@Controller('remittances')
export class RemittancesController {
  constructor(private readonly remittancesService: RemittancesService) {}

  @Post()
  createRemittance(@CurrentUser() user: JwtPayload) {
    return this.remittancesService.createRemittance(user.agentId!);
  }

  @Post(':id/submit')
  submitRemittance(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.remittancesService.submitRemittance(id, user.agentId!);
  }

  @Get()
  getMyRemittances(
    @CurrentUser() user: JwtPayload,
    @Query() query: { page?: string; limit?: string },
  ) {
    return this.remittancesService.getMyRemittances(user.agentId!, query);
  }

  @Get(':id')
  getMyRemittance(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.remittancesService.getMyRemittance(id, user.agentId!);
  }
}
