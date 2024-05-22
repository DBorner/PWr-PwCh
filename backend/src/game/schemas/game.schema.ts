import { Schema } from 'dynamoose';

export const GameHistorySchema = new Schema(
  {
    id: {
      type: String,
      hashKey: true,
    },
    name: {
      type: String,
    },
    player1: {
      type: String,
    },
    player1Name: {
      type: String,
    },
    player2: {
      type: String,
    },
    player2Name: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'winner', 'draw'],
    },
    winner: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
);
