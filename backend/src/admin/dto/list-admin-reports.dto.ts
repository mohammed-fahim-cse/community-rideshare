import { IsEnum, IsOptional } from 'class-validator';
import { ReportStatus } from '@prisma/client';

export class ListAdminReportsDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
