import { Test, TestingModule } from '@nestjs/testing';
import { CompanyDriversService } from './company_drivers.service';

describe('CompanyDriversService', () => {
  let service: CompanyDriversService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyDriversService],
    }).compile();

    service = module.get<CompanyDriversService>(CompanyDriversService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
