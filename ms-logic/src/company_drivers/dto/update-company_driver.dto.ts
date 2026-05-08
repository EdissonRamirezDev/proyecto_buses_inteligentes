import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyDriverDto } from './create-company_driver.dto';

export class UpdateCompanyDriverDto extends PartialType(CreateCompanyDriverDto) {}
