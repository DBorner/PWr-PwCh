import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameController } from './game/game.controller';
import { GameGateway } from './game/game.gateway';
import { GameService } from './game/game.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CognitoAuthModule } from '@nestjs-cognito/auth';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot(),
    CognitoAuthModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        jwtVerifier: {
          userPoolId: configService.get('COGNITO_USER_POOL_ID') as string,
          clientId: configService.get('COGNITO_CLIENT_ID'),
          tokenUse: 'id',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController, GameController],
  providers: [AppService, GameGateway, GameService],
})
export class AppModule {}
