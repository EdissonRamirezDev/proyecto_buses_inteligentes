import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UserIdDto } from '../messages/dto/user-id.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  createGroup(@Body() body: CreateGroupDto) {
    return this.groupsService.createGroup(
      body.userId,
      body.nombre,
      body.descripcion,
      body.isPublic,
      body.icon,
      body.memberIds
    );
  }

  @Get('my-groups/:userId')
  getMyGroups(@Param('userId') userId: string) {
    return this.groupsService.getMyGroups(userId);
  }

  @Post(':groupId/members')
  addMemberToGroup(
    @Param('groupId') groupId: string,
    @Body() body: AddMemberDto
  ) {
    return this.groupsService.addMemberToGroup(groupId, body.adminId, body.personId);
  }

  @Get(':groupId/members')
  getGroupMembers(@Param('groupId') groupId: string, @Query('search') search?: string) {
    return this.groupsService.getGroupMembers(groupId, search);
  }

  @Get('public')
  getPublicGroups(@Query('userId') userId?: string, @Query('search') search?: string) {
    return this.groupsService.getPublicGroups(userId, search);
  }

  @Post(':groupId/join')
  joinPublicGroup(@Param('groupId') groupId: string, @Body() body: UserIdDto) {
    return this.groupsService.joinPublicGroup(groupId, body.userId);
  }

  @Post(':groupId/leave')
  leaveGroup(@Param('groupId') groupId: string, @Body() body: UserIdDto) {
    return this.groupsService.leaveGroup(groupId, body.userId);
  }

  @Patch(':groupId/members/:personId/promote')
  promoteMember(@Param('groupId') groupId: string, @Param('personId') personId: string, @Body() body: UserIdDto) {
    return this.groupsService.promoteMember(groupId, body.userId, personId);
  }

  @Delete(':groupId/members/:personId')
  removeMember(@Param('groupId') groupId: string, @Param('personId') personId: string, @Query('adminId') adminId: string) {
    return this.groupsService.removeMember(groupId, adminId, personId);
  }

  @Post(':groupId/members/:personId/block')
  blockMember(@Param('groupId') groupId: string, @Param('personId') personId: string, @Body() body: UserIdDto) {
    return this.groupsService.blockMember(groupId, body.userId, personId);
  }

  @Get(':groupId/logs')
  getGroupLogs(@Param('groupId') groupId: string, @Query('adminId') adminId: string) {
    return this.groupsService.getGroupLogs(groupId, adminId);
  }
}
