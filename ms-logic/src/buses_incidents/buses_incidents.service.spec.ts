import { Test, TestingModule } from '@nestjs/testing';
import { BusesIncidentsService } from './buses_incidents.service';

describe('BusesIncidentsService', () => {
  let service: BusesIncidentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusesIncidentsService],
    }).compile();

    service = module.get<BusesIncidentsService>(BusesIncidentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
