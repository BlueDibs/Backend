import { Body, Controller, HttpException, HttpStatus, Param, Post, Req } from "@nestjs/common";
import { Holding } from "@prisma/client";
import { createZodDto } from "nestjs-zod";
import { z } from "nestjs-zod/z";
import { PrismaService } from "src/Prisma.Service";

const buySchema = z.object({
    amount: z.number()
})

const sellSchema = z.object({
    amount: z.number()
})

class buyDTO extends createZodDto(buySchema) { }
class sellDTO extends createZodDto(sellSchema) { }


@Controller('holding')
export class HoldingsController {
    constructor(private readonly pService: PrismaService) { }

    @Post('buy/:userId')
    async buy(@Param('userId') userId, @Body() body: buyDTO, @Req() req) {
        const seller_user = await this.pService.user.findFirst({
            where: {
                id: userId
            },
            include: {
                TIIYS: true
            }
        })

        if (!seller_user) throw new HttpException('Seller User not found', HttpStatus.NOT_FOUND)

        const sharesAmountSold: number = seller_user?.TIIYS.reduce<number | Holding>((prev, cur) => {
            if (typeof prev == 'number') return prev + cur.amount
            else return prev.amount + cur.amount
        }, 0) as number

        if ((seller_user?.shares - sharesAmountSold) < body.amount) {
            throw new HttpException('doesnt doesnt have this amount of shares left', HttpStatus.UNPROCESSABLE_ENTITY)
        }

        const createHolding = this.pService.holding.create({
            data: {
                seller_id: userId,
                buyer_id: req.user.id,
                amount: body.amount,
                price: seller_user.price
            }
        })

        const newPrice = seller_user.price + (body.amount * seller_user.price) / seller_user.shares;


        const mutatePrice = this.pService.user.update({
            where: {
                id: seller_user.id
            },
            data: {
                price: newPrice
            }
        })

        await this.pService.$transaction([createHolding, mutatePrice])
    }

    @Post('sell/:userId')
    async sell(@Param('userId') userId, @Body() body: sellDTO, @Req() req) {
        const share_owner = await this.pService.user.findFirst({
            where: {
                id: userId
            },
        })

        const cur_usr_hld_amnt = await this.pService.holding.findMany({
            where: {
                seller_id: share_owner?.id,
                buyer_id: req.user.id
            },
        })

        const ttl_amnt_hold_by_cur_usr = cur_usr_hld_amnt.reduce<number>((prev: number | Holding, current) => {
            if (typeof prev == 'number') return prev + current.amount;
            else return prev.amount + current.amount
        }, 0)

        if (ttl_amnt_hold_by_cur_usr > body.amount) {
            throw new HttpException('Not enought holdings of this shares', HttpStatus.UNPROCESSABLE_ENTITY)
        }

    }

}