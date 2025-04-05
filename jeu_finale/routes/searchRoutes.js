const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const { Movie, Actor, Genre } = require('../models');
const { getMoviePoster, getActorPhoto } = require('../services/wikipediaService');

// Types de recherche supportés
const SEARCH_TYPES = {
    MOVIE: 'movie',
    ACTOR: 'actor'
};

router.get('/', async (req, res) => {
    try {
        const { query, type } = req.query;
        
        if (!query) {
            return res.status(400).json({ error: 'Paramètre de recherche manquant' });
        }
        
        if (!type || !Object.values(SEARCH_TYPES).includes(type)) {
            return res.status(400).json({ 
                error: 'Type de recherche non valide',
                supportedTypes: Object.values(SEARCH_TYPES)
            });
        }
        
        let results = [];

        if (type === SEARCH_TYPES.MOVIE) {
            results = await searchMovies(query);
        } else if (type === SEARCH_TYPES.ACTOR) {
            results = await searchActors(query);
        }

        res.json({ type, results });
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rechercher des films
async function searchMovies(query) {
    // Échapper les caractères spéciaux pour éviter les injections SQL
    const escapedQuery = query.replace(/[%_]/g, char => `\\${char}`);
    
    const movies = await Movie.findAll({
        where: {
            title: {
                [Op.like]: `%${escapedQuery}%`
            }
        },
        include: [
            {
                model: Actor,
                through: { attributes: [] }
            },
            {
                model: Genre,
                through: { attributes: [] }
            }
        ],
        limit: 10 // Limiter le nombre de résultats
    });

    // Obtenir les affiches et descriptions des films en parallèle
    return Promise.all(
        movies.map(async (movie) => {
            try {
                const movieData = await getMoviePoster(movie.title);
                return {
                    ...movie.toJSON(),
                    posterUrl: movieData.posterUrl,
                    extract: movieData.extract
                };
            } catch (error) {
                console.error(`Erreur lors de la récupération des données pour ${movie.title}:`, error);
                return {
                    ...movie.toJSON(),
                    posterUrl: null,
                    extract: null
                };
            }
        })
    );
}

// Rechercher des acteurs
async function searchActors(query) {
    // Échapper les caractères spéciaux pour éviter les injections SQL
    const escapedQuery = query.replace(/[%_]/g, char => `\\${char}`);
    
    const actors = await Actor.findAll({
        where: {
            name: {
                [Op.like]: `%${escapedQuery}%`
            }
        },
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
        ],
        limit: 10 // Limiter le nombre de résultats
    });

    // Obtenir les photos et biographies des acteurs en parallèle
    return Promise.all(
        actors.map(async (actor) => {
            try {
                const actorData = await getActorPhoto(actor.name);
                return {
                    ...actor.toJSON(),
                    photoUrl: actorData.photoUrl,
                    biography: actorData.biography
                };
            } catch (error) {
                console.error(`Erreur lors de la récupération des données pour ${actor.name}:`, error);
                return {
                    ...actor.toJSON(),
                    photoUrl: null,
                    biography: null
                };
            }
        })
    );
}

module.exports = router;