import { DynamicModule, Module, Type } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ObjectLiteral } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import {
  AUTH_CONFIG,
  AuthModuleOptions,
  USER_ENTITY,
  USER_SERVICE,
  UserAuthServiceType,
} from './types';
import { AuthController } from './auth.controller';
import { LocalStrategy, JwtAccessTokenStrategy } from './strategy/local.strategy';
import { PassportModule } from '@nestjs/passport';
import { getOptions } from './helpers';

@Module({})
export class AuthModule {
  static register<
    Entity extends ObjectLiteral = ObjectLiteral,
    JwtPayload extends ObjectLiteral = ObjectLiteral,
    RegisterDto extends ObjectLiteral = ObjectLiteral,
  >(opts: AuthModuleOptions<Entity, JwtPayload, RegisterDto>): DynamicModule {
    if (opts.authKey.length < 32) {
      throw new Error('authKey must be at least 32 characters long');
    }

    opts = getOptions(opts);

    const { typeOrmUserEntity, userAuthService, config, imports } = opts;
    const UserServiceClass =
      (userAuthService as unknown as Type<
        UserAuthServiceType<Entity, JwtPayload, RegisterDto>
      >) || class UseDefaultUserAuthService {};
    return {
      module: AuthModule,
      imports: [
        PassportModule,
        JwtModule.register(config.jwt),
        typeOrmUserEntity
          ? TypeOrmModule.forFeature([typeOrmUserEntity as EntityClassOrSchema])
          : null,
        ...(imports || []),
      ].filter((i) => !!i),
      providers: [
        {
          provide: USER_ENTITY,
          useValue: typeOrmUserEntity || null,
        },
        {
          provide: USER_SERVICE,
          useClass: UserServiceClass,
        },
        {
          provide: AUTH_CONFIG,
          useValue: config,
        },
        UserServiceClass,
        AuthService<Entity, JwtPayload, RegisterDto>,
        LocalStrategy<Entity>,
        JwtAccessTokenStrategy<Entity, JwtPayload>,
      ],
      exports: [AuthService, USER_SERVICE, AUTH_CONFIG],
      controllers: opts.disableRouter ? [] : [AuthController],
    };
  }
}
