import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { UserController } from './user.controller';
import { PrismaService } from 'src/Prisma.Service';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { HoldingModule } from 'src/holdings/holdings.module';
import { UserService } from './user.service';

@Module({
  imports: [HoldingModule],
  controllers: [UserController],
  providers: [PrismaService, UserService],
  exports: [UserService],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude({ path: '/user', method: RequestMethod.POST })
      .forRoutes(UserController);
  }
}
