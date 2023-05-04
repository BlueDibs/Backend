import { Module } from "@nestjs/common";
import { PostController } from "./post.controller";
import { PrismaService } from "src/Prisma.Service";

@Module({
    controllers: [PostController],
    providers: [PrismaService]
})
export class PostModule { }