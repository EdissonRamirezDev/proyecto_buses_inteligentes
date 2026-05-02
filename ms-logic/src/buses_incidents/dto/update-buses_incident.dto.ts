import { PartialType } from '@nestjs/mapped-types';
import { CreateBusesIncidentDto } from './create-buses_incident.dto';

export class UpdateBusesIncidentDto extends PartialType(CreateBusesIncidentDto) {}
