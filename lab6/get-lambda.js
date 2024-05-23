import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const rankingTableName = "games-ranking";

export const handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };

  const gamesRanking = await dynamo.send(
    new ScanCommand({ TableName: rankingTableName })
  );

  body = JSON.stringify(gamesRanking.Items);

  return {
    statusCode,
    body,
    headers,
  };
};
