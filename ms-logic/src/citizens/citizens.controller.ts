import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CitizensService } from './citizens.service';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';

@Controller('citizens')
export class CitizensController {
  constructor(private readonly citizensService: CitizensService) {}

  @Post()
  create(@Body() createCitizenDto: CreateCitizenDto) {
    return this.citizensService.create(createCitizenDto);
  }

  @Get()
  findAll() {
    return this.citizensService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.citizensService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCitizenDto: UpdateCitizenDto) {
    return this.citizensService.update(id, updateCitizenDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.citizensService.remove(id);
  }

  @Post(':id/recharge')
  rechargeWallet(
    @Param('id') id: string,
    @Body() body: { monto: number; referencia: string }
  ) {
    return this.citizensService.rechargeWallet(id, body.monto, body.referencia);
  }

  @Get(':id/transactions')
  getTransactions(@Param('id') id: string) {
    return this.citizensService.getTransactions(id);
  }
}
