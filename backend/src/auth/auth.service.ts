import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { login: dto.login } });
    if (!user) throw new UnauthorizedException('Неверный логин или пароль');
    if (!user.isApproved) throw new UnauthorizedException('Аккаунт не подтверждён через Telegram');

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Неверный логин или пароль');

    const token = await this.signToken(user.id, user.login, user.isSuperAdmin);
    return { token, user: { id: user.id, login: user.login, firstName: user.firstName, lastName: user.lastName, isSuperAdmin: user.isSuperAdmin } };
  }

  async exchangeMagicToken(magicToken: string) {
    const record = await this.prisma.magicToken.findUnique({ where: { token: magicToken } });
    if (!record) throw new NotFoundException('Ссылка недействительна');
    if (record.usedAt) throw new BadRequestException('Ссылка уже использована');
    if (record.expiresAt < new Date()) throw new BadRequestException('Ссылка истекла');

    await this.prisma.magicToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });

    const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
    if (!user || !user.isApproved) throw new UnauthorizedException();

    return this.signToken(user.id, user.login, user.isSuperAdmin);
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, firstName: true, lastName: true, login: true,
        jobTitle: true, favoriteColor: true, description: true,
        phone: true, email: true, telegramId: true, isSuperAdmin: true, avatarUrl: true,
        spaceUsers: { select: { spaceId: true, role: true, space: { select: { name: true, description: true } } } },
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async createMagicToken(userId: string): Promise<string> {
    const token = this.jwt.sign(
      { sub: userId, type: 'magic' },
      { secret: this.config.get('JWT_SECRET'), expiresIn: '15m' },
    );
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.prisma.magicToken.create({ data: { userId, token, expiresAt } });
    return token;
  }

  private async signToken(userId: string, login: string, isSuperAdmin: boolean): Promise<string> {
    return this.jwt.sign(
      { sub: userId, login, isSuperAdmin },
      { secret: this.config.get('JWT_SECRET'), expiresIn: this.config.get('JWT_EXPIRES_IN') },
    );
  }
}
