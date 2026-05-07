import { PartialType } from '@nestjs/mapped-types';
import { CreateBusStopDto } from './create-bus-stop.dto';

export class UpdateBusStopDto extends PartialType(CreateBusStopDto) {}
