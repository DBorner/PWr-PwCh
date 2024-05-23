import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = "games-histories";
const rankingTableName = "games-ranking";

export const handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };

  const gamesHistory = await dynamo.send(
    new ScanCommand({ TableName: tableName })
  );

  const ranking = createRanking(gamesHistory.Items);

  await updateRankingInDB(ranking);

  body = JSON.stringify(ranking);

  return {
    statusCode,
    body,
    headers,
  };
};

const createRanking = (gamesHistory) => {
  let ranking = {};
  gamesHistory.forEach((game) => {
    if (game.status === "winner") {
      if (!ranking[game.player1]) {
        ranking[game.player1] = {
          player: game.player1,
          playerName: game.player1Name,
          wins: 0,
          losses: 0,
          draws: 0,
          score: 0,
        };
      }
      if (!ranking[game.player2]) {
        ranking[game.player2] = {
          player: game.player2,
          playerName: game.player2Name,
          wins: 0,
          losses: 0,
          draws: 0,
          score: 0,
        };
      }
      if (game.winner === game.player1) {
        ranking[game.player1].wins++;
        ranking[game.player1].score += 3;
        ranking[game.player2].losses++;
        ranking[game.player2].score--;
      } else {
        ranking[game.player2].wins++;
        ranking[game.player2].score += 3;
        ranking[game.player1].losses++;
        ranking[game.player1].score--;
      }
    } else if (game.status == "draw") {
      if (!ranking[game.player1]) {
        ranking[game.player1] = {
          player: game.player1,
          playerName: game.player1Name,
          wins: 0,
          losses: 0,
          draws: 1,
          score: 1,
        };
      } else {
        ranking[game.player1].draws++;
        ranking[game.player1].score++;
      }
      if (!ranking[game.player2]) {
        ranking[game.player2] = {
          player: game.player2,
          playerName: game.player2Name,
          wins: 0,
          losses: 0,
          draws: 1,
          score: 1,
        };
      } else {
        ranking[game.player2].draws++;
        ranking[game.player2].score++;
      }
    }
  });
  return ranking;
};

const updateRankingInDB = async (ranking) => {
  for (const player in ranking) {
    const playerData = ranking[player];
    const params = {
      TableName: rankingTableName,
      Item: {
        player: playerData.player,
        playerName: playerData.playerName,
        wins: playerData.wins,
        losses: playerData.losses,
        draws: playerData.draws,
        score: playerData.score,
      },
    };
    await dynamo.send(new PutCommand(params));
  }
};
