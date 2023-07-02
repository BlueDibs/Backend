import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { UserController } from './user.controller';
import { PrismaService } from 'src/Prisma.Service';
import { PassportModule } from '@nestjs/passport';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { HoldingModule } from 'src/holdings/holdings.module';

@Module({
  imports: [HoldingModule],
  controllers: [UserController],
  providers: [PrismaService],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude({ path: '/user', method: RequestMethod.POST })
      .forRoutes(UserController);
  }
}
