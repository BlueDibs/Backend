import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { UserController } from "./user.controller";
import { PrismaService } from "src/Prisma.Service";
import { PassportModule } from "@nestjs/passport";
import { AuthMiddleware } from "src/auth/auth.middleware";

@Module({
    imports: [],
    controllers: [UserController],
    providers: [PrismaService]
})
export class UserModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes('*')
    }
}