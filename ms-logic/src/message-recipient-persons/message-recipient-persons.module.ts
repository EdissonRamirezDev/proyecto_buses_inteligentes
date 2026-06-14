import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageRecipientPerson } from './entities/message-recipient-person.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MessageRecipientPerson])],
  exports: [TypeOrmModule],
})
export class MessageRecipientPersonsModule {}
