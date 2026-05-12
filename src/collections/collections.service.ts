import { Injectable, NotFoundException } from '@nestjs/common';
import { CollectionsRepository } from './collections.repository';
import { TaxpayersRepository } from '../taxpayers/taxpayers.repository';
import { QueryCollectionsDto } from './dto/query-collections.dto';
import { ReceiptFormatter } from './receipt.formatter';

@Injectable()
export class CollectionsService {
  constructor(
    private readonly collectionsRepository: CollectionsRepository,
    private readonly taxpayersRepository: TaxpayersRepository,
  ) {}

  async getMyCollections(taxpayerId: string, query: QueryCollectionsDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const result = await this.collectionsRepository.findByTaxpayer(taxpayerId, {
      page,
      limit,
    });
    return {
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async getReceipt(taxpayerId: string, id: string): Promise<string> {
    const [collection, taxpayer] = await Promise.all([
      this.collectionsRepository.findByIdAndTaxpayer(id, taxpayerId),
      this.taxpayersRepository.findById(taxpayerId),
    ]);

    if (!collection) throw new NotFoundException('Collection not found');

    const declaration = collection.declaration;
    const period = declaration.taxPeriod;
    const tax = Number(declaration.calculatedTaxAmount ?? 0);
    const penalty = Number(declaration.penaltyAmount ?? 0);
    const total = +(tax + penalty).toFixed(2);

    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    return ReceiptFormatter.receipt({
      referenceNumber: collection.referenceNumber,
      collectedAt: collection.collectedAt
        ? fmt(new Date(collection.collectedAt))
        : 'N/A',
      method: collection.method,
      businessName: taxpayer?.businessName ?? 'N/A',
      tin: taxpayer?.tin ?? 'N/A',
      sector: taxpayer?.sector ?? 'N/A',
      period: period.name,
      taxType: declaration.taxType,
      filingDeadline: fmt(new Date(period.filingDeadline)),
      isLate: declaration.isLate,
      taxAmount: `$${tax.toFixed(2)} USD`,
      penalty: penalty > 0 ? `$${penalty.toFixed(2)} USD` : null,
      total: `$${total.toFixed(2)} USD`,
      generatedAt: fmt(new Date()),
    });
  }
}
