import { Module } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';
import { GameHistorySchema } from './schemas/game.schema';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    DynamooseModule.forFeature([
      {
        name: 'GameHistory',
        schema: GameHistorySchema,
        options: {
          tableName: 'games-histories',
        },
      },
    ]),
  ],
  controllers: [GameController],
  providers: [GameService, GameGateway],
})
export class GameModule {}
