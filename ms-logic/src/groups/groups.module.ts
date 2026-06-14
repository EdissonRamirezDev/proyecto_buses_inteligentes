import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { Group } from './entities/group.entity';
import { GroupLog } from './entities/group-log.entity';
import { MessagesModule } from '../messages/messages.module';
import { PersonsModule } from '../persons/persons.module';
import { GroupPersonsModule } from '../group-persons/group-persons.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupLog]),
    forwardRef(() => MessagesModule),
    PersonsModule,
    GroupPersonsModule,
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [TypeOrmModule, GroupsService],
})
export class GroupsModule {}
