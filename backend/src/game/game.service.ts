import { Injectable } from '@nestjs/common';
import { Game } from './interfaces/game.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GameService {
  private readonly games: Game[] = [];

  findAll(): Game[] {
    return this.games;
  }

  update(id: string, game: Game): void {
    const index = this.games.findIndex((game) => game.id === id);
    this.games[index] = game;
  }

  remove(id: string): void {
    const index = this.games.findIndex((game) => game.id === id);
    this.games.splice(index, 1);
  }

  findOne(id: string): Game {
    return this.games.find((game) => game.id === id);
  }

  createGame(name: string, userName: string, userId: string): Game {
    const game: Game = new Game({
      id: uuidv4(),
      name,
      player1: userId,
      player1Name: userName,
      player2: null,
      player2Name: null,
      board: {
        board: [
          { row: [{ value: null }, { value: null }, { value: null }] },
          { row: [{ value: null }, { value: null }, { value: null }] },
          { row: [{ value: null }, { value: null }, { value: null }] },
        ],
      },
      currentPlayer: null,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.games.push(game);
    return game;
  }

  checkAvailableGames(): Game[] {
    const games = this.games.filter(
      (game) => game.player1 === null || game.player2 === null,
    );
    return games;
  }

  getGameByPlayerId(playerId: string): Game {
    return this.games.find(
      (game) => game.player1 === playerId || game.player2 === playerId,
    );
  }

  isGameAvailable(gameId: string): boolean {
    const game = this.findOne(gameId);
    return game.player1 === null || game.player2 === null;
  }

  isPlayerInGame(gameId: string, playerId: string): boolean {
    const game = this.findOne(gameId);
    return game.player1 === playerId || game.player2 === playerId;
  }

  addPlayerToGame(gameId: string, playerName: string, playerId: string): void {
    const game = this.findOne(gameId);
    if (game.player1 === null) {
      game.player1 = playerId;
      game.player1Name = playerName;
    } else {
      game.player2 = playerId;
      game.player2Name = playerName;
    }
    this.update(gameId, game);
  }

  removePlayerFromAllGames(playerId: string): void {
    this.games.forEach((game) => {
      if (game.player1 === playerId) {
        game.player1 = null;
        game.player1Name = null;
        game.currentPlayer = 'p1';
        if (game.status === 'winner' || game.status === 'draw') {
          console.log('restart game');
          this.restartGame(game);
        } else {
          game.status = 'pending';
        }
      }
      if (game.player2 === playerId) {
        game.player2 = null;
        game.player2Name = null;
        game.currentPlayer = 'p2';
        if (game.status === 'winner' || game.status === 'draw') {
          console.log('restart game');
          this.restartGame(game);
        } else {
          game.status = 'pending';
        }
      }
      this.update(game.id, game);
    });
  }

  removeEmptyGames(): void {
    this.games.forEach((game) => {
      if (game.player1 === null && game.player2 === null) {
        this.remove(game.id);
      }
    });
  }

  isPlayerTurn(game: Game, playerId: string): boolean {
    return game.currentPlayer === playerId;
  }

  isGameDraw(game: Game): boolean {
    return game.board.board.every((row) =>
      row.row.every((cell) => cell.value !== null),
    );
  }

  isGameReady(game: Game): boolean {
    return game.player1 !== null && game.player2 !== null;
  }

  isPlayerGameAdmin(gameId: string, playerId: string): boolean {
    const game = this.findOne(gameId);
    return game.player1 === playerId;
  }

  startGame(game: Game): void {
    if (game.currentPlayer === 'p1') {
      game.currentPlayer = game.player1;
    } else if (game.currentPlayer === 'p2') {
      game.currentPlayer = game.player2;
    } else {
      game.currentPlayer = game.player1;
    }
    game.status = 'in-progress';
    this.update(game.id, game);
  }

  isGameFinished(game: Game): boolean {
    return game.status === 'winner' || game.status === 'draw';
  }

  makeMove(game: Game, row: number, column: number, playerId: string): boolean {
    if (!this.isPlayerTurn(game, playerId)) {
      return false;
    }
    if (game.board.board[row].row[column].value !== null) {
      return false;
    }
    game.board.board[row].row[column].value =
      playerId === game.player1 ? 'P1' : 'P2';
    const winner = this.getGameWinner(game);
    if (winner !== null) {
      game.currentPlayer = winner === 'P1' ? game.player1 : game.player2;
      game.status = 'winner';
      return true;
    }
    if (this.isGameDraw(game)) {
      game.status = 'draw';
      return true;
    }
    game.currentPlayer =
      playerId === game.player1 ? game.player2 : game.player1;
    game.updatedAt = new Date();
    this.update(game.id, game);
    return true;
  }

  getGameWinner(game: Game): 'P1' | 'P2' | null {
    const board = game.board;
    for (const row of board.board) {
      if (row.row.every((cell) => cell.value === 'P1')) return 'P1';
      if (row.row.every((cell) => cell.value === 'P2')) return 'P2';
    }

    for (let i = 0; i < 3; i++) {
      if (
        board.board[0].row[i].value === 'P1' &&
        board.board[1].row[i].value === 'P1' &&
        board.board[2].row[i].value === 'P1'
      )
        return 'P1';
      if (
        board.board[0].row[i].value === 'P2' &&
        board.board[1].row[i].value === 'P2' &&
        board.board[2].row[i].value === 'P2'
      )
        return 'P2';
    }

    if (
      (board.board[0].row[0].value === 'P1' &&
        board.board[1].row[1].value === 'P1' &&
        board.board[2].row[2].value === 'P1') ||
      (board.board[0].row[2].value === 'P1' &&
        board.board[1].row[1].value === 'P1' &&
        board.board[2].row[0].value === 'P1')
    )
      return 'P1';

    if (
      (board.board[0].row[0].value === 'P2' &&
        board.board[1].row[1].value === 'P2' &&
        board.board[2].row[2].value === 'P2') ||
      (board.board[0].row[2].value === 'P2' &&
        board.board[1].row[1].value === 'P2' &&
        board.board[2].row[0].value === 'P2')
    )
      return 'P2';
    return null;
  }

  restartGame(game: Game): void {
    game.board = {
      board: [
        { row: [{ value: null }, { value: null }, { value: null }] },
        { row: [{ value: null }, { value: null }, { value: null }] },
        { row: [{ value: null }, { value: null }, { value: null }] },
      ],
    };
    if (game.player1 !== null && game.player2 !== null) {
      game.currentPlayer =
        game.player1 === game.currentPlayer ? game.player2 : game.player1;
      game.status = 'in-progress';
      game.updatedAt = new Date();
      this.update(game.id, game);
    } else {
      game.status = 'pending';
      game.updatedAt = new Date();
      this.update(game.id, game);
    }
  }
}
