import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BusinessAdministratorService } from './business_administrator.service';
import { CreateBusinessAdministratorDto } from './dto/create-business_administrator.dto';
import { UpdateBusinessAdministratorDto } from './dto/update-business_administrator.dto';

@Controller('business-administrator')
export class BusinessAdministratorController {
  constructor(private readonly businessAdministratorService: BusinessAdministratorService) {}

  @Post()
  create(@Body() createBusinessAdministratorDto: CreateBusinessAdministratorDto) {
    return this.businessAdministratorService.create(createBusinessAdministratorDto);
  }

  @Get()
  findAll() {
    return this.businessAdministratorService.findAll();
  }

  @Get('person/:personId')
  findByPersonId(@Param('personId') personId: string) {
    return this.businessAdministratorService.findByPersonId(personId);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.businessAdministratorService.findByUserId(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessAdministratorService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBusinessAdministratorDto: UpdateBusinessAdministratorDto) {
    return this.businessAdministratorService.update(id, updateBusinessAdministratorDto);
  }

  @Delete('person/:personId')
  removeByPersonId(@Param('personId') personId: string) {
    return this.businessAdministratorService.removeByPersonId(personId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessAdministratorService.remove(id);
  }
}

