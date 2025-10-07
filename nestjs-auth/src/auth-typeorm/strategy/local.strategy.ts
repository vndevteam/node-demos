import { AuthService } from '../auth.service';
import { PassportStrategy } from '@nestjs/passport';
import { ObjectLiteral } from 'typeorm';
import { Strategy as PassportJwtStrategy } from 'passport-jwt';
import { Strategy as PassportLocalStrategy } from 'passport-local';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthModuleConfig, AUTH_CONFIG } from '../types';

@Injectable()
export class LocalStrategy<
  Entity extends ObjectLiteral,
> extends PassportStrategy(PassportLocalStrategy) {
  constructor(private readonly authService: AuthService<Entity>) {
    super({
      usernameField: authService.userService.requestUsernameField || 'username',
      passwordField: authService.userService.requestPasswordField || 'password',
    });
  }

  async validate(username: string, password: string): Promise<Entity> {
    const user = await this.authService.userService.login(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}

@Injectable()
export class JwtAccessTokenStrategy<
  Entity extends ObjectLiteral,
  JwtPayload extends ObjectLiteral,
> extends PassportStrategy(PassportJwtStrategy, 'jwt-access-token') {
  constructor(
    private authService: AuthService,
    @Inject(AUTH_CONFIG) public opts: AuthModuleConfig,
  ) {
    const secretOrKey =
      opts.jwt.secret || opts.jwt.privateKey || opts.jwt.secretOrPrivateKey;
    super({
      secretOrKey,
      ignoreExpiration: false,
      passReqToCallback: false,
      jwtFromRequest: authService.jwtExtractor(),
    });
  }

  async validate(payload: JwtPayload) {
    return this.authService.userService.jwtValidator(payload);
  }
}
