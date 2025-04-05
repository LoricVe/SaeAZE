const request = require('supertest');
const express = require('express');
const quizRoutes = require('../routes/quizRoutes');
const sequelize = require('../config/database');
const { Movie, Actor, Genre } = require('../models');

// create test application
const app = express();
app.use(express.json());
app.use('/quiz', quizRoutes);

// mock sequelize et les modèles
jest.mock('../config/database', () => ({
  literal: jest.fn(),
  fn: jest.fn(),
  col: jest.fn(),
  random: jest.fn()
}));

jest.mock('../models', () => ({
  Movie: {
    findAll: jest.fn()
  },
  Actor: {
    findAll: jest.fn()
  },
  Genre: {
    findAll: jest.fn()
  }
}));

describe('quiz routes test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configuration des mocks pour sequelize
    sequelize.fn.mockReturnValue('COUNT_FUNCTION');
    sequelize.col.mockReturnValue('COLUMN');
    sequelize.literal.mockReturnValue('COUNT(id) >= 3');
  });

  describe('GET /quiz/generate', () => {
    it('should generate an actor in movie quiz', async () => {
      const mockMovies = [{
        id: 1,
        title: 'Test Movie',
        year: 2020,
        Actors: [
          { id: 1, name: 'Actor 1' },
          { id: 2, name: 'Actor 2' },
          { id: 3, name: 'Actor 3' }
        ],
        Genres: [
          { id: 1, name: 'Action' },
          { id: 2, name: 'Drama' }
        ]
      }];

      Movie.findAll.mockResolvedValue(mockMovies);

      const response = await request(app)
        .get('/quiz/generate')
        .query({ type: 'actor_in_movie' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('type', 'actor_in_movie');
      expect(response.body).toHaveProperty('question');
      expect(response.body.question).toContain('Test Movie');
      expect(response.body).toHaveProperty('answers');
      expect(response.body.answers).toEqual(['Actor 1', 'Actor 2', 'Actor 3']);
      expect(response.body).toHaveProperty('centerNode');
      expect(response.body.centerNode).toHaveProperty('id', 1);
      expect(response.body.centerNode).toHaveProperty('title', 'Test Movie');
      expect(response.body).toHaveProperty('relatedNodes');
      expect(response.body.relatedNodes).toHaveLength(3);
    });

    it('should generate a movie by actor quiz', async () => {
      const mockActors = [{
        id: 1,
        name: 'Test Actor',
        Movies: [
          { 
            id: 1, 
            title: 'Movie 1', 
            year: 2020,
            Genres: [{ id: 1, name: 'Action' }]
          },
          { 
            id: 2, 
            title: 'Movie 2', 
            year: 2021,
            Genres: [{ id: 2, name: 'Drama' }]
          },
          { 
            id: 3, 
            title: 'Movie 3', 
            year: 2022,
            Genres: [{ id: 3, name: 'Comedy' }]
          }
        ]
      }];

      Actor.findAll.mockResolvedValue(mockActors);

      const response = await request(app)
        .get('/quiz/generate')
        .query({ type: 'movie_by_actor' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('type', 'movie_by_actor');
      expect(response.body).toHaveProperty('question');
      expect(response.body.question).toContain('Test Actor');
      expect(response.body).toHaveProperty('answers');
      expect(response.body.answers).toEqual(['Movie 1', 'Movie 2', 'Movie 3']);
      expect(response.body).toHaveProperty('centerNode');
      expect(response.body.centerNode).toHaveProperty('id', 1);
      expect(response.body.centerNode).toHaveProperty('name', 'Test Actor');
      expect(response.body).toHaveProperty('relatedNodes');
      expect(response.body.relatedNodes).toHaveLength(3);
    });

    it('should generate a movies by year quiz', async () => {
      // Pour le premier appel findAll (pour trouver les années)
      const mockYears = [{ year: 2020, movieCount: 3 }];
      
      // Pour le deuxième appel findAll (pour trouver les films de cette année)
      const mockMoviesByYear = [
        { id: 1, title: 'Movie 1', year: 2020, Genres: [{ id: 1, name: 'Action' }] },
        { id: 2, title: 'Movie 2', year: 2020, Genres: [{ id: 2, name: 'Drama' }] },
        { id: 3, title: 'Movie 3', year: 2020, Genres: [{ id: 3, name: 'Comedy' }] }
      ];

      // Configuration des appels consécutifs
      Movie.findAll.mockResolvedValueOnce(mockYears);
      Movie.findAll.mockResolvedValueOnce(mockMoviesByYear);

      const response = await request(app)
        .get('/quiz/generate')
        .query({ type: 'movies_by_year' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('type', 'movies_by_year');
      expect(response.body).toHaveProperty('question');
      expect(response.body.question).toContain('2020');
      expect(response.body).toHaveProperty('answers');
      expect(response.body.answers).toEqual(['Movie 1', 'Movie 2', 'Movie 3']);
      expect(response.body).toHaveProperty('centerNode');
      expect(response.body.centerNode).toHaveProperty('name', 'Année 2020');
      expect(response.body).toHaveProperty('relatedNodes');
      expect(response.body.relatedNodes).toHaveLength(3);
    });

    it('should handle error when no movies have enough actors', async () => {
      // Simuler un film sans suffisamment d'acteurs
      const mockMoviesWithFewActors = [{
        id: 1,
        title: 'Test Movie',
        year: 2020,
        Actors: [{ id: 1, name: 'Actor 1' }], // un seul acteur
        Genres: [{ id: 1, name: 'Action' }]
      }];

      Movie.findAll.mockResolvedValue(mockMoviesWithFewActors);

      const response = await request(app)
        .get('/quiz/generate')
        .query({ type: 'actor_in_movie' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle error when no actors have enough movies', async () => {
      // Simuler un acteur sans suffisamment de films
      const mockActorsWithFewMovies = [{
        id: 1,
        name: 'Test Actor',
        Movies: [{ id: 1, title: 'Movie 1', year: 2020, Genres: [] }] // un seul film
      }];

      Actor.findAll.mockResolvedValue(mockActorsWithFewMovies);

      const response = await request(app)
        .get('/quiz/generate')
        .query({ type: 'movie_by_actor' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle error when no years have enough movies', async () => {
      // Simuler qu'aucune année n'a assez de films
      Movie.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/quiz/generate')
        .query({ type: 'movies_by_year' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle database errors', async () => {
      Movie.findAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/quiz/generate')
        .query({ type: 'actor_in_movie' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid quiz type', async () => {
      const response = await request(app)
        .get('/quiz/generate')
        .query({ type: 'invalid_type' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('supportedTypes');
    });

    it('should return 400 if type is missing', async () => {
      const response = await request(app)
        .get('/quiz/generate');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  // Tests pour la fonction utilitaire getRandomElement
  describe('getRandomElement function', () => {
    it('should select a random element from an array', () => {
      // On accède à la fonction privée via les exports pour le test
      const quizRoutesModule = require('../routes/quizRoutes');
      const mockArray = ['a', 'b', 'c'];
      
      // Mock de Math.random pour un résultat prévisible
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.5); // Sélectionne l'élément du milieu
      
      // Tester la fonction en l'exportant temporairement
      const result = quizRoutesModule.getRandomElement(mockArray);
      
      expect(result).toBe('b');
      
      // Restaurer Math.random
      Math.random = originalRandom;
    });
  });
});