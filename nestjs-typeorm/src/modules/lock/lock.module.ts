import { Module } from '@nestjs/common';
import { LockController } from './lock.controller';
import { LockService } from './lock.service';

@Module({
  controllers: [LockController],
  providers: [LockService],
  exports: [],
})
export class LockModule {}
