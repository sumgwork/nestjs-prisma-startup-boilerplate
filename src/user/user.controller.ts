import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../../src/auth/decorator';
import { User } from '@prisma/client';

@Controller('user')
@UseGuards(JwtGuard)
export class UserController {
  @Get('me')
  identifyMe(@GetUser() user: User): User {
    return user;
  }
}
