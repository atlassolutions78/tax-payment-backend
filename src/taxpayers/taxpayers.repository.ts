import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaxpayersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByTin(tin: string) {
    return this.prisma.taxpayer.findUnique({
      where: { tin },
      include: { user: true },
    });
  }

  findById(id: string) {
    return this.prisma.taxpayer.findUnique({
      where: { id },
    });
  }
}
