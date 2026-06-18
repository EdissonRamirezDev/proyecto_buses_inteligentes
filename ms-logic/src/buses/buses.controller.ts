import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BusesService } from './buses.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';

@Controller('buses')
export class BusesController {
  constructor(private readonly busesService: BusesService) {}

  @Post()
  create(@Body() createBusDto: CreateBusDto) {
    return this.busesService.create(createBusDto);
  }

  @Get()
  findAll() {
    return this.busesService.findAll();
  }

  @Get('fleet/live')
  getLiveFleetStatus() {
    return this.busesService.getLiveFleetStatus();
  }

  @Post('fleet/simulate-traffic')
  simulateTraffic() {
    return this.busesService.simulateTraffic();
  }

  @Post('fleet/reset-simulation')
  resetSimulation() {
    return this.busesService.resetSimulation();
  }

  @Get(':id/capacity')
  getCapacity(@Param('id') id: string) {
    return this.busesService.syncCapacityFromTickets(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.busesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBusDto: UpdateBusDto) {
    return this.busesService.update(+id, updateBusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.busesService.remove(+id);
  }
}
