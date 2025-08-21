import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TempTableService } from './temp-table.service';
import { TempTableController } from './temp-table.controller';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  providers: [TempTableService],
  controllers: [TempTableController],
})
export class TempTableModule {}
