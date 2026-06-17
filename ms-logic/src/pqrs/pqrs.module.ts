import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PqrsService } from './pqrs.service';
import { PqrsController } from './pqrs.controller';
import { Pqrs } from './entities/pqrs.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pqrs])],
  controllers: [PqrsController],
  providers: [PqrsService],
})
export class PqrsModule {}
