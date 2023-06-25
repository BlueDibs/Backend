import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Holding } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { PrismaService } from 'src/Prisma.Service';

const buySchema = z.object({
  amount: z.number(),
});

const sellSchema = z.object({
  amount: z.number(),
});

class buyDTO extends createZodDto(buySchema) {}
class sellDTO extends createZodDto(sellSchema) {}

@Controller('holding')
export class HoldingsController {
  constructor(private readonly pService: PrismaService) {}

  @Get()
  async getUserHoldings(@Req() req) {
    const holdings = await this.pService.holding.findMany({
      where: {
        buyerUser: {
          firebaseId: req.user.user_id,
        },
      },
      include: {
        sellerUser: true,
      },
    });

    return holdings.map((item) => ({
      ...item,
      value: item.amount * item.sellerUser.price,
    }));
  }

  /**
   *
   * @param userId
   * @param body
   * @param req
   * @name  BuyShares
   */
  @Post('buy/:userId')
  async buy(@Param('userId') userId, @Body() body: buyDTO, @Req() req) {
    const seller_user = await this.pService.user.findFirst({
      where: {
        id: userId,
      },
      include: {
        Sold: true,
      },
    });

    if (!seller_user)
      throw new HttpException('Seller User not found', HttpStatus.NOT_FOUND);

    const sharesAmountSold: number = seller_user?.Sold.reduce<number | Holding>(
      (prev, cur) => {
        if (typeof prev == 'number') return prev + cur.amount;
        else return prev.amount + cur.amount;
      },
      0
    ) as number;

    if (seller_user?.shares - sharesAmountSold < body.amount) {
      throw new HttpException(
        'doesnt doesnt have this amount of shares left',
        HttpStatus.UNPROCESSABLE_ENTITY
      );
    }

    const amountToPay = body.amount * seller_user.price;
    const totalAmountToPay = amountToPay + (amountToPay * 0.2) / 100;

    // buyer
    const buyer = await this.pService.user.findFirst({
      where: {
        id: req.user.id,
      },
    });

    if (totalAmountToPay > (buyer?.balance || 0))
      throw new HttpException('not enought balance', HttpStatus.FORBIDDEN);

    const createHolding = this.pService.holding.upsert({
      where: {
        buyer_id_seller_id: {
          seller_id: userId,
          buyer_id: req.user.id,
        },
      },
      create: {
        seller_id: userId,
        buyer_id: req.user.id,
        amount: body.amount,
        price: seller_user.price,
      },
      update: {
        amount: {
          increment: body.amount,
        },
      },
    });

    const newPrice = seller_user.price + totalAmountToPay / seller_user.shares;

    const mutatePrice = this.pService.user.update({
      where: {
        id: seller_user.id,
      },
      data: {
        price: newPrice,
      },
    });

    const txn = this.pService.transaction.create({
      data: {
        buyer_id: req.user.id,
        seller_id: userId,
        amount: body.amount,
        newPrice,
        price: seller_user.price,
      },
    });

    /**
     *  @description  Wallet deduct & 0.2 increment on seller wallet
     */
    const deductTxn = this.pService.user.update({
      where: {
        id: buyer?.id,
      },
      data: {
        balance: {
          decrement: totalAmountToPay,
        },
      },
    });
    const incmtSellerBal = this.pService.user.update({
      where: {
        id: seller_user.id,
      },
      data: {
        balance: {
          increment: (amountToPay * 0.2) / 100,
        },
      },
    });

    await this.pService.$transaction([
      createHolding,
      mutatePrice,
      txn,
      deductTxn,
      incmtSellerBal,
    ]);
  }

  @Post('sell/:userId')
  async sell(@Param('userId') userId, @Body() body: sellDTO, @Req() req) {
    const share_owner = await this.pService.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!share_owner)
      throw new HttpException('seller user not found', HttpStatus.NOT_FOUND);

    const cur_usr_hld_amnt = await this.pService.holding.findUnique({
      where: {
        buyer_id_seller_id: {
          seller_id: share_owner?.id,
          buyer_id: req.user.id,
        },
      },
    });

    if (!cur_usr_hld_amnt)
      throw new HttpException(
        'User doesnt have any holding for this account',
        HttpStatus.UNPROCESSABLE_ENTITY
      );

    if (body.amount > cur_usr_hld_amnt.amount) {
      throw new HttpException(
        'Not enought holdings of this shares',
        HttpStatus.UNPROCESSABLE_ENTITY
      );
    }

    // REVERSE HOLDING
    // means the buy and selling holding is reversing
    const sell_amount = this.pService.holding.update({
      where: {
        buyer_id_seller_id: {
          seller_id: share_owner?.id,
          buyer_id: req.user.id,
        },
      },
      data: {
        amount: {
          decrement: body.amount,
        },
      },
    });

    const new_price =
      share_owner.price -
      (body.amount * share_owner.price) / share_owner.shares;

    const mut_price = this.pService.user.update({
      where: {
        id: share_owner.id,
      },
      data: {
        price: new_price,
      },
    });

    // opposite
    // the buyer is who buying his shares back
    const txn = this.pService.transaction.create({
      data: {
        buyer_id: req.user.id,
        seller_id: share_owner?.id,
        amount: body.amount * -1,
        newPrice: new_price,
        price: share_owner.price,
      },
    });

    /**
     *  @description  Wallet increment & 0.2 increment on seller wallet
     */
    const walIncr = this.pService.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        balance: {
          increment: body.amount * share_owner.price,
        },
      },
    });
    const shareOwnerIncr = this.pService.user.update({
      where: {
        id: share_owner.id,
      },
      data: {
        balance: {
          increment: (body.amount * share_owner.price * 0.2) / 100,
        },
      },
    });

    await this.pService.$transaction([
      sell_amount,
      mut_price,
      txn,
      walIncr,
      shareOwnerIncr,
    ]);
  }
}
