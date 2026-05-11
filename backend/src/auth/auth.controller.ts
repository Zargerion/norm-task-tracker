import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const COOKIE_NAME = 'ntt_token';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 1000, // 1h
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { token, user } = await this.auth.login(dto);
    res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
    return { user };
  }

  @Public()
  @Get('magic')
  async magic(@Query('token') token: string, @Res({ passthrough: true }) res: Response) {
    const jwt = await this.auth.exchangeMagicToken(token);
    res.cookie(COOKIE_NAME, jwt, COOKIE_OPTS);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser('sub') userId: string) {
    return this.auth.getMe(userId);
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return { ok: true };
  }
}
