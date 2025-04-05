const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('../config/database');
const { Movie, Actor, Genre } = require('../models');
const movieRoutes = require('../routes/movieRoutes');
const actorRoutes = require('../routes/actorRoutes');
const searchRoutes = require('../routes/searchRoutes');
const quizRoutes = require('../routes/quizRoutes');
const gameRoutes = require('../routes/gameRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialiser les modèles
const initModels = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ force: false
            
         });
        console.log('Modèles de base de données initialisés avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation des modèles:', error);
        throw error;
    }
};

// Initialiser les modèles avant de démarrer le serveur
initModels().catch(error => {
    console.error('Échec de l\'initialisation des modèles:', error);
    process.exit(1);
});

// Routes
app.use('/api/game', gameRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/actors', actorRoutes);
app.use('/api/search', searchRoutes);

module.exports = app; 