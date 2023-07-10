import {
  Controller,
  Param,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Body,
  Patch,
  HttpCode,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { PrismaService } from 'src/Prisma.Service';
import {
  AddUserDTO,
  MultipleProfilesDTO,
  SellOwnEquity,
  UserSetupDTO,
  updateUserSchema,
} from './user.DTOs';
import { FileInterceptor } from '@nestjs/platform-express';
import { bucket } from 'src/firebase';
import { SaveOptions } from '@google-cloud/storage';
import type { Holding, Post as MediaPost } from '@prisma/client';
import { HoldingService } from 'src/holdings/holdings.service';
import * as dayjs from 'dayjs';
import { Request } from 'express';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly pService: PrismaService,
    private readonly holdingService: HoldingService,
    private readonly userService: UserService
  ) {}

  @Get('wallet')
  async getUserFinancialInfo(@Req() req) {
    // get holdings
    const holdings = await this.holdingService.getUserHoldings(
      req.user.user_id
    );

    // get user profile for calculating stats
    const stats = await this.pService.user.findFirst({
      where: {
        firebaseId: req.user.user_id,
      },
    });

    // TODO : change 1 to the value
    // calculate total investment
    let ttlInvestment = 0;
    let ttlReturns = 0;
    for (const holding of holdings) {
      ttlInvestment += holding.amount * 1;
      ttlReturns += holding.amount * holding.sellerUser.price;
    }

    const tiiys = await this.pService.holding.findMany({
      where: {
        sellerUser: {
          firebaseId: req.user.user_id,
        },
      },
      include: {
        buyerUser: {
          select: {
            username: true,
          },
        },
        sellerUser: {
          select: {
            price: true,
          },
        },
      },
    });

    return {
      holdings,
      ttlInvestment,
      ttlReturns,
      balance: stats?.balance,
      tiiys,
    };
  }

  @Get('username/:username')
  getUser(@Param('username') username) {
    return this.pService.user.findFirst({
      where: {
        username: username,
      },
    });
  }

  @Post('like/:id')
  async likePost(@Param('id') id, @Req() req) {
    await this.pService.user.update({
      where: {
        firebaseId: req.user.user_id,
      },
      data: {
        PostsLiked: {
          connect: {
            id: id,
          },
        },
      },
    });

    return id;
  }

  @Post('unLike/:id')
  async dislikePOst(@Param('id') id, @Req() req) {
    await this.pService.user.update({
      where: {
        firebaseId: req.user.user_id,
      },
      data: {
        PostsLiked: {
          disconnect: {
            id: id,
          },
        },
      },
    });
    return id;
  }

  // feeds algorithim
  @Get('feed')
  async getUserFeeds(@Req() req) {
    const user = await this.pService.user.findFirst({
      where: {
        firebaseId: req.user.user_id,
      },
      select: {
        following: {
          include: {
            Posts: {
              orderBy: {
                created: 'desc',
              },
              take: 5,
              include: {
                User: {
                  select: {
                    username: true,
                    avatarPath: true,
                    id: true,
                    price: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    const posts: MediaPost[] = user.following
      .flatMap((item) => item.Posts)
      .sort(
        (a, b) =>
          new Date(b.created).getSeconds() - new Date(a.created).getSeconds()
      );

    return posts;
  }

  @Post('follow/:id')
  async followUser(@Param('id') id, @Req() req) {
    return this.pService.user.update({
      where: {
        firebaseId: req.user.user_id,
      },
      data: {
        following: {
          connect: {
            id: id,
          },
        },
      },
    });
  }

  @Post('unfollow/:id')
  unfollowUser(@Param('id') id, @Req() req) {
    return this.pService.user.update({
      where: {
        firebaseId: req.user.user_id,
      },
      data: {
        following: {
          disconnect: {
            id: id,
          },
        },
      },
    });
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
      },
    });
  }

  @Get()
  async getUserId(@Req() req) {
    const user = await this.pService.user.findFirst({
      where: {
        firebaseId: req.user.user_id,
      },
    });

    if (!user) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    return user;
  }

  @Get(':id')
  async getPublicUser(@Param('id') id) {
    const user = await this.pService.user.findFirst({
      where: {
        id: id,
      },
      include: {
        Sold: true,
      },
    });

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const sharesAmountSold: number = user?.Sold.reduce<number | Holding>(
      (prev, cur) => {
        if (typeof prev == 'number') return prev + cur.amount;
        else return prev.amount + cur.amount;
      },
      0
    ) as number;

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    // generate and send it's graph data
    const userTxns = await this.pService.transaction.findMany({
      where: {
        seller_id: id,
      },
      orderBy: {
        created: 'desc',
      },
    });

    const graphData = this.userService.generateGraphData(userTxns);

    return { sold: sharesAmountSold, ...user, userTxns, graphData };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async addUser(@Body() body: AddUserDTO) {
    try {
      await this.pService.user.create({ data: { ...body, shares: 0 } });
    } catch (err) {
      if (err.code == 'P2002') {
        throw new HttpException('User already exsists', HttpStatus.CONFLICT);
      }
    }
  }

  @Post('setup')
  async setUp(@Body() body: UserSetupDTO, @Req() req) {
    return this.pService.user.update({
      where: {
        firebaseId: req.user.user_id,
      },
      data: {
        shares: body.shares_dilute,
      },
    });
  }

  @Get('search/:name')
  searchUserByName(@Param('name') name) {
    return this.pService.user.findMany({
      where: {
        username: {
          contains: name,
          mode: 'insensitive',
        },
      },
    });
  }

  @Get('feeds/:username')
  getUserByUsername(@Param('username') username) {
    return this.pService.post.findMany({
      where: {
        User: {
          username: username,
        },
      },
      include: {
        User: true,
      },
    });
  }

  @Post('sell-own-equity')
  @HttpCode(HttpStatus.OK)
  async sellOwnEquity(@Req() req, @Body() body: SellOwnEquity) {
    await this.userService.sellPlatformEquity(
      req.user.user_id,
      body.percentage
    );

    return 'Sold';
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar'))
  async updateUser(
    @Req() req,
    @UploadedFile('file') avatar: Express.Multer.File
  ) {
    const body = updateUserSchema.parse(req.body);

    try {
      if (avatar) {
        console.log('avatar change detected uploading profile pic');
        // will refactor this into an individual storage service
        const filename =
          avatar.originalname.split('.')[0] +
          Date.now() +
          '.' +
          avatar.originalname.split('.').pop();
        const fileRef = bucket.file(filename);
        await fileRef.save(avatar.buffer, {
          contentType: avatar.mimetype,
          cacheControl: 'public, max-age=31536000',
        } as SaveOptions);
        body.avatarPath = filename;
      }
      if (body.avatar) delete body.avatar;

      await this.pService.user.update({
        where: {
          firebaseId: req.user.user_id,
        },
        data: body,
      });
    } catch (err) {
      console.log(err);
      if (err.code == 'P2002' && err.meta.target.includes['username']) {
        throw new HttpException(
          'username already exsists',
          HttpStatus.CONFLICT
        );
      }
    }
  }

  @Get('suggestions/users')
  async getSuggetedUsers(@Req() req) {
    return this.pService.user
      .findMany({
        where: {
          NOT: {
            followers: {
              some: { firebaseId: req.user.id },
            },
          },
        },

        take: 10,
        orderBy: { Posts: { _count: 'asc' } },
      })
      .then((users) => users.filter((user) => user.id !== req.user.id));
  }
}
