import { IsEnum, IsOptional } from 'class-validator';
import { UserStatus } from '@prisma/client';

export class ListMembersDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
