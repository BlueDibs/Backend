import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { PrismaService } from './Prisma.Service';

class SignupValidationDTO extends createZodDto(
  z.object({ username: z.string() })
) {}

@Controller()
export class AppController {
  constructor(private readonly pService: PrismaService) {}

  @Post('signup_validation')
  signupValid(@Body() body: SignupValidationDTO) {
    return this.pService.user.findFirst({
      where: {
        username: body.username,
      },
    });
  }
}
