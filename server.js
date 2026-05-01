"use strict";
const PORT = process.env.PORT || 8050;

const { DatabaseSync } = require("node:sqlite");
const watch = new DatabaseSync("./data/watchdata.db");
watch.exec(`CREATE TABLE IF NOT EXISTS calories (StartTime TEXT PRIMARY KEY, EndTime TEXT, kcal NUMBER)`);
const food = new DatabaseSync("./data/meals.db");
food.exec("CREATE TABLE IF NOT EXISTS meals (Time TEXT PRIMARY KEY, Name TEXT, kcal NUMBER)");

const targetDate = new Date().toISOString().split('T')[0];


const SCOPES = ['https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly', 'https://www.googleapis.com/auth/googlehealth.nutrition.readonly'];

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
      //res.redirect('/');
      server.close();
      //process.exit(0);
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
    const points = data.rollupDataPoints || [];
    console.dir(JSON.stringify(points));
    if (!points) {
      console.log('No data found. Ensure your wearable has synced to the cloud');
    }
    const upsert = watch.prepare(`INSERT INTO calories (StartTime, EndTime, kcal) VALUES (?, ?, ?) ON CONFLICT(StartTime) DO UPDATE SET kcal = ?`);
    for(let point of points){
      upsert.run(point.startTime, point.endTime, point.totalCalories.kcalSum, updatePoints(point.endTime, point.totalCalories.kcalSum));
    }
  } catch (error) {
    console.error(`SQLite Sync Error for ${targetDate}:`, error.message);
  }
}
function updatePoints(endTime, cal){
  const stmt = food.prepare("SELECT kcal FROM meals WHERE Time > ?");
  let set = stmt.all(endTime);
  if(set.length === 0){
    return cal;
  }
  let total = cal;
  for(let i = 0; i < set.length; i++){
    total += set[i].kcal;
  }
  return total;
}

const path = require('path');
const express = require('express');
const app = express();
const cors = require('cors');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors({
  origin: 'https://potential-enigma-jjp4gp55j647cpv47-5500.app.github.dev',
  credentials: true
}));

app.get('/watch/x', (req, res) => {
  syncData();
  const stmt = watch.prepare("SELECT EndTime FROM calories");
  res.json(stmt.all().map((_, index) => index));
});
app.get('/watch/y', (req, res) => {
  const stmt = watch.prepare("SELECT kcal FROM calories");
  res.json(stmt.all().map(row => row.kcal));
});
app.post('/food', async (req, res) => {
  const { name, time, recipe } = req.body;
  const stmt = food.prepare("INSERT INTO meals (Time, Name, kcal) VALUES (?, ?, ?)");
  stmt.run(time, name, recipe.calories);
  syncData();
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  init();
});