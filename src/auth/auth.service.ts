import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable({})
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}
  async signin(dto: AuthDto): Promise<{ access_token: string }> {
    // Find user by email
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (!user) {
      throw new ForbiddenException('Credentials incorrect');
    }
    // Compare password
    const isMatch = await argon.verify(user.hash, dto.password);
    if (!isMatch) {
      throw new ForbiddenException('Credentials incorrect');
    }

    // Send back the user
    const access_token = await this.signToken(user.id, user.email);
    return { access_token };
  }

  async signup(dto: AuthDto) {
    // Generate password
    const hash = await argon.hash(dto.password);
    try {
      // Save user in DB
      const user = await this.prismaService.user.create({
        data: {
          email: dto.email,
          hash,
        },
      });

      // Delete hash or password before returning
      delete user.hash;
      // Return the saved user
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // duplicate unique field
          throw new ForbiddenException('Credentials taken');
        }
      }
      throw error;
    }
  }

  async signToken(userId: number, email: string): Promise<string> {
    const payload = {
      sub: userId,
      email,
    };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get('JWT_SECRET'),
    });
    return token;
  }
}
