'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const CONFIG_DYNAMODB_ENDPOINT = process.env.CONFIG_DYNAMODB_ENDPOINT;
const IS_OFFLINE = process.env.IS_OFFLINE;

let dynamoDb;
if (IS_OFFLINE === 'true') {
  dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: CONFIG_DYNAMODB_ENDPOINT,
  });
} else {
  dynamoDb = new AWS.DynamoDB.DocumentClient();
}

module.exports.create = (event, context, callback) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body);

  if (typeof data.player !== 'string') {
    console.error('Validation Failed');
    callback(null, {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Couldn\'t create the leaderboard item.',
    });
    return;
  }

  console.log(data)

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      'id': uuid.v1(),
      'player': data.player,
      'game': data.game,
      'rally': data.rally,
      'stage': data.stage,
      'gameRallyStage': [data.game, data.rally, data.stage].join("-"),
      'splits': data.splits,
      'time': data.time,
      'car': data.car,
      'manual': data.manual, 
      'createdAt': timestamp
    },
  };

  // write the stage time to the database
  dynamoDb.put(params, (error) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Couldn\'t create the leaderboard item.',
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(params.Item),
    };

    callback(null, response);
  });
};
