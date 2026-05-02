import { Test, TestingModule } from '@nestjs/testing';
import { BusesIncidentsController } from './buses_incidents.controller';
import { BusesIncidentsService } from './buses_incidents.service';

describe('BusesIncidentsController', () => {
  let controller: BusesIncidentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusesIncidentsController],
      providers: [BusesIncidentsService],
    }).compile();

    controller = module.get<BusesIncidentsController>(BusesIncidentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
