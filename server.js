"use strict";
const { DatabaseSync } = require("node:sqlite");
const watch = new DatabaseSync("./data/watchdata.db");
watch.exec(`CREATE TABLE IF NOT EXISTS calories (StartTime TEXT PRIMARY KEY, EndTime TEXT, kcal NUMBER)`);

const targetDate = new Date().toISOString().split('T')[0];
const startTime = `${targetDate}T00:00:00Z`;
const endTime = `${targetDate}T23:59:59Z`;

const { OAuth2Client } = require('google-auth-library');
let client;
const http = require('http');
const url = require('url');
function init(){
  
  client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  const server = http.createServer(async (req, res) => {
    if (req.url.startsWith('/oauth2callback')) {
      const q = url.parse(req.url, true).query;
      res.end('Authenticated! Return to terminal.');
      
      const { tokens } = await client.getToken(q.code);
      client.setCredentials(tokens);
      
      console.log('Connected. Fetching calories...');
      console.log(tokens.access_token);
      console.log(tokens.refresh_token);
      await syncData();
      
      server.close();
      process.exit(0);
    }
  }).listen(3000, () => {
    console.log('Visit this URL:\n' + authUrl);
  });
}
async function syncData() {
  const { token } = await client.getAccessToken();
  const url = `https://health.googleapis.com/v4/users/me/dataTypes/total-calories/dataPoints:rollUp`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        range: {
          startTime: "2026-04-28T00:00:00Z",
          endTime: "2026-04-29T23:59:59Z"
        },
        windowSize: "6600s"
      })
    });
    const data = await response.json();
    
    console.dir(data);
    const points = data.rollupDataPoints || [];
    if (!points) {
      console.log('No data found. Ensure your wearable has synced to the cloud');
    }
    points.forEach(p => {
      console.log(`- ${p.interval.startTime}: ${p.totalCalories.toFixed(1)} kcal`);
    });
    const upsert = watch.prepare(`
      INSERT INTO calories (time, value, origin, sync_at)
      VALUES (@time, @value, @origin, @sync_at)
      ON CONFLICT(time) DO UPDATE SET
        value = excluded.value,
        sync_at = excluded.sync_at
    `);
    const syncTransaction = watch.transaction((records) => {
      for (const record of records) upsert.run(record);
    });
    const dbRecords = points.map(p => ({
      time: p.interval.startTime,
      value: p.totalCalories, // v4 uses the specific field name
      origin: p.originId || 'unknown',
      sync_at: new Date().toISOString()
    }));
    if (dbRecords.length > 0) {
      syncTransaction(dbRecords);
      console.log(`Successfully synced ${dbRecords.length} records for ${targetDate}`);
    }
    return dbRecords;
  } catch (error) {
    console.error(`SQLite Sync Error for ${targetDate}:`, error.message);
  }
}

const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

app.get('/watch/x', (req, res) => {
  syncData();
  const stmt = watch.prepare("SELECT time FROM Calories");
  res.json(stmt.all());
});
app.get('/watch/y', (req, res) => {
  const stmt = watch.prepare("SELECT calories FROM Calories");
  res.json(stmt.all());
});
app.post('/food', (req, res) => {
  const stmt = watch.prepare();
});

const PORT = process.env.PORT || 8050;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  init();
});