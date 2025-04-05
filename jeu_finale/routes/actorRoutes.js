const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');
const { Movie, Actor, Genre } = require('../models');
const { getMoviePoster, getActorPhoto } = require('../services/wikipediaService');

// Obtenir un acteur aléatoire
router.get('/random', async (req, res) => {
    try {
        const actor = await Actor.findOne({
            order: sequelize.random()
        });
        
        if (!actor) {
            return res.status(404).json({ error: 'Aucun acteur trouvé' });
        }
        
        res.json({ type: 'actor', data: actor });
    } catch (error) {
      //  console.error('Erreur lors de la récupération de l\'acteur aléatoire:', error);
        return res.status(500).json({error});
    }
});

// Obtenir les détails d'un acteur
router.get('/:id/details', async (req, res) => {
    try {
        const actorId = req.params.id;
        
        const actor = await Actor.findByPk(actorId, {
            include: [
                {
                    model: Movie,
                    include: [
                        {
                            model: Genre,
                            through: { attributes: [] }
                        }
                    ],
                    through: { attributes: [] }
                }
            ]
        });

        if (!actor) {
            return res.status(404).json({ error: 'Acteur non trouvé' });
        }

        // Obtenir la photo et la biographie de l'acteur
        const actorData = await getActorPhoto(actor.name);
        
        // Obtenir les affiches et descriptions des films en parallèle
        const moviesWithPosters = await Promise.all(
            actor.Movies.map(async (movie) => {
                const movieData = await getMoviePoster(movie.title);
                return {
                    ...movie.toJSON(),
                    posterUrl: movieData.posterUrl,
                    extract: movieData.extract
                };
            })
        );

        const response = {
            actor: {
                ...actor.toJSON(),
                photoUrl: actorData.photoUrl,
                biography: actorData.biography
            },
            movies: moviesWithPosters
        };

        res.json(response);
    } catch (error) {
        console.error('Erreur lors de la récupération des détails de l\'acteur:', error);
        res.status(500).json({ error: error.message });
    }
});

// Vérifier la réponse pour un acteur
router.post('/verify', async (req, res) => {
    try {
        const { id, answer } = req.body;
        
        if (!id || answer === undefined) {
            return res.status(400).json({ error: 'Paramètres manquants' });
        }
        
        const actor = await Actor.findByPk(id);
        
        if (!actor) {
            return res.status(404).json({ error: 'Acteur non trouvé' });
        }
        
        const correctAnswer = actor.name || '';

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