const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');
const { Movie, Actor, Genre } = require('../models');
const { getMoviePoster, getActorPhoto } = require('../services/wikipediaService');

// Obtenir un film aléatoire
router.get('/random', async (req, res) => {
    try {
        const movie = await Movie.findOne({
            order: sequelize.random()
        });
        
        if (!movie) {
            return res.status(404).json({ error: 'Aucun film trouvé' });
        }
        
        res.json({ type: 'movie', data: movie });
    } catch (error) {
        console.error('Erreur lors de la récupération du film aléatoire:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtenir les détails d'un film
router.get('/:id/details', async (req, res) => {
    try {
        const movieId = req.params.id;
        
        const movie = await Movie.findByPk(movieId, {
            include: [
                {
                    model: Actor,
                    through: { attributes: [] }
                },
                {
                    model: Genre,
                    through: { attributes: [] }
                }
            ]
        });

        if (!movie) {
            return res.status(404).json({ error: 'Film non trouvé' });
        }

        // Obtenir l'affiche et la description du film
        const movieData = await getMoviePoster(movie.title);

        // Obtenir les photos et biographies des acteurs en parallèle
        const actorsWithPhotos = await Promise.all(
            movie.Actors.map(async (actor) => {
                const actorData = await getActorPhoto(actor.name);
                return {
                    ...actor.toJSON(),
                    photoUrl: actorData.photoUrl,
                    biography: actorData.biography
                };
            })
        );

        const response = {
            movie: {
                ...movie.toJSON(),
                posterUrl: movieData.posterUrl,
                extract: movieData.extract
            },
            actors: actorsWithPhotos,
            genres: movie.Genres
        };

        res.json(response);
    } catch (error) {
        console.error('Erreur lors de la récupération des détails du film:', error);
        res.status(500).json({ error: error.message });
    }
});

// Vérifier la réponse pour un film
router.post('/verify', async (req, res) => {
    try {
        const { id, answer } = req.body;
        
        if (!id || answer === undefined) {
            return res.status(400).json({ error: 'Paramètres manquants' });
        }
        
        const movie = await Movie.findByPk(id);
        
        if (!movie) {
            return res.status(404).json({ error: 'Film non trouvé' });
        }
        
        const correctAnswer = movie.title || '';

        res.json({
            correct: answer.toLowerCase() === correctAnswer.toLowerCase(),
            correctAnswer
        });
    } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;