"use strict";
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

const PORT = process.env.PORT || 8050;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});