import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
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
import { HoldingModule } from './holdings/holdings.module';

@Module({
  imports: [
    PassportModule,
    UserModule,
    PostModule,
    CommentModule,
    HoldingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
