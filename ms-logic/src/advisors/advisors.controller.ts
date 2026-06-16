import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { AdvisorsService } from './advisors.service';
import { CreateAdvisorDto } from './dto/create-advisor.dto';
import { UpdateAdvisorDto } from './dto/update-advisor.dto';

@Controller('advisors')
export class AdvisorsController {
  constructor(private readonly advisorsService: AdvisorsService) {}

  @Post()
  create(@Body() createAdvisorDto: CreateAdvisorDto) {
    return this.advisorsService.create(createAdvisorDto);
  }

  @Get()
  findAll(@Query('activeOnly') activeOnly?: string) {
    if (activeOnly === 'true') {
      return this.advisorsService.findActive();
    }
    return this.advisorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.advisorsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAdvisorDto: UpdateAdvisorDto) {
    return this.advisorsService.update(id, updateAdvisorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.advisorsService.remove(id);
  }
}
