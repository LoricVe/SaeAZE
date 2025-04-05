const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const { Movie, Actor, Genre } = require('../models');

// Types de quiz supportés
const QUIZ_TYPES = {
    ACTOR_IN_MOVIE: 'actor_in_movie',
    MOVIE_BY_ACTOR: 'movie_by_actor',
    MOVIES_BY_YEAR: 'movies_by_year'
};

// Générer un quiz en fonction du type demandé
router.get('/generate', async (req, res) => {
    try {
        const { type } = req.query;
        
        if (!type || !Object.values(QUIZ_TYPES).includes(type)) {
            return res.status(400).json({ 
                error: 'Type de quiz non valide',
                supportedTypes: Object.values(QUIZ_TYPES)
            });
        }
        
        let quizData = null;
        
        switch (type) {
            case QUIZ_TYPES.ACTOR_IN_MOVIE:
                quizData = await generateActorInMovieQuiz();
                break;
            case QUIZ_TYPES.MOVIE_BY_ACTOR:
                quizData = await generateMovieByActorQuiz();
                break;
            case QUIZ_TYPES.MOVIES_IN_GENRE:
                quizData = await generateMoviesInGenreQuiz();
                break;
            case QUIZ_TYPES.ACTORS_IN_GENRE:
                quizData = await generateActorsInGenreQuiz();
                break;
            case QUIZ_TYPES.MOVIES_BY_YEAR:
                quizData = await generateMoviesByYearQuiz();
                break;
        }
        
        if (!quizData) {
            return res.status(500).json({ error: 'Impossible de générer le quiz' });
        }
        
        res.json(quizData);
    } catch (error) {
        console.error('Erreur lors de la génération du quiz:', error);
        res.status(500).json({ error: error.message });
    }
});

// Sélection aléatoire d'un élément dans un tableau
function getRandomElement(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

// Générer un quiz sur les acteurs d'un film spécifique
async function generateActorInMovieQuiz() {
    // Trouver un film ayant au moins 3 acteurs
    const movies = await Movie.findAll({
        include: [{
            model: Actor,
            through: { attributes: [] }
        }]
    });
    
    // Filtrer pour trouver les films avec suffisamment d'acteurs
    const eligibleMovies = movies.filter(movie => movie.Actors.length >= 3);
    
    if (eligibleMovies.length === 0) {
        throw new Error('Aucun film avec suffisamment d\'acteurs trouvé');
    }
    
    // Sélectionner un film aléatoirement
    const selectedMovie = getRandomElement(eligibleMovies);
    
    return {
        type: QUIZ_TYPES.ACTOR_IN_MOVIE,
        question: `Nommez tous les acteurs qui jouent dans "${selectedMovie.title}" (${selectedMovie.year})`,
        answers: selectedMovie.Actors.map(actor => actor.name),
        centerNode: {
            id: selectedMovie.id,
            title: selectedMovie.title,
            year: selectedMovie.year,
            type: 'movie'
        },
        relatedNodes: selectedMovie.Actors.map(actor => ({
            id: actor.id,
            name: actor.name,
            type: 'actor'
        }))
    };
}

// Générer un quiz sur les films d'un acteur spécifique
async function generateMovieByActorQuiz() {
    // Trouver un acteur ayant joué dans au moins 3 films
    const actors = await Actor.findAll({
        include: [{
            model: Movie,
            through: { attributes: [] }
        }]
    });
    
    // Filtrer pour trouver les acteurs avec suffisamment de films
    const eligibleActors = actors.filter(actor => actor.Movies.length >= 3);
    
    if (eligibleActors.length === 0) {
        throw new Error('Aucun acteur avec suffisamment de films trouvé');
    }
    
    // Sélectionner un acteur aléatoirement
    const selectedActor = getRandomElement(eligibleActors);
    
    return {
        type: QUIZ_TYPES.MOVIE_BY_ACTOR,
        question: `Nommez tous les films dans lesquels "${selectedActor.name}" a joué`,
        answers: selectedActor.Movies.map(movie => movie.title),
        centerNode: {
            id: selectedActor.id,
            name: selectedActor.name,
            type: 'actor'
        },
        relatedNodes: selectedActor.Movies.map(movie => ({
            id: movie.id,
            title: movie.title,
            year: movie.year,
            type: 'movie'
        }))
    };
}


// Générer un quiz sur les films sortis une année spécifique
async function generateMoviesByYearQuiz() {
    // Trouver des années avec au moins 3 films
    const years = await Movie.findAll({
        attributes: [
            'year',
            [sequelize.fn('COUNT', sequelize.col('id')), 'movieCount']
        ],
        group: ['year'],
        having: sequelize.literal('COUNT(id) >= 3')
    });
    
    if (years.length === 0) {
        throw new Error('Aucune année avec suffisamment de films trouvée');
    }
    
    // Sélectionner une année aléatoirement
    const selectedYear = getRandomElement(years).year;
    
    // Trouver tous les films de cette année
    const moviesInYear = await Movie.findAll({
        where: { year: selectedYear }
    });
    
    return {
        type: QUIZ_TYPES.MOVIES_BY_YEAR,
        question: `Nommez des films sortis en ${selectedYear}`,
        answers: moviesInYear.map(movie => movie.title),
        centerNode: {
            id: `year_${selectedYear}`,
            name: `Année ${selectedYear}`,
            type: 'year'
        },
        relatedNodes: moviesInYear.map(movie => ({
            id: movie.id,
            title: movie.title,
            year: movie.year,
            type: 'movie'
        }))
    };
}

module.exports = router;