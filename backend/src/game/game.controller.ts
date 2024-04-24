import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { GameService } from './game.service';
import { Authentication, CognitoUser } from '@nestjs-cognito/auth';

@Controller('game')
@Authentication()
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get()
  getAvailableGames() {
    return this.gameService.checkAvailableGames();
  }

  @Post('create')
  createGame(@CognitoUser() user: any, @Body() body: { name: string }) {
    if (!body.name) {
      throw new HttpException('Name is required', 400);
    }
    if (!user.nickname) {
      throw new HttpException('User not found', 404);
    }
    const game = this.gameService.createGame(
      body.name,
      user.nickname,
      user.sub,
    );
    return {
      id: game.id,
    };
  }

  @Post('quit-any')
  quitAnyGame(@CognitoUser() user: any) {
    if (!user.sub) {
      throw new HttpException('User not found', 404);
    }
    this.gameService.removePlayerFromAllGames(user.sub);
    this.gameService.removeEmptyGames();
    return { message: 'Game quit' };
  }

  @Get('player-id')
  getPlayerId(@CognitoUser() user: any) {
    if (!user.sub) {
      throw new HttpException('User not found', 404);
    }
    return {
      playerId: user.sub,
    };
  }

  @Post('join/:id')
  joinGame(@Param('id') id: string, @CognitoUser() user: any) {
    const game = this.gameService.findOne(id);
    if (!game) {
      throw new HttpException('Game not found', 404);
    }
    if (!user.sub) {
      throw new HttpException('User not found', 404);
    }
    if (game.player1 === user.sub) {
      throw new HttpException('You are already in the game', 400);
    }
    if (this.gameService.isGameAvailable(game.id)) {
      this.gameService.addPlayerToGame(game.id, user.nickname, user.sub);
      if (this.gameService.isGameReady(game)) {
        this.gameService.startGame(game);
      }
      return {
        id: game.id,
      };
    }
    throw new HttpException('Game not available', 400);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':id')
  getGame(@Param('id') id: string) {
    return this.gameService.findOne(id);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Post(':id/move')
  makeMove(
    @Param('id') id: string,
    @CognitoUser() user: any,
    @Body()
    body: {
      row: number;
      column: number;
    },
  ) {
    const game = this.gameService.findOne(id);
    if (!game) {
      throw new HttpException('Game not found', 404);
    }
    if (game.status !== 'in-progress') {
      throw new HttpException('Game not in progress', 400);
    }
    if (!user.sub) {
      throw new HttpException('User not found', 404);
    }
    if (game.currentPlayer !== user.sub) {
      throw new HttpException('Not your turn', 400);
    }
    if (this.gameService.makeMove(game, body.row, body.column, user.sub)) {
      return this.gameService.findOne(id);
    }
    throw new HttpException('Invalid move', 400);
  }

  @Post(':id/restart')
  @UseInterceptors(ClassSerializerInterceptor)
  restartGame(@Param('id') id: string, @CognitoUser() user: any) {
    const game = this.gameService.findOne(id);
    if (!game) {
      throw new HttpException('Game not found', 404);
    }
    if (!user.sub) {
      throw new HttpException('User not found', 404);
    }
    if (game.currentPlayer !== user.sub) {
      throw new HttpException(
        'You are not allowed to restart this game. Please wait for opponent',
        400,
      );
    }
    this.gameService.restartGame(game);
    return this.gameService.findOne(id);
  }

  @Post(':id/quit')
  quitGame(@Param('id') id: string, @CognitoUser() user: any) {
    const game = this.gameService.findOne(id);
    if (!game) {
      throw new HttpException('Game not found', 404);
    }
    if (!user.sub) {
      throw new HttpException('User not found', 404);
    }
    this.gameService.removePlayerFromAllGames(user.sub);
    this.gameService.removeEmptyGames();
    return { message: 'Game quit' };
  }
}
