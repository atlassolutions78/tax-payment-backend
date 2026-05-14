import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RemittanceStatus } from '@prisma/client';
import { RemittancesRepository } from './remittances.repository';
import { DisputeRemittanceDto } from './dto/dispute-remittance.dto';

@Injectable()
export class RemittancesService {
  constructor(private readonly remittancesRepository: RemittancesRepository) {}

  async createRemittance(agentId: string) {
    const unlinked = await this.remittancesRepository.findUnlinkedCollections(agentId);
    if (unlinked.length === 0) {
      throw new BadRequestException('No unremitted collections to bundle');
    }
    const total = unlinked.reduce((sum, c) => sum + Number(c.amount), 0);
    return this.remittancesRepository.create(
      agentId,
      unlinked.map((c) => c.id),
      total,
    );
  }

  async submitRemittance(id: string, agentId: string) {
    const remittance = await this.remittancesRepository.findById(id);
    if (!remittance) throw new NotFoundException('Remittance not found');
    if (remittance.agentId !== agentId) throw new ForbiddenException();
    if (remittance.status !== RemittanceStatus.OPEN) {
      throw new BadRequestException('Only OPEN remittances can be submitted');
    }
    return this.remittancesRepository.submit(id);
  }

  async getMyRemittances(agentId: string, query: { page?: string; limit?: string }) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const result = await this.remittancesRepository.findByAgent(agentId, { page, limit });
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

  async getMyRemittance(id: string, agentId: string) {
    const remittance = await this.remittancesRepository.findById(id);
    if (!remittance) throw new NotFoundException('Remittance not found');
    if (remittance.agentId !== agentId) throw new ForbiddenException();
    return remittance;
  }

  async getAllRemittances(query: {
    status?: RemittanceStatus;
    agentId?: string;
    page?: string;
    limit?: string;
  }) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const result = await this.remittancesRepository.findAll(
      { status: query.status, agentId: query.agentId },
      { page, limit },
    );
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

  async getRemittanceById(id: string) {
    const remittance = await this.remittancesRepository.findById(id);
    if (!remittance) throw new NotFoundException('Remittance not found');
    return remittance;
  }

  async confirmRemittance(id: string, officerId: string) {
    const remittance = await this.remittancesRepository.findById(id);
    if (!remittance) throw new NotFoundException('Remittance not found');
    if (remittance.status !== RemittanceStatus.SUBMITTED) {
      throw new BadRequestException('Only SUBMITTED remittances can be confirmed');
    }
    return this.remittancesRepository.confirm(id, officerId);
  }

  async disputeRemittance(id: string, dto: DisputeRemittanceDto) {
    const remittance = await this.remittancesRepository.findById(id);
    if (!remittance) throw new NotFoundException('Remittance not found');
    if (
      remittance.status !== RemittanceStatus.SUBMITTED &&
      remittance.status !== RemittanceStatus.CONFIRMED
    ) {
      throw new BadRequestException('Only SUBMITTED or CONFIRMED remittances can be disputed');
    }
    return this.remittancesRepository.dispute(id, dto.note);
  }

  getSummary() {
    return this.remittancesRepository.getSummary();
  }
}
