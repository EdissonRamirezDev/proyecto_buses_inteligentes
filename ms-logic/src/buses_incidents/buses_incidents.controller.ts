import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BusesIncidentsService } from './buses_incidents.service';
import { CreateBusesIncidentDto } from './dto/create-buses_incident.dto';
import { UpdateBusesIncidentDto } from './dto/update-buses_incident.dto';

@Controller('buses-incidents')
export class BusesIncidentsController {
  constructor(private readonly busesIncidentsService: BusesIncidentsService) {}

  @Post()
  create(@Body() createBusesIncidentDto: CreateBusesIncidentDto) {
    return this.busesIncidentsService.create(createBusesIncidentDto);
  }

  @Get()
  findAll() {
    return this.busesIncidentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.busesIncidentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBusesIncidentDto: UpdateBusesIncidentDto) {
    return this.busesIncidentsService.update(+id, updateBusesIncidentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.busesIncidentsService.remove(+id);
  }
}
