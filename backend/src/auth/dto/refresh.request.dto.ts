import { IsString } from 'class-validator';

export class RefreshRequestDto {
  @IsString()
  name: string;

  @IsString()
  refreshToken: string;
}
