import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitizensService } from './citizens.service';
import { CitizensController } from './citizens.controller';
import { Citizen } from './entities/citizen.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Citizen, WalletTransaction])],
  controllers: [CitizensController],
  providers: [CitizensService],
  exports: [CitizensService, TypeOrmModule]
})
export class CitizensModule {}
