import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CitizenPaymentMethodsService } from './citizen-payment-methods.service';
import { CreateCitizenPaymentMethodDto } from './dto/create-citizen-payment-method.dto';
import { UpdateCitizenPaymentMethodDto } from './dto/update-citizen-payment-method.dto';

@Controller('citizen-payment-methods')
export class CitizenPaymentMethodsController {
  constructor(private readonly citizenPaymentMethodsService: CitizenPaymentMethodsService) {}

  @Post()
  create(@Body() createDto: CreateCitizenPaymentMethodDto) {
    return this.citizenPaymentMethodsService.create(createDto);
  }

  @Get()
  findAll() {
    return this.citizenPaymentMethodsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.citizenPaymentMethodsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateCitizenPaymentMethodDto) {
    return this.citizenPaymentMethodsService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.citizenPaymentMethodsService.remove(id);
  }
}
