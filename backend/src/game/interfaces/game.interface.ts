import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsString,
} from 'class-validator';
import { TicTacToeBoard } from './board.interface';
import { Exclude } from 'class-transformer';

export class Game {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @Exclude()
  @IsString()
  player1: string;

  @IsString()
  player1Name: string;

  @Exclude()
  @IsString()
  player2: string;

  @IsString()
  player2Name: string;

  @IsObject()
  board: TicTacToeBoard;

  @IsString()
  currentPlayer: string;

  @IsNotEmpty()
  @IsEnum(['pending', 'in-progress', 'winner', 'draw'])
  status: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  constructor(partial: Partial<Game>) {
    Object.assign(this, partial);
  }
}

export interface GameHistoryKey {
  id: string;
}

export interface GameHistory extends GameHistoryKey {
  name: string;
  player1: string;
  player1Name: string;
  player2: string;
  player2Name: string;
  board: TicTacToeBoard;
  status: string;
  winner?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
