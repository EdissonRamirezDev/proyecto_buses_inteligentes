import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  create(@Body() createIncidentDto: CreateIncidentDto) {
    return this.incidentsService.create(createIncidentDto);
  }

  @Get('stats')
  getStats(@Query('busId') busId?: string, @Query('empresaId') empresaId?: string) {
    return this.incidentsService.getStats(
      busId ? Number(busId) : undefined,
      empresaId ? Number(empresaId) : undefined,
    );
  }

  @Get()
  findAll(@Query('busId') busId?: string, @Query('empresaId') empresaId?: string) {
    return this.incidentsService.findAll(
      busId ? Number(busId) : undefined,
      empresaId ? Number(empresaId) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIncidentDto: UpdateIncidentDto & { followUpComment?: string }) {
    return this.incidentsService.update(+id, updateIncidentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incidentsService.remove(+id);
  }
}
