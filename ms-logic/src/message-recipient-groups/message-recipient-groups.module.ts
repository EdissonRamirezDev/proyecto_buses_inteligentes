import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageRecipientGroup } from './entities/message-recipient-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MessageRecipientGroup])],
  exports: [TypeOrmModule],
})
export class MessageRecipientGroupsModule {}
