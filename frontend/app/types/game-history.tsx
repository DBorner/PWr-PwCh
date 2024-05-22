
type GameStatus = 'pending' | 'in-progress' | 'winner' | 'draw';

export type GameHistory = {
  player1: any;
  player2: any;
  id: string;
  name: string;
  player1Name: string;
  player1pub: string;
  player2Name: string;
  player2pub: string;
  status: GameStatus;
  winner?: string;
  createdAt: Date;
  updatedAt: Date;
};