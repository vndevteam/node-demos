import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth-typeorm/auth.module';
import { UsersModule } from './users/users.module';
import { UserEntity } from './users/entities/user.entity';
import { RegisterUserDto } from './users/dto/register-user.dto';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { dataSourceFactory } from './config/data-source';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return config.get('database');
      },
      dataSourceFactory: dataSourceFactory,
    }),
    AuthModule.register<UserEntity, RegisterUserDto>({
      authKey: 'auth_key_with_32_bytes_randomly_',
      typeOrmUserEntity: UserEntity,
      userAuthService: null,
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
