import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  LoginDto,
  RegisterCustomerDto,
  UpdateProfileDto,
} from '../users/dto/user.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  /** Cross-site (Vercel → Render) needs SameSite=None; Secure. Localhost stays Lax. */
  private cookieOptions(): CookieOptions {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', '');
    const crossSite =
      Boolean(frontendUrl) &&
      !frontendUrl.includes('localhost') &&
      !frontendUrl.includes('127.0.0.1');

    return {
      httpOnly: true,
      sameSite: crossSite ? 'none' : 'lax',
      secure: crossSite,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    };
  }

  private setCookie(res: Response, token: string) {
    res.cookie('access_token', token, this.cookieOptions());
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setCookie(res, result.accessToken);
    return result;
  }

  @Post('register')
  async register(
    @Body() dto: RegisterCustomerDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.registerCustomer(dto);
    this.setCookie(res, result.accessToken);
    return result;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', this.cookieOptions());
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { id: string }) {
    return this.authService.me(user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }
}
