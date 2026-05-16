import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitizensService } from './citizens.service';
import { CitizensController } from './citizens.controller';
import { Citizen } from './entities/citizen.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { CitizenPaymentMethod } from './entities/citizen-payment-method.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Citizen, WalletTransaction, PaymentMethod, CitizenPaymentMethod])],
  controllers: [CitizensController],
  providers: [CitizensService],
  exports: [CitizensService]
})
export class CitizensModule {}
