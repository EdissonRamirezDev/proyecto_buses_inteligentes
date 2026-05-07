import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BusStopsService } from './bus-stops.service';
import { CreateBusStopDto } from './dto/create-bus-stop.dto';
import { UpdateBusStopDto } from './dto/update-bus-stop.dto';

@Controller('bus-stops')
export class BusStopsController {
  constructor(private readonly busStopsService: BusStopsService) {}

  @Post()
  create(@Body() createBusStopDto: CreateBusStopDto) {
    return this.busStopsService.create(createBusStopDto);
  }

  @Get()
  findAll() {
    return this.busStopsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.busStopsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBusStopDto: UpdateBusStopDto) {
    return this.busStopsService.update(id, updateBusStopDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.busStopsService.remove(id);
  }
}
