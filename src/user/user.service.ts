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

    if (percentage > user.userEquity)
      throw new HttpException(
        'user doesnt have this much equity left',
        HttpStatus.FORBIDDEN
      );

    // example : percentage = 2.5%, user.platformEquity = 2.5%, user.userEquity = 10%
    // obtain percentage
    const sellPercentage = (percentage / user.userEquity) * 100;
    let totalPercentage = percentage;
    const platformEquity = user.platformEquity * (sellPercentage / 100);
    totalPercentage += platformEquity;
    const sharesToSell = user.shares * (totalPercentage / 100);
    const balance = user.shares * (percentage / 100) * user.price;

    console.log(totalPercentage);

    if (sellPercentage > 100)
      throw new HttpException('not enought equity left', HttpStatus.FORBIDDEN);

    // txns
    await this.pService.user.update({
      where: {
        firebaseId,
      },
      data: {
        // atomic increment not woring
        userEquity: user.userEquity - percentage,
        shares: user.shares - sharesToSell,
        platformEquity: user.platformEquity - platformEquity,
        balance: user.balance + balance,
      },
    });
  }
}
