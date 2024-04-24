import { IsString } from 'class-validator';

export class ConfirmRequestDto {
  @IsString()
  name: string;

  @IsString()
  code: string;
}
