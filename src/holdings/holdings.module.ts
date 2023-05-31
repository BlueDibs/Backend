import { Module } from "@nestjs/common";
import { HoldingsController } from "./holdings.controller";
import { PrismaService } from "src/Prisma.Service";

@Module({
    controllers: [HoldingsController],
    providers: [PrismaService]
})
export class HoldingModule { }