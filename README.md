# rallyboard

Backend and database for an online leaderboard for old PC rally games.

This project is based on the [serverless REST API example tempate](https://github.com/serverless/examples/tree/master/aws-node-rest-api-with-dynamodb).


## Setup

Install and configure [AWS Command Line Interface](https://aws.amazon.com/cli/).

```bash
npm install
```

## Deploy

### Locally

```bash
serverless offline start
```

### To AWS

```bash
serverless deploy --stage prod
```

## Usage

You can currently upload stage times and query the top times by stage.
Take note of `$API_KEY` from serverless output.

### Upload a time

```bash
curl -X POST http://localhost:3000/local/leaderboard -d '{ "player": "Player 1", "game": "CMR", "rally": "Greece", "stage": "Krinides", "splits": [1,2,3,4], "time": 42, car: "SUBARU", "manual": true }' -H "x-api-key: $API_KEY" -H "Content-Type: application/json"
```

Example Result:
```bash
{"id":"8f9c0cf0-a117-11ea-8c28-3f89547f31c9","player":"Player 1","game":"CMR","rally":"Greece","stage":"Krinides","gameRallyStage":"CMR-Greece-Krinides","splits":[1,2,3,4],"time":42,"car":"SUBARU","manual":true,"createdAt":1590693315390}
```

### List top times for a stage

```bash
curl -X GET 'http://localhost:3000/local/leaderboard/CMR/Greece/Krinides'
```
