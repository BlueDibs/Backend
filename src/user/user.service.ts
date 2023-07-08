import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Transaction } from '@prisma/client';
import * as dayjs from 'dayjs';
import { PrismaService } from 'src/Prisma.Service';

@Injectable()
export class UserService {
  constructor(private readonly pService: PrismaService) {}

  generateGraphData(txns: Transaction[]) {
    const graphData: { date: Date; price: number }[] = [];

    for (const day of [0, 1, 2, 3, 4, 5, 6, 7]) {
      const date = {
        x: dayjs().subtract(day, 'day'),
        price: graphData[graphData.length - 1]?.price,
      };

      // calculate price using reverse price addition
      for (const txn of txns) {
        if (dayjs(txn.created).isBefore(date.x)) {
          date.price = txn.newPrice;
          break;
        }
      }

      graphData.push({
        date: date.x.toDate(),
        price: date.price,
      });
    }
    return graphData;
  }

  async sellPlatformEquity(firebaseId: string, percentage: number) {
    const user = await this.pService.user.findFirst({
      where: {
        firebaseId,
      },
    });

    if (!user)
      throw new HttpException('user doesnt exsist', HttpStatus.NOT_FOUND);

    if (percentage < user.userEquity)
      throw new HttpException(
        'user doesnt have this much equity left',
        HttpStatus.FORBIDDEN
      );

    // obtain percentage
    const sellPercentage = (percentage / user.userEquity) * 100;
    let totalPercentage = percentage;
    const platformEquity = user.platformEquiry * (percentage / 100);
    totalPercentage += platformEquity;
    const sharesToSell = user.shares * totalPercentage;
    const balance = sharesToSell * user.price;

    if (sellPercentage > 100)
      throw new HttpException(
        'not enought equity left',
        HttpStatus.UNPROCESSABLE_ENTITY
      );

    // txns
    await this.pService.user.update({
      where: {
        firebaseId,
      },
      data: {
        userEquity: {
          decrement: percentage,
        },
        shares: {
          decrement: sharesToSell,
        },
        platformEquiry: {
          decrement: platformEquity,
        },
        balance: {
          increment: balance,
        },
      },
    });
  }
}