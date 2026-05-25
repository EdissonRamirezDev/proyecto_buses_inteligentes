import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { StartShiftDto } from './dto/start-shift.dto';

@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post()
  create(@Body() createShiftDto: CreateShiftDto) {
    return this.shiftsService.create(createShiftDto);
  }

  @Get()
  findAll() {
    return this.shiftsService.findAll();
  }

  @Get('active/:email')
  findActive(@Param('email') email: string) {
    return this.shiftsService.findActiveByDriverEmail(email);
  }

  @Get('startable/:email')
  findStartable(@Param('email') email: string) {
    return this.shiftsService.findStartableForDriverEmail(email);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftsService.findOne(+id);
  }

  @Post(':id/start')
  startShift(@Param('id') id: string, @Body() startShiftDto: StartShiftDto) {
    return this.shiftsService.startShift(+id, startShiftDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateShiftDto: UpdateShiftDto) {
    return this.shiftsService.update(+id, updateShiftDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shiftsService.remove(+id);
  }
}
