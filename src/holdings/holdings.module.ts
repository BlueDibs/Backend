import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HoldingsController } from './holdings.controller';
import { PrismaService } from 'src/Prisma.Service';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { HoldingService } from './holdings.service';

@Module({
  controllers: [HoldingsController],
  providers: [PrismaService, HoldingService],
  exports: [HoldingService],
})
export class HoldingModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(HoldingsController);
  }
}
