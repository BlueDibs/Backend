import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { PrismaService } from 'src/Prisma.Service';
import { AuthMiddleware } from 'src/auth/auth.middleware';

@Module({
  controllers: [ChatController],
  providers: [PrismaService],
})
export class ChatModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(ChatController);
  }
}
