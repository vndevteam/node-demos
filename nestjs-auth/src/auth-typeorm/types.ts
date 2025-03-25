import { DynamicModule, ForwardReference, Type } from '@nestjs/common';
import { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { JwtFromRequestFunction, Strategy } from 'passport-jwt';
import { EntityTarget, ObjectLiteral } from 'typeorm';

export const USER_ENTITY = Symbol('USER_ENTITY');
export const USER_SERVICE = Symbol('USER_SERVICE');
export const AUTH_CONFIG = Symbol('AUTH_CONFIG');

export type NestModule =
  | DynamicModule
  | Type<any>
  | Promise<DynamicModule>
  | ForwardReference<any>;

export interface JwtOptions extends JwtModuleOptions {
  jwtFromRequest?: () => JwtFromRequestFunction;
  refresh?: JwtSignOptions;
}

export interface AuthModuleConfig {
  enableRefreshTokenRotation?: boolean;
  jwt?: JwtOptions;
  recovery?: {
    tokenExpiresIn?: number; // seconds
    tokenSecret?: string; // must be at least 32 characters
  };
  passportStrategies?: Strategy[];
}

export interface AuthModuleOptions<
  Entity extends ObjectLiteral = ObjectLiteral,
  JwtPayload extends ObjectLiteral = ObjectLiteral,
  RegisterDto extends ObjectLiteral = ObjectLiteral,
> {
  authKey: string;
  typeOrmUserEntity?: EntityTarget<Entity>;
  userAuthService?: typeof UserAuthServiceType<Entity, JwtPayload, RegisterDto>;
  imports?: NestModule[];
  disableRouter?: boolean;
  config?: AuthModuleConfig;
}

export interface JwtPayload<T = any> {
  sub: T;
}

export abstract class UserAuthServiceType<Entity, JwtPayloadSub, RegisterDto> {
  public IDField = 'id';
  public dbIdentityFields?: string[];
  public dbPasswordField?: string;
  public requestUsernameField?: string;
  public requestPasswordField?: string;

  abstract register(
    data: RegisterDto,
  ): Promise<{ user: Entity; token: string }>;
  abstract login(username: string, password: string): Promise<Entity>;
  abstract createJwtAccessTokenPayload(
    user: Entity,
  ): Promise<JwtPayload<JwtPayloadSub>>;
  abstract createJwtRefreshTokenPayload(
    user: Entity,
  ): Promise<JwtPayload<Partial<JwtPayloadSub>>>;
  abstract onAfterRegister(
    body: RegisterDto,
    user: Entity,
    token: string,
  ): Promise<any>;
  abstract onAfterLogin(
    user: Entity,
    accessToken: any,
    refreshToken: any,
    accessTokenExpiresAt: any,
    refreshTokenExpiresAt: any,
  ): Promise<any>;
  abstract jwtValidator(payload: JwtPayloadSub): Promise<Entity>;
  abstract onAfterLogout(accessToken: string): Promise<any>;
}
