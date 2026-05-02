import { Injectable } from '@nestjs/common';
import { CreateBusesIncidentDto } from './dto/create-buses_incident.dto';
import { UpdateBusesIncidentDto } from './dto/update-buses_incident.dto';

@Injectable()
export class BusesIncidentsService {
  create(createBusesIncidentDto: CreateBusesIncidentDto) {
    return 'This action adds a new busesIncident';
  }

  findAll() {
    return `This action returns all busesIncidents`;
  }

  findOne(id: number) {
    return `This action returns a #${id} busesIncident`;
  }

  update(id: number, updateBusesIncidentDto: UpdateBusesIncidentDto) {
    return `This action updates a #${id} busesIncident`;
  }

  remove(id: number) {
    return `This action removes a #${id} busesIncident`;
  }
}
