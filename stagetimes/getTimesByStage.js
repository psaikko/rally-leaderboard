'use strict';

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

module.exports.getTimesByStage = (event, context, callback) => {

  const gsiKey = [
    event.pathParameters.game, 
    event.pathParameters.rally, 
    event.pathParameters.stage
    ].join('-');

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    IndexName: 'stageGSI',
    KeyConditionExpression: 'gameRallyStage = :stageid',
    ExpressionAttributeValues: {
      ':stageid': gsiKey
    }
  };

  // fetch stage time from the database
  dynamoDb.query(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Couldn\'t query the stage index.',
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(result),
    };
    callback(null, response);
  });
};
