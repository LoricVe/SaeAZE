const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const movieRoutes = require('./routes/movieRoutes');
const actorRoutes = require('./routes/actorRoutes');
const searchRoutes = require('./routes/searchRoutes');
const quizRoutes = require('./routes/quizRoutes');
const gameRoutes = require('./routes/gameRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/movies', movieRoutes);
app.use('/api/actors', actorRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/game', gameRoutes);

// Démarrer le serveur
async function startServer() {
    try {
        // Tester la connexion à la base de données
        await sequelize.authenticate();
        console.log('Connexion à la base de données réussie');

        // Synchroniser les modèles de la base de données (en développement uniquement)
        await sequelize.sync();
        console.log('Synchronisation des modèles réussie');

        app.listen(PORT, () => {
            console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
}

startServer();