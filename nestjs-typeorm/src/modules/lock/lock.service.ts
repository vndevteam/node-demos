import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { sleep, getLockLabels } from './lock.util';

export interface LockResult {
  ok: boolean;
  status: number;
  message: string;
  data?: any;
}

export interface SignResult {
  signId: string;
  status: 'completed' | 'failed';
  duration: string;
  timestamp: string;
}

@Injectable()
export class LockService {
  private readonly logger = new Logger(LockService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Simulate CloudSign API call with advisory lock protection.
   * This method will hold an advisory lock for ~8 seconds to simulate
   * a long-running external API call. If another request comes in with
   * the same ID while the lock is held, it will return a 409 Conflict.
   */
  async signWithLock(id: string): Promise<LockResult> {
    const qr: QueryRunner = this.dataSource.createQueryRunner();
    await qr.connect();

    const { namespaceLabel } = getLockLabels();

    this.logger.log(`Attempting to acquire lock for id=${id}`);

    try {
      // 1) Try to acquire advisory lock
      const lockSql = `
        SELECT pg_try_advisory_lock(hashtext($1), hashtext($2)) AS locked
      `;
      const lockRes = (await qr.query(lockSql, [namespaceLabel, id])) as Array<{
        locked: boolean;
      }>;
      const locked = !!lockRes?.[0]?.locked;

      if (!locked) {
        // Another session is holding the lock for this ID
        this.logger.warn(
          `Failed to acquire lock for id=${id} - already in progress`,
        );
        return {
          ok: false,
          status: 409,
          message: `Already in progress for id=${id}`,
        };
      }

      this.logger.log(
        `Successfully acquired lock for id=${id}. Starting CloudSign simulation...`,
      );

      try {
        // 2) Simulate external API call (CloudSign)
        const startTime = Date.now();
        await sleep(8000); // 8 seconds simulation
        const endTime = Date.now();
        const duration = endTime - startTime;

        // 3) Simulate successful response
        const result: SignResult = {
          signId: id,
          status: 'completed',
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        };

        this.logger.log(
          `CloudSign simulation completed for id=${id} after ${duration}ms`,
        );

        return {
          ok: true,
          status: 200,
          message: `Sign request completed successfully for id=${id}`,
          data: result,
        };
      } catch (error) {
        this.logger.error(
          `Error during CloudSign simulation for id=${id}:`,
          error,
        );
        return {
          ok: false,
          status: 500,
          message: `Internal error during sign process for id=${id}`,
        };
      }
    } finally {
      // 4) Always release the advisory lock
      try {
        const unlockSql = `SELECT pg_advisory_unlock(hashtext($1), hashtext($2)) AS unlocked`;
        const unlockRes = (await qr.query(unlockSql, [
          namespaceLabel,
          id,
        ])) as Array<{
          unlocked: boolean;
        }>;
        const unlocked = !!unlockRes?.[0]?.unlocked;

        if (unlocked) {
          this.logger.log(`Successfully released lock for id=${id}`);
        } else {
          this.logger.warn(
            `Failed to release lock for id=${id} - may not have been locked`,
          );
        }
      } catch (error) {
        this.logger.error(`Error releasing lock for id=${id}:`, error);
      } finally {
        await qr.release();
      }
    }
  }

  /**
   * Check if a lock is currently held for a given ID
   */
  async isLockHeld(id: string): Promise<boolean> {
    const qr: QueryRunner = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      const { namespaceLabel } = getLockLabels();

      // Check if lock is currently held (this doesn't try to acquire it)
      const checkSql = `
        SELECT EXISTS(
          SELECT 1 FROM pg_locks
          WHERE locktype = 'advisory'
          AND classid = hashtext($1)
          AND objid = hashtext($2)
        ) AS is_locked
      `;

      const result = (await qr.query(checkSql, [namespaceLabel, id])) as Array<{
        is_locked: boolean;
      }>;
      return !!result?.[0]?.is_locked;
    } catch (error) {
      this.logger.error(`Error checking lock status for id=${id}:`, error);
      return false;
    } finally {
      await qr.release();
    }
  }
}
