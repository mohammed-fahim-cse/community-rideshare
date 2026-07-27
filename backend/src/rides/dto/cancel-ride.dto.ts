import { IsOptional, IsString, Length } from 'class-validator';

export class CancelRideDto {
  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}
