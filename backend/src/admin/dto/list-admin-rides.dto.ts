import { IsEnum, IsISO8601, IsOptional } from 'class-validator';
import { RidePostStatus } from '@prisma/client';

export class ListAdminRidesDto {
  @IsOptional()
  @IsEnum(RidePostStatus)
  status?: RidePostStatus;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
