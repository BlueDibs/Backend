import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './Prisma.Service';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { UserModule } from './user/user.module';
import { PassportModule } from '@nestjs/passport';
import { PostModule } from './post/post.module';
import { AuthMiddleware } from './auth/auth.middleware';
import { CommentModule } from './comment/comment.module';

@Module({
  imports: [
    PassportModule,
    UserModule,
    PostModule,
    CommentModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, {
    provide: APP_PIPE,
    useClass: ZodValidationPipe,
  }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*')
  }
}
