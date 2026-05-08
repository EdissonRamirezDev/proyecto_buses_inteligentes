import { PartialType } from '@nestjs/mapped-types';
import { CreateGpsDto } from './create-gps.dto';

export class UpdateGpDto extends PartialType(CreateGpsDto) { }
