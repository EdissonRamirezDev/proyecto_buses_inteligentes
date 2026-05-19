import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitizenPaymentMethod } from './entities/citizen-payment-method.entity';
import { CitizenPaymentMethodsService } from './citizen-payment-methods.service';
import { CitizenPaymentMethodsController } from './citizen-payment-methods.controller';
import { Citizen } from '../citizens/entities/citizen.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { Ticket } from '../tickets/entities/ticket.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CitizenPaymentMethod, Citizen, PaymentMethod, Ticket]),
  ],
  controllers: [CitizenPaymentMethodsController],
  providers: [CitizenPaymentMethodsService],
  exports: [TypeOrmModule, CitizenPaymentMethodsService],
})
export class CitizenPaymentMethodsModule {}
