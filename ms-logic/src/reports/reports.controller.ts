import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('ages')
  getAgeDistribution(
    @Query('rutaId') rutaId?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.reportsService.getAgeDistribution(rutaId, fechaInicio, fechaFin);
  }

  @Get('revenue')
  getRevenueByMethod(@Query('meses') meses?: number) {
    return this.reportsService.getRevenueByMethod(meses || 6);
  }

  @Get('incidents-trend')
  getIncidentTrends(
    @Query('empresaId') empresaId?: string,
    @Query('meses') meses?: number,
  ) {
    return this.reportsService.getIncidentTrends(empresaId, meses || 3);
  }
}
