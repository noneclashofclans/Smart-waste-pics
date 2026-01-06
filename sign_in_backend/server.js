const PORT = 7000;
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config();

app.use(cors());
app.use(express.json());

const database = require('./db');

app.use('/api', require('./authRoutes'));


database().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
