import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  Length,
  Min,
  ValidateIf,
} from 'class-validator';
import { RideMode, RidePostType } from '@prisma/client';

export class CreateRidePostDto {
  @IsEnum(RidePostType)
  type!: RidePostType;

  @IsEnum(RideMode)
  mode!: RideMode;

  @IsNumber()
  pickupLat!: number;

  @IsNumber()
  pickupLng!: number;

  @Length(1, 240)
  pickupAddress!: string;

  @IsNumber()
  destinationLat!: number;

  @IsNumber()
  destinationLng!: number;

  @Length(1, 240)
  destinationAddress!: string;

  @ValidateIf((o) => o.mode === RideMode.SCHEDULED)
  @IsISO8601()
  scheduledTime?: string;

  @ValidateIf((o) => o.type === RidePostType.OFFER)
  @IsInt()
  @Min(1)
  seatsAvailable?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  suggestedFare?: number;
}
