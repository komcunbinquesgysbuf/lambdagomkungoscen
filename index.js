const express = require('express');
const app = express();
require('dotenv').config();
// app.use(express.json());
// app.use(express.text());
app.get('/healthz', (req, res) => res.status(200).end());
app.listen(parseInt(process.env.PORT, 10) || 3000);
