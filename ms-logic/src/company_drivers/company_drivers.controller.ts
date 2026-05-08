import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CompanyDriversService } from './company_drivers.service';
import { CreateCompanyDriverDto } from './dto/create-company_driver.dto';
import { UpdateCompanyDriverDto } from './dto/update-company_driver.dto';

@Controller('company-drivers')
export class CompanyDriversController {
  constructor(private readonly companyDriversService: CompanyDriversService) {}

  @Post()
  create(@Body() createCompanyDriverDto: CreateCompanyDriverDto) {
    return this.companyDriversService.create(createCompanyDriverDto);
  }

  @Get()
  findAll() {
    return this.companyDriversService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companyDriversService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCompanyDriverDto: UpdateCompanyDriverDto) {
    return this.companyDriversService.update(+id, updateCompanyDriverDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.companyDriversService.remove(+id);
  }
}
