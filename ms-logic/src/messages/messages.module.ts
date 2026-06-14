import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { Message } from './entities/message.entity';
<<<<<<< Updated upstream
import { Group } from './entities/group.entity';
import { GroupPerson } from './entities/group-person.entity';
import { MessageRecipientPerson } from './entities/message-recipient-person.entity';
import { MessageRecipientGroup } from './entities/message-recipient-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Message, 
    Group, 
    GroupPerson, 
    MessageRecipientPerson, 
    MessageRecipientGroup
  ])],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService]
=======
import { Person } from '../persons/entities/person.entity';
import { GroupsModule } from '../groups/groups.module';
import { GroupPersonsModule } from '../group-persons/group-persons.module';
import { MessageRecipientPersonsModule } from '../message-recipient-persons/message-recipient-persons.module';
import { MessageRecipientGroupsModule } from '../message-recipient-groups/message-recipient-groups.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message, 
      Person,
    ]),
    forwardRef(() => GroupsModule),
    GroupPersonsModule,
    MessageRecipientPersonsModule,
    MessageRecipientGroupsModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesService, TypeOrmModule]
>>>>>>> Stashed changes
})
export class MessagesModule {}
