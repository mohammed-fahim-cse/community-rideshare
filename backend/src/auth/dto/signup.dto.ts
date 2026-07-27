import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class SignupDto {
  @IsPhoneNumber()
  phone!: string;

  @IsString()
  @Length(4, 32)
  inviteCode!: string;
}
