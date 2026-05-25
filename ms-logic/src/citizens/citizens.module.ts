import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitizensService } from './citizens.service';
import { CitizensController } from './citizens.controller';
import { Citizen } from './entities/citizen.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { Person } from '../persons/entities/person.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Citizen, WalletTransaction, Person])],
  controllers: [CitizensController],
  providers: [CitizensService],
  exports: [CitizensService, TypeOrmModule]
})
export class CitizensModule {}
