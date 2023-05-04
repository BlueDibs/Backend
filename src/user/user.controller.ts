import { Controller, Param, Get, HttpException, HttpStatus, Post, Body, Delete, Patch, HttpCode, UseGuards, Req } from "@nestjs/common";
import { PrismaService } from "src/Prisma.Service";
import { AddUserDTO, UpdateUserDTO } from "./user.DTOs";
import { AuthGuard } from "@nestjs/passport";

@Controller('user')
export class UserController {
    constructor(private readonly pService: PrismaService) { }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    async getUserId(@Req() req) {
        const user = await this.pService.user.findFirst({
            where: {
                firebaseId: req.user.user_id
            }
        })

        if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND)

        return user;
    }

    @Post()
    @HttpCode(HttpStatus.OK)
    async addUser(@Body() body: AddUserDTO) {
        try {
            await this.pService.user.create({ data: body });
        } catch (err) {
            if (err.code == 'P2002') {
                throw new HttpException('User already exsists', HttpStatus.CONFLICT)
            }
        }
    }

    @Delete(':id')
    deleteUser(@Param('id') id) {
        return this.pService.user.delete({
            where: {
                id: id
            }
        })
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    async updateUser(@Param('id') id, @Body() body: UpdateUserDTO) {
        try {
            await this.pService.user.update({
                where: {
                    id: id
                },
                data: body
            })
        } catch (err) {
            if (err.code == 'P2002' && err.meta.target.includes['username']) {
                throw new HttpException('username already exsists', HttpStatus.CONFLICT)
            }
        }

    }


}