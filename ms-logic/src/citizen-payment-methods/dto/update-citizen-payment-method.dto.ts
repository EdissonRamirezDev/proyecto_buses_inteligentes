import { PartialType } from '@nestjs/mapped-types';
import { CreateCitizenPaymentMethodDto } from './create-citizen-payment-method.dto';

export class UpdateCitizenPaymentMethodDto extends PartialType(CreateCitizenPaymentMethodDto) {}
