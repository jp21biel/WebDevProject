"use strict";
const { DatabaseSync } = require("node:sqlite");
const watch = new DatabaseSync("./data/watchdata.db");
const fs = require('fs');
const clientPath = "./clients/test_client.json";
const { google } = require('googleapis');
const client = require(clientPath);
const auth = new google.auth.OAuth2(
  client.client_id,
  client.client_secret,
  client.redirect_uris
);
if(client.refresh_token === ""){
  const url = auth.generateAuthUrl({
    access_type: 'offline', // CRITICAL: This is how you get the refresh_token
    scope: ['https://www.googleapis.com/auth/health.activity.read'],
    prompt: 'consent' // Forces Google to show the consent screen so you get the refresh token
  });
  const { tokens } = await auth.getToken(code);
  client.access_token = tokens.access_token;
  client.refresh_token = tokens.refresh_token;
  fs.writeFileSync(clientPath, JSON.stringify(client));
}
auth.setCredentials({
  access_token: client.access_token,
  refresh_token: client.refresh_token
});
const health = google.health({ version: 'v4', auth });

async function syncData(targetDate) {
  // Define the start and end of the day in RFC3339 format
  const startTime = `${targetDate}T00:00:00Z`;
  const endTime = `${targetDate}T23:59:59Z`;
  const res = await health.users.dataTypes.dataPoints.list({
    auth,
    parent: 'users/me/dataTypes/totalCalories',
    startTime,
    endTime,
    pageSize: 1440, // Up to one point per minute for a full day
  });
  const points = res.data.dataPoints || [];
  // Map data for your database
  const dbRecords = points.map(p => ({
    time: p.startTime,
    value: p.value,
    origin: p.originId
  }));
  // Logic to save to your DB (Example using an imaginary db.upsert)
  await db.calories.upsertMany(dbRecords);
  return dbRecords;
}

const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

app.get('/watch/x', (req, res) => {
  const stmt = watch.prepare("SELECT time FROM Calories");
  res.json(stmt.all());
});
app.get('/watch/y', (req, res) => {
  const stmt = watch.prepare("SELECT calories FROM Calories");
  res.json(stmt.all());
});

const PORT = process.env.PORT || 8050;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});