import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupPerson } from './entities/group-person.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GroupPerson])],
  exports: [TypeOrmModule],
})
export class GroupPersonsModule {}
