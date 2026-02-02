require('dotenv').config();
const express = require('express');
const { connectDB } = require('./src/config/db');
const dailyReportRoutes = require('./src/routes/dailyReportRoutes');
const gameStatsRoutes = require('./src/routes/gameStatsRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/daily', dailyReportRoutes);
app.use('/stats', gameStatsRoutes);

// Error Handler (should be last)
app.use(errorHandler);

// Connect to DB and start server
connectDB().then(() => {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
});
