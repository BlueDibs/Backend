import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './Prisma.Service';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { UserModule } from './user/user.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule,
    UserModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, {
    provide: APP_PIPE,
    useClass: ZodValidationPipe,
  }],
})
export class AppModule { }
