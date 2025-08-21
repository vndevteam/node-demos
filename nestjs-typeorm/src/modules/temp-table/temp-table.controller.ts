import { Controller, Post, Body, Param, Get, Delete } from '@nestjs/common';
import { TempTableService } from './temp-table.service';

@Controller('temp-table')
export class TempTableController {
  constructor(private readonly tempTableService: TempTableService) {}

  @Post(':sessionId')
  async createTempTable(@Param('sessionId') sessionId: string) {
    await this.tempTableService.createTempTable(sessionId);
    return { message: 'Temporary table created.' };
  }

  @Post(':sessionId/data')
  async insertTempData(
    @Param('sessionId') sessionId: string,
    @Body('value') value: string,
  ) {
    await this.tempTableService.insertTempData(sessionId, value);
    return { message: 'Data inserted into temporary table.' };
  }

  @Get(':sessionId/data')
  async getTempData(@Param('sessionId') sessionId: string) {
    const data = await this.tempTableService.getTempData(sessionId);
    return { data };
  }

  @Delete(':sessionId')
  async dropTempTable(@Param('sessionId') sessionId: string) {
    await this.tempTableService.dropTempTable(sessionId);
    return { message: 'Temporary table dropped.' };
  }

  @Post(':sessionId/batch')
  async processTempTableBatch(
    @Param('sessionId') sessionId: string,
    @Body('values') values: string[],
  ) {
    const result = await this.tempTableService.processTempTableBatch(
      sessionId,
      values,
    );
    return { data: result };
  }

  @Post(':sessionId/complex')
  async processWithComplexQuery(@Param('sessionId') sessionId: string) {
    const result =
      await this.tempTableService.processWithComplexQuery(sessionId);
    return { data: result };
  }
}
