import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/Prisma.Service';

@Injectable()
export class HoldingService {
  constructor(private readonly pService: PrismaService) {}

  async getUserHoldings(firebaseId: string) {
    const holdings = await this.pService.holding.findMany({
      where: {
        buyerUser: {
          firebaseId: firebaseId,
        },
      },
      include: {
        sellerUser: {
          select: { id: true, price: true, username: true },
        },
      },
    });

    return holdings.map((item) => ({
      ...item,
      value: item.amount * item.sellerUser.price,
    }));
  }
}
