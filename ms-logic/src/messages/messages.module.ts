import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { Message } from './entities/message.entity';
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
  exports: [MessagesService, MessagesGateway, TypeOrmModule]
})
export class MessagesModule {}
