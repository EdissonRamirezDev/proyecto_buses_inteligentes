import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Citizen } from '../citizens/entities/citizen.entity';
import { WalletTransaction } from '../citizens/entities/wallet-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Citizen, WalletTransaction])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
