import { IsBoolean, IsNumber, IsOptional, Length, Min } from 'class-validator';

export class UpdateCommunityDto {
  @IsOptional()
  @Length(1, 120)
  name?: string;

  @IsOptional()
  @IsBoolean()
  autoApprove?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  matchingRadiusKm?: number;
}
