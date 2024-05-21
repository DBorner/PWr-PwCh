import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticateRequestDto } from './dto/authenticate.request.dto';
import { RegisterRequestDto } from './dto/register.request.dto';
import { ConfirmRequestDto } from './dto/confirm.request.dto';
import { RefreshRequestDto } from './dto/refresh.request.dto';
import { Authentication, CognitoUser } from '@nestjs-cognito/auth';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerRequest: RegisterRequestDto) {
    try {
      return await this.authService.register(registerRequest);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
  @Post('authenticate')
  async authenticate(@Body() authenticateRequest: AuthenticateRequestDto) {
    try {
      return await this.authService.authenticate(authenticateRequest);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('confirm')
  async confirm(@Body() confirmRequest: ConfirmRequestDto) {
    try {
      return await this.authService.confirmRegistration(confirmRequest);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('refreshToken')
  async refreshToken(@Body() refreshToken: RefreshRequestDto) {
    try {
      return await this.authService.refreshTokens(refreshToken);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('logout')
  @Authentication()
  async logout(@CognitoUser() user: any) {
    try {
      return await this.authService.singOut(user['cognito:username']);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('upload')
  @Authentication()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CognitoUser() user: any,
  ) {
    const username = user['cognito:username'];
    const response = await this.authService.uploadFileToS3(
      file,
      username + '.jpg',
    );
    console.log(response);

    return { message: 'File uploaded' };
  }
}
