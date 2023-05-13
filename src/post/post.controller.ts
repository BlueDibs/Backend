import { Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UploadedFile, UseInterceptors } from "@nestjs/common";
import { PrismaService } from "src/Prisma.Service";
import * as bcrypt from 'bcrypt'
import { FileInterceptor } from "@nestjs/platform-express";
import { app, bucket } from "src/firebase";
import { SaveOptions } from "@google-cloud/storage";

@Controller('post')
export class PostController {
    constructor(private pService: PrismaService) { }

    @Post(':id')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('file'))
    async addPost(@Param('id') id, @UploadedFile('file') file: Express.Multer.File) {
        console.log(file)
        if (!file) return
        const filename = file.originalname.split('.')[0] + Date.now() + '.' + file.originalname.split('.').pop()
        const fileRef = bucket.file(filename)
        await fileRef.save(file.buffer, { contentType: file.mimetype, cacheControl: 'public, max-age=31536000' } as SaveOptions)
        const res = await this.pService.post.create({
            data: {
                path: filename,
                userId: id,
                created: new Date().toISOString()
            }
        })

        return res;

    }

    @Get(':id')
    getPostRelatedToUser(@Param('id') id) {
        return this.pService.post.findMany({
            where: {
                userId: id
            }
        })
    }
}