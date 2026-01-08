const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config();

app.use(cors());
app.use(express.json());

const database = require('./db');

app.use('/api', require('./authRoutes'));

const PORT = process.env.PORT || 7000;

database().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
