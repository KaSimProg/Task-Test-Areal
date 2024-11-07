const express = require('express');
const { initDatabase } = require('./config/init_db');
const workerRoutes = require('./routes/index');
const cors = require('cors');

const app = express();

const startServer = async () => {
    try {
        await initDatabase();

        app.use(cors());
        app.use(express.json());
        app.use('/api', workerRoutes);

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
};

startServer();
