import {
  Controller,
  Post,
  Body,
  HttpCode,
  Headers,
  Res,
  Get,
  UseGuards,
} from '@nestjs/common';

import { RegisterDto } from './dto/register.dto.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import type { Response } from 'express';
import { CurrentUser } from './current-user.decorator.js';
import { AuthGuard } from './auth.guard.js';
import { CurrentSessionId } from './current-session.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.authService.login(dto, userAgent);

    res.cookie('co-slot', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      ...(dto.rememberMe ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
    });

    return { user };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: { id: string; email: string; name: string }) {
    return user;
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  async logout(
    @CurrentSessionId() sessionId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(sessionId);
    res.clearCookie('co-slot', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
  }

  @Post('logout-all')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  async logoutAll(
    @CurrentUser() user: { id: string },
    @CurrentSessionId() currentSessionId: string,
  ) {
    await this.authService.logoutAll(user.id, currentSessionId);
  }

  @Get('sessions')
  @UseGuards(AuthGuard)
  async listSessions(
    @CurrentUser() user: { id: string },
    @CurrentSessionId() currentSessionId: string,
  ) {
    return this.authService.listSessions(user.id, currentSessionId);
  }
}
