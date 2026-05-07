import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodesService } from './nodes.service';
import { NodesController } from './nodes.controller';
import { Node } from './entities/node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Node])],
  controllers: [NodesController],
  providers: [NodesService],
})
export class NodesModule {}
