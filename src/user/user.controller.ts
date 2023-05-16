import { Controller, Param, Get, HttpException, HttpStatus, Post, Body, Patch, HttpCode, Req, UseInterceptors, UploadedFile } from "@nestjs/common";
import { PrismaService } from "src/Prisma.Service";
import { AddUserDTO, MultipleProfilesDTO, updateUserSchema } from "./user.DTOs";
import { FileInterceptor } from "@nestjs/platform-express";
import { bucket } from "src/firebase";
import { SaveOptions } from "@google-cloud/storage";
import type { Post as MediaPost } from "@prisma/client";

@Controller('user')
export class UserController {
    constructor(private readonly pService: PrismaService) { }

    @Post('like/:id')
    async likePost(@Param('id') id, @Req() req) {
        await this.pService.user.update({
            where: {
                firebaseId: req.user.user_id
            },
            data: {
                PostsLiked: {
                    connect: {
                        id: id
                    }
                }
            }
        })

        return id
    }

    @Post('unLike/:id')
    async dislikePOst(@Param('id') id, @Req() req) {
        await this.pService.user.update({
            where: {
                firebaseId: req.user.user_id
            },
            data: {
                PostsLiked: {
                    disconnect: {
                        id: id
                    }
                }
            }
        })
        return id
    }


    // feeds algorithim
    @Get('feed')
    async getUserFeeds(@Req() req) {
        const user = await this.pService.user.findFirst({
            where: {
                firebaseId: req.user.user_id
            },
            select: {
                following: {
                    include: {
                        Posts: {
                            orderBy: {
                                created: 'desc'
                            },
                            take: 5,
                            include: {
                                User: {
                                    select: {
                                        username: true,
                                        avatarPath: true,
                                        id: true
                                    }
                                }
                            }
                        }
                    },
                }
            }
        })

        if (!user) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)

        const posts: MediaPost[] = user.following.flatMap((item) => item.Posts).sort((a, b) =>
            new Date(b.created).getSeconds() - new Date(a.created).getSeconds()
        )

        return posts
    }

    @Post('follow/:id')
    async followUser(@Param('id') id, @Req() req) {
        return this.pService.user.update({
            where: {
                firebaseId: req.user.user_id
            },
            data: {
                following: {
                    connect: {
                        id: id
                    }
                }
            }
        })
    }

    @Post('unfollow/:id')
    unfollowUser(@Param('id') id, @Req() req) {
        return this.pService.user.update({
            where: {
                firebaseId: req.user.user_id
            },
            data: {
                following: {
                    disconnect: {
                        id: id
                    }
                }
            }
        })
    }

    @Post('profiles')
    async getMultipleUserProfile(@Body() profiles: MultipleProfilesDTO) {
        return this.pService.user.findMany({
            where: {
                id: { in: profiles },
            },
            select: {
                id: true,
                username: true,
                avatarPath: true,
            }
        })
    }

    @Get()
    async getUserId(@Req() req) {
        const user = await this.pService.user.findFirst({
            where: {
                firebaseId: req.user.user_id
            },
        })

        if (!user) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)

        return user;
    }

    @Get(':id')
    async getPublicUser(@Param('id') id) {
        const user = await this.pService.user.findFirst({
            where: {
                id: id
            }
        })

        if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND)
        return user
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


    @Get('search/:name')
    searchUserByName(@Param('name') name) {
        return this.pService.user.findMany({
            where: {
                username: {
                    contains: name,
                    mode: 'insensitive'
                }
            }
        })
    }

    @Get('feeds/:username')
    getUserByUsername(@Param('username') username) {
        return this.pService.post.findMany({
            where: {
                User: {
                    username: username
                },
            },
            include: {
                User: true
            }
        })
    }

    @Patch()
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('avatar'))
    async updateUser(@Req() req, @UploadedFile('file') avatar: Express.Multer.File) {
        const body = updateUserSchema.parse(req.body);

        try {
            if (avatar) {
                console.log('avatar change detected uploading profile pic')
                // will refactor this into an individual storage service
                const filename = avatar.originalname.split('.')[0] + Date.now() + '.' + avatar.originalname.split('.').pop()
                const fileRef = bucket.file(filename);
                await fileRef.save(avatar.buffer, { contentType: avatar.mimetype, cacheControl: 'public, max-age=31536000' } as SaveOptions)
                body.avatarPath = filename;
            }
            if (body.avatar) delete body.avatar

            await this.pService.user.update({
                where: {
                    firebaseId: req.user.user_id
                },
                data: body
            })
        } catch (err) {
            console.log(err)
            if (err.code == 'P2002' && err.meta.target.includes['username']) {
                throw new HttpException('username already exsists', HttpStatus.CONFLICT)
            }
        }

    }


}