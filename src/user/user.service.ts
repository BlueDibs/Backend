import { Injectable } from '@nestjs/common';
import { Transaction } from '@prisma/client';
import * as dayjs from 'dayjs';

@Injectable()
export class UserService {
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
}
