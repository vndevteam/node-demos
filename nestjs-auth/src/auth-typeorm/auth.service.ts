import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { ExtractJwt, JwtFromRequestFunction } from 'passport-jwt';
import {
  AUTH_CONFIG,
  AuthModuleConfig,
  USER_ENTITY,
  USER_SERVICE,
  UserAuthServiceType,
} from './types';
import { BaseUserAuthService } from './user-auth.service';
import { getTokenExpiresIn } from './helpers';

@Injectable()
export class AuthService<
  Entity extends ObjectLiteral = ObjectLiteral,
  JwtPayload extends ObjectLiteral = ObjectLiteral,
  RegisterDto extends ObjectLiteral = ObjectLiteral,
> {
  private readonly userRepository: Repository<Entity>;

  constructor(
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    @Inject(USER_ENTITY)
    private readonly userEntity: EntityTarget<Entity>,
    @Inject(USER_SERVICE)
    public readonly userService: UserAuthServiceType<
      Entity,
      JwtPayload,
      RegisterDto
    >,
    @Inject(AUTH_CONFIG)
    private readonly opts: AuthModuleConfig,
  ) {
    this.userRepository = this.userEntity
      ? this.dataSource.getRepository(this.userEntity)
      : null;
    if (this.userService.constructor.name === 'UseDefaultUserAuthService') {
      this.userService = new BaseUserAuthService(this.userRepository, opts);
    }
  }

  jwtExtractor(): JwtFromRequestFunction {
    return this.opts.jwt.jwtFromRequest
      ? this.opts.jwt.jwtFromRequest()
      : ExtractJwt.fromAuthHeaderAsBearerToken();
  }

  async getLoginTokens(user: Entity): Promise<any> {
    const [refreshTokenPayload, accessTokenPayload] = await Promise.all([
      this.userService.createJwtRefreshTokenPayload(user),
      this.userService.createJwtAccessTokenPayload(user),
    ]);

    const [refreshToken, accessToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload),
      this.jwtService.signAsync(refreshTokenPayload, {
        ...(this.opts.jwt.refresh || {}),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: getTokenExpiresIn(accessToken),
      refreshTokenExpiresAt: getTokenExpiresIn(refreshToken),
    };
  }
}
