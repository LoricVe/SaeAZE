const request = require('supertest');
const express = require('express');
const searchRoutes = require('../routes/searchRoutes');
const { Movie, Actor, Genre } = require('../models');

// create test application
const app = express();
app.use(express.json());
app.use('/search', searchRoutes);

// mock database models
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

// mock Wikipedia service
jest.mock('../services/wikipediaService', () => ({
    getMoviePoster: jest.fn(),
    getActorPhoto: jest.fn()
}));

describe('search routes test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /search', () => {
        it('should search movie', async () => {
            const mockMovies = [
                {
                    id: 1,
                    title: 'test movie',
                    year: 2020,
                    toJSON: () => ({
                        id: 1,
                        title: 'test movie',
                        year: 2020
                    })
                }
            ];

            Movie.findAll.mockResolvedValue(mockMovies);

            const mockMovieData = {
                posterUrl: 'http://example.com/poster.jpg',
                extract: 'movie description'
            };

            require('../services/wikipediaService').getMoviePoster.mockResolvedValue(mockMovieData);

            const response = await request(app)
                .get('/search')
                .query({
                    query: 'test',
                    type: 'movie'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('type', 'movie');
            expect(response.body).toHaveProperty('results');
            expect(Array.isArray(response.body.results)).toBe(true);
        });

        it('should search actor', async () => {
            const mockActors = [
                {
                    id: 1,
                    name: 'test actor',
                    toJSON: () => ({
                        id: 1,
                        name: 'test actor'
                    })
                }
            ];

            Actor.findAll.mockResolvedValue(mockActors);

            const mockActorData = {
                photoUrl: 'http://example.com/photo.jpg',
                biography: 'actor biography'
            };

            require('../services/wikipediaService').getActorPhoto.mockResolvedValue(mockActorData);

            const response = await request(app)
                .get('/search')
                .query({
                    query: 'test',
                    type: 'actor'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('type', 'actor');
            expect(response.body).toHaveProperty('results');
            expect(Array.isArray(response.body.results)).toBe(true);
        });

        it('if the query parameters are missing, it should return 400', async () => {
            const response = await request(app)
                .get('/search');

            expect(response.status).toBe(400);
        });

            it('if the type is invalid, it should return 400', async () => {
            const response = await request(app)
                .get('/search')
                .query({
                    query: 'test',
                    type: 'invalid_type'
                });

            expect(response.status).toBe(400);
        });
    });
}); 