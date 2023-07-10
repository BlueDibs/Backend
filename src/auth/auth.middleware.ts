import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { app } from '../firebase';
import { PrismaService } from 'src/Prisma.Service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly pService: PrismaService) {}

  async use(req: any, res: any, next: (error?: any) => void) {
    try {
      const accessToken = req.headers.authorization.split(' ')[1];
      // console.log(req.headers.authorization);
      const decodedToken = await app.auth().verifyIdToken(accessToken);
      req.user = decodedToken;
      req.user.id = (
        await this.pService.user.findFirst({
          where: {
            firebaseId: req.user.user_id,
          },
        })
      )?.id;
      next();
    } catch (err) {
      res.status(401).send('Unauthorized');
    }
  }
}
