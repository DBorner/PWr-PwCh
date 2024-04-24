import { Controller, Get } from '@nestjs/common';
import { Authentication, CognitoUser } from '@nestjs-cognito/auth';

@Controller('')
@Authentication()
export class AppController {
  @Get('')
  returnUser(@CognitoUser() user: any) {
    return user.nickname;
  }
}
