import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isStaging(): boolean {
    return this.nodeEnv === 'staging';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  get fallbackLanguage(): string {
    return this.getString('FALLBACK_LANGUAGE');
  }

  get postgresConfig(): TypeOrmModuleOptions {
    const entities = [
      __dirname + '/../../**/*.entity{.ts,.js}',
      __dirname + '/../../**/*.view-entity{.ts,.js}',
    ];
    const migrations = [__dirname + '/../../database/migrations/*{.ts,.js}'];

    return {
      entities,
      migrations,
      dropSchema: this.isTest,
      type: 'postgres',
      host: this.getString('DB_HOST'),
      port: this.getNumber('DB_PORT'),
      username: this.getString('DB_USER'),
      password: this.getString('DB_PASSWORD'),
      database: this.getString('DB_NAME'),
      migrationsRun: true,
      logging: this.getBoolean('ENABLE_ORM_LOGS'),
    };
  }

  get appConfig(): any {
    return {
      port: this.getString('PORT'),
      logLevel: this.getString('LOG_LEVEL'),
    };
  }

  get nodeEnv(): string {
    return this.getString('NODE_ENV');
  }

  private getNumber(key: string): number {
    const value = this.get(key);

    try {
      return Number(value);
    } catch {
      throw new Error(`AppConfigService: ${key} is not a number`);
    }
  }

  private getBoolean(key: string): boolean {
    const value = this.get(key);

    try {
      return Boolean(JSON.parse(value));
    } catch {
      throw new Error(`AppConfigService: ${key} is not a boolean`);
    }
  }

  private getString(key: string): string {
    const value = this.get(key);
    return value.replaceAll('\\n', '\n');
  }

  private get(key: string): any {
    const value = this.configService.get<string>(key);

    if (isNil(value)) {
      throw new Error(`AppConfigService: ${key} is not defined`);
    }

    return value;
  }
}
