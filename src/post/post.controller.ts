import { Controller, Post, Req, UploadedFile, UseInterceptors } from "@nestjs/common";
import { PrismaService } from "src/Prisma.Service";
import * as bcrypt from 'bcrypt'
import { FileInterceptor } from "@nestjs/platform-express";
import { app, bucket } from "src/firebase";

@Controller('post')
export class PostController {
    constructor(private pService: PrismaService) { }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async addPost(@Req() req, @UploadedFile('file') file: Express.Multer.File) {
        if (!file) return
        const filename = file.originalname.split('.')[0] + Date.now() + '.' + file.originalname.split('.').pop()
        const fileRef = bucket.file(filename)
        await fileRef.save(file.buffer, { contentType: file.mimetype })
        this.pService.post.create({
            data: {
                path: filename,
                userId: req.user.id
            }
        })
    }
}