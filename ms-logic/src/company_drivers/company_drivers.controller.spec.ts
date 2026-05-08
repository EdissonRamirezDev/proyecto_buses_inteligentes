import { Test, TestingModule } from '@nestjs/testing';
import { CompanyDriversController } from './company_drivers.controller';
import { CompanyDriversService } from './company_drivers.service';

describe('CompanyDriversController', () => {
  let controller: CompanyDriversController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyDriversController],
      providers: [CompanyDriversService],
    }).compile();

    controller = module.get<CompanyDriversController>(CompanyDriversController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
