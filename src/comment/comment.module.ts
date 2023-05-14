import { Module } from "@nestjs/common";
import { CommentController } from "./controller.module";
import { PrismaService } from "src/Prisma.Service";

@Module({
    controllers: [CommentController],
    providers: [PrismaService]
})
export class CommentModule { }
