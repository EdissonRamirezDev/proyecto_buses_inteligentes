import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { Message } from './entities/message.entity';
import { Group } from './entities/group.entity';
import { GroupPerson } from './entities/group-person.entity';
import { MessageRecipientPerson } from './entities/message-recipient-person.entity';
import { MessageRecipientGroup } from './entities/message-recipient-group.entity';
import { Person } from '../persons/entities/person.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Message, 
    Group, 
    GroupPerson, 
    MessageRecipientPerson, 
    MessageRecipientGroup,
    Person,
  ])],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService]
})
export class MessagesModule {}
