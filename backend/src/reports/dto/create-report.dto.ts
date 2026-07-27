import { IsOptional, IsUUID, Length } from 'class-validator';

export class CreateReportDto {
  @IsUUID()
  reportedUserId!: string;

  @Length(1, 500)
  reason!: string;

  @IsOptional()
  @IsUUID()
  rideMatchId?: string;
}
