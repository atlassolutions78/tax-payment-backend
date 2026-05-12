import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { CollectionsService } from './collections.service';
import { QueryCollectionsDto } from './dto/query-collections.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import type { JwtPayload } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TAXPAYER)
@Controller('payments')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  getMyCollections(@CurrentUser() user: JwtPayload, @Query() query: QueryCollectionsDto) {
    return this.collectionsService.getMyCollections(user.taxpayerId!, query);
  }

  @Get(':id/receipt')
  async getReceipt(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const html = await this.collectionsService.getReceipt(user.taxpayerId!, id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
