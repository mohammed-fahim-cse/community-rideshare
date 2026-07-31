import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUserGuard } from '../common/guards/active-user.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { ListMembersDto } from './dto/list-members.dto';
import { ListAdminReportsDto } from './dto/list-admin-reports.dto';
import { ReportActionDto } from './dto/report-action.dto';
import { ListAdminRidesDto } from './dto/list-admin-rides.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, ActiveUserGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('members')
  listMembers(@CurrentUser() admin: User, @Query() query: ListMembersDto) {
    return this.adminService.listMembers(admin, query);
  }

  @Post('members/:id/approve')
  approveMember(@CurrentUser() admin: User, @Param('id') id: string) {
    return this.adminService.approveMember(admin, id);
  }

  @Get('reports')
  listReports(@CurrentUser() admin: User, @Query() query: ListAdminReportsDto) {
    return this.adminService.listReports(admin, query);
  }

  @Post('reports/:id/action')
  actionReport(@CurrentUser() admin: User, @Param('id') id: string, @Body() dto: ReportActionDto) {
    return this.adminService.actionReport(admin, id, dto);
  }

  @Get('rides')
  listRides(@CurrentUser() admin: User, @Query() query: ListAdminRidesDto) {
    return this.adminService.listRides(admin, query);
  }

  @Get('community')
  getCommunity(@CurrentUser() admin: User) {
    return this.adminService.getCommunity(admin);
  }

  @Patch('community')
  updateCommunity(@CurrentUser() admin: User, @Body() dto: UpdateCommunityDto) {
    return this.adminService.updateCommunity(admin, dto);
  }
}
