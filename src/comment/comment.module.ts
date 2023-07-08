import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CommentController } from './controller.module';
import { PrismaService } from 'src/Prisma.Service';
import { AuthMiddleware } from 'src/auth/auth.middleware';

@Module({
  controllers: [CommentController],
  providers: [PrismaService],
})
export class CommentModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(CommentController);
  }
}
