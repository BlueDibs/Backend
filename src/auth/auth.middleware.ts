import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { app } from '../firebase'


@Injectable()
export class AuthMiddleware implements NestMiddleware {
    async use(req: any, res: any, next: (error?: any) => void) {
        try {
            const accessToken = req.headers.authorization.split(' ')[1];
            const decodedToken = await app.auth().verifyIdToken(accessToken);
            req.user = decodedToken
            next();
        } catch (err) {
            res.status(401).send('Unauthorized')
        }
    }
}