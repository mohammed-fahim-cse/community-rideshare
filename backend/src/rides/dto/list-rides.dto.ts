import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { RideMode, RidePostStatus, RidePostType } from '@prisma/client';

export class ListRidesDto {
  @IsOptional()
  @IsEnum(RidePostStatus)
  status?: RidePostStatus;

  @IsOptional()
  @IsEnum(RideMode)
  mode?: RideMode;

  @IsOptional()
  @IsEnum(RidePostType)
  type?: RidePostType;

  // "lat,lng" — parsed and validated in the service, since it's a single combined query param.
  @IsOptional()
  @IsString()
  near?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  radiusKm?: number;
}
