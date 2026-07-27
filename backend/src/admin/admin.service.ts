import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ReportStatus, User, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListMembersDto } from './dto/list-members.dto';
import { ListAdminReportsDto } from './dto/list-admin-reports.dto';
import { ReportActionDto } from './dto/report-action.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listMembers(admin: User, query: ListMembersDto) {
    return this.prisma.user.findMany({
      where: {
        communityId: admin.communityId,
        status: query.status ?? UserStatus.PENDING,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveMember(admin: User, memberId: string) {
    const member = await this.prisma.user.findUnique({ where: { id: memberId } });
    if (!member || member.communityId !== admin.communityId) {
      throw new NotFoundException('Member not found');
    }
    if (member.status !== UserStatus.PENDING) {
      throw new ConflictException(`Cannot approve a member with status ${member.status}`);
    }

    return this.prisma.user.update({ where: { id: memberId }, data: { status: UserStatus.ACTIVE } });
  }

  async listReports(admin: User, query: ListAdminReportsDto) {
    return this.prisma.report.findMany({
      where: {
        status: query.status ?? ReportStatus.OPEN,
        reportedUser: { communityId: admin.communityId },
      },
      include: {
        reporter: { select: { id: true, name: true, phone: true } },
        reportedUser: { select: { id: true, name: true, phone: true, status: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async actionReport(admin: User, reportId: string, dto: ReportActionDto) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { reportedUser: true },
    });
    if (!report || report.reportedUser.communityId !== admin.communityId) {
      throw new NotFoundException('Report not found');
    }
    if (report.status !== ReportStatus.OPEN) {
      throw new ConflictException(`Report already ${report.status.toLowerCase()}`);
    }

    if (dto.action === 'DISMISS') {
      return this.prisma.report.update({ where: { id: reportId }, data: { status: ReportStatus.REVIEWED } });
    }

    // WARN is logged as actioned with no further effect (no separate warnings ledger yet);
    // SUSPEND/REMOVE both map to the existing SUSPENDED status — there's no distinct
    // "removed" account state in the MVP schema.
    return this.prisma.$transaction(async (tx) => {
      if (dto.action === 'SUSPEND' || dto.action === 'REMOVE') {
        await tx.user.update({ where: { id: report.reportedUserId }, data: { status: UserStatus.SUSPENDED } });
      }
      return tx.report.update({ where: { id: reportId }, data: { status: ReportStatus.ACTIONED } });
    });
  }
}
