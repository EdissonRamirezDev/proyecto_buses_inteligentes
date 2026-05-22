import { Test, TestingModule } from '@nestjs/testing';
import { BusinessAdministratorController } from './business_administrator.controller';
import { BusinessAdministratorService } from './business_administrator.service';

describe('BusinessAdministratorController', () => {
  let controller: BusinessAdministratorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessAdministratorController],
      providers: [BusinessAdministratorService],
    }).compile();

    controller = module.get<BusinessAdministratorController>(BusinessAdministratorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
