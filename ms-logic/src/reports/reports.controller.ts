import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('ages')
  getAgeDistribution() {
    return this.reportsService.getAgeDistribution();
  }

  @Get('revenue')
  getRevenueByMethod() {
    return this.reportsService.getRevenueByMethod();
  }
}
