import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TempTableService {
  private readonly logger = new Logger(TempTableService.name);
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Create a temporary table.
   * NOTE:
   * - Temporary tables in PostgreSQL only live inside the current session (connection).
   * - Once the connection is closed or reused by the pool, the table will disappear automatically.
   */
  async createTempTable(sessionId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();

      // Get PostgreSQL backend process ID (connection id).
      // This helps you check if subsequent API calls are using the same connection.
      const pid = (await queryRunner.query('SELECT pg_backend_pid()')) as {
        pg_backend_pid: string;
      }[];
      this.logger.log(
        'createTempTable connection id: ' + pid[0].pg_backend_pid,
      );

      await queryRunner.query(
        `CREATE TEMP TABLE ${this.safeIdent(`temp_data_${sessionId}`)} (id SERIAL PRIMARY KEY, value TEXT)`,
      );
    } finally {
      // Once released, the pool may close this connection.
      // If closed, PostgreSQL will automatically drop the temp table.
      await queryRunner.release();
    }
  }

  /**
   * Insert data into the temporary table.
   * NOTE:
   * - If this API call happens on a different connection (different PID),
   *   the temp table will not exist and this query will fail.
   */
  async insertTempData(sessionId: string, value: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();

      const pid = (await queryRunner.query('SELECT pg_backend_pid()')) as {
        pg_backend_pid: string;
      }[];
      this.logger.log('insertTempData connection id: ' + pid[0].pg_backend_pid);

      await queryRunner.query(
        `INSERT INTO ${this.safeIdent(`temp_data_${sessionId}`)} (value) VALUES ($1)`,
        [value],
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Read data from the temporary table.
   * NOTE:
   * - This will only work if the current connection is the same one
   *   that created the temp table.
   */
  async getTempData(sessionId: string): Promise<any[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();

      const pid = (await queryRunner.query('SELECT pg_backend_pid()')) as {
        pg_backend_pid: string;
      }[];
      this.logger.log('getTempData connection id: ' + pid[0].pg_backend_pid);

      const result = (await queryRunner.query(
        `SELECT * FROM ${this.safeIdent(`temp_data_${sessionId}`)}`,
      )) as { id: number; value: string }[];
      return result;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Drop the temporary table manually.
   * NOTE:
   * - Normally, PostgreSQL drops temp tables automatically
   *   when the connection is closed.
   */
  async dropTempTable(sessionId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();

      const pid = (await queryRunner.query('SELECT pg_backend_pid()')) as {
        pg_backend_pid: string;
      }[];
      this.logger.log('dropTempTable connection id: ' + pid[0].pg_backend_pid);

      const tbl = this.safeIdent(`temp_data_${sessionId}`);
      await queryRunner.query(`DROP TABLE IF EXISTS ${tbl}`);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create a temporary table, insert a batch of data, and return the inserted data, all within a single transaction.
   */
  async processTempTableBatch(
    sessionId: string,
    values: string[],
  ): Promise<any[]> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const pid = (await qr.query('SELECT pg_backend_pid()')) as {
        pg_backend_pid: string;
      }[];
      this.logger.log(
        'processTempTableBatch connection id: ' + pid[0].pg_backend_pid,
      );

      const tbl = this.safeIdent(`temp_data_${sessionId}`);
      await qr.query(
        `CREATE TEMP TABLE ${tbl} (id SERIAL PRIMARY KEY, value TEXT) ON COMMIT DROP`,
      );
      for (const v of values) {
        await qr.query(`INSERT INTO ${tbl} (value) VALUES ($1)`, [v]);
      }
      const rows = (await qr.query(`SELECT * FROM ${tbl}`)) as {
        id: number;
        value: string;
      }[];
      await qr.commitTransaction();
      return rows;
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  /**
   * Create a temporary table, insert data from a complex query,
   */
  async processWithComplexQuery(sessionId: string): Promise<any[]> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const tbl = this.safeIdent(`temp_data_${sessionId}`);
      await qr.query(
        `CREATE TEMP TABLE ${tbl} (id SERIAL PRIMARY KEY, value TEXT) ON COMMIT DROP`,
      );

      // Use a single query to insert into the temp table from the complex result
      await qr.query(`INSERT INTO ${tbl} (value)
        SELECT username FROM users WHERE is_active = true LIMIT 10`);

      // Query to join the temp table with the users table
      const result = (await qr.query(
        `SELECT u.*, t.value as temp_value FROM users u JOIN ${tbl} t ON u.username = t.value`,
      )) as Array<{ [key: string]: any; temp_value: string }>;
      await qr.commitTransaction();
      return result;
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  /**
   * Escape identifiers to avoid SQL injection.
   */
  private safeIdent(name: string) {
    if (!/^[a-zA-Z0-9_]+$/.test(name)) throw new Error('Bad identifier');
    return `"${name}"`;
  }
}
