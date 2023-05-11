import { Controller, Post, Req } from "@nestjs/common";
import { PrismaService } from "src/Prisma.Service";

@Controller('chat')
export class ChatController {
    constructor(private pService: PrismaService) { }

    // @Post()
    // createChat(@Req() req) {
    //     this.pService.chat.findFirst({
    //         where: {
    //             userId: req.user.user_id,
    //         },
    //         create: {

    //         }
    //     })
    // }
}