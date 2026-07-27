import { Length } from 'class-validator';

export class CreateMessageDto {
  @Length(1, 2000)
  text!: string;
}
