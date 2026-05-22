import { PartialType } from '@nestjs/mapped-types';
import { CreateBusinessAdministratorDto } from './create-business_administrator.dto';

export class UpdateBusinessAdministratorDto extends PartialType(CreateBusinessAdministratorDto) {}
