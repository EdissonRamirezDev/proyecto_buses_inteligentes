import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { GpsService } from './gps.service';
import { CreateGpsDto } from './dto/create-gps.dto';
import { UpdateGpDto } from './dto/update-gps.dto';

@Controller('gps')
export class GpsController {
  constructor(private readonly gpsService: GpsService) { }

  @Post()
  create(@Body() createGpsDto: CreateGpsDto) {
    return this.gpsService.create(createGpsDto);
  }

  /**
   * HU-ENTR-3-001: Seguimiento de buses en tiempo real por ruta.
   * GET /api/gps/tracking/:routeId?busStopId=xxx
   */
  @Get('tracking/:routeId')
  getRouteTracking(
    @Param('routeId') routeId: string,
    @Query('busStopId') busStopId?: string,
  ) {
    return this.gpsService.getRouteTracking(routeId, busStopId);
  }

  @Get()
  findAll() {
    return this.gpsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gpsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGpDto: UpdateGpDto) {
    return this.gpsService.update(+id, updateGpDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gpsService.remove(+id);
  }
}
