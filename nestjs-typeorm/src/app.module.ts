import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TempTableModule } from './modules/temp-table/temp-table.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

const dbModule = TypeOrmModule.forRootAsync({
  useClass: TypeOrmConfigService,
  dataSourceFactory: async (options: DataSourceOptions) => {
    if (!options) {
      throw new Error('Invalid options passed');
    }

    return new DataSource(options).initialize();
  },
});

@Module({
  imports: [ConfigModule.forRoot(), dbModule, TempTableModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
