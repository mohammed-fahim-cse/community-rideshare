import { IsIn, IsString, Length } from 'class-validator';

export const DEVICE_PLATFORMS = ['ios', 'android', 'web'] as const;
export type DevicePlatform = (typeof DEVICE_PLATFORMS)[number];

export class RegisterDeviceDto {
  @IsString()
  @Length(1, 512)
  token!: string;

  @IsIn(DEVICE_PLATFORMS)
  platform!: DevicePlatform;
}
