import { Test, TestingModule } from '@nestjs/testing';
import { BusinessAdministratorService } from './business_administrator.service';

describe('BusinessAdministratorService', () => {
  let service: BusinessAdministratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusinessAdministratorService],
    }).compile();

    service = module.get<BusinessAdministratorService>(BusinessAdministratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
