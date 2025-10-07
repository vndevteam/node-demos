import {
  Controller,
  Param,
  Post,
  Get,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { LockService, SignResult } from './lock.service';

@Controller('sign')
export class LockController {
  constructor(private readonly lockService: LockService) {}

  /**
   * Sign document endpoint with advisory lock protection.
   *
   * This endpoint simulates a CloudSign API call that takes ~8 seconds.
   * If another request comes in with the same ID while processing,
   * it will return a 409 Conflict status.
   *
   * @param id - The document/contract ID to sign
   */
  @Post(':id')
  async sign(@Param('id') id: string) {
    if (!id || id.trim() === '') {
      throw new HttpException(
        'ID parameter is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.lockService.signWithLock(id);

    if (!result.ok) {
      throw new HttpException(result.message, result.status);
    }

    return {
      success: true,
      message: result.message,
      data: result.data as SignResult,
    };
  }

  /**
   * Check if a signing process is currently in progress for a given ID.
   *
   * @param id - The document/contract ID to check
   */
  @Get(':id/status')
  async getSignStatus(@Param('id') id: string) {
    if (!id || id.trim() === '') {
      throw new HttpException(
        'ID parameter is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isLocked = await this.lockService.isLockHeld(id);

    return {
      id,
      inProgress: isLocked,
      status: isLocked ? 'signing' : 'available',
    };
  }
}
