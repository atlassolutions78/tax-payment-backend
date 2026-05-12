import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { DeclarationsService } from './declarations.service';
import { CreateDeclarationDto } from './dto/create-declaration.dto';
import { QueryDeclarationsDto } from './dto/query-declarations.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import type { JwtPayload } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TAXPAYER)
@Controller('declarations')
export class DeclarationsController {
  constructor(private readonly declarationsService: DeclarationsService) {}

  @Get()
  getMyDeclarations(@CurrentUser() user: JwtPayload, @Query() query: QueryDeclarationsDto) {
    return this.declarationsService.getMyDeclarations(user.taxpayerId!, query);
  }

  @Get(':id')
  getMyDeclaration(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.declarationsService.getMyDeclaration(user.taxpayerId!, id);
  }

  @Post()
  createDeclaration(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDeclarationDto,
  ) {
    return this.declarationsService.createDeclaration(user.taxpayerId!, dto);
  }
}
