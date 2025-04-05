const request = require('supertest');
const express = require('express');
const movieRoutes = require('../routes/movieRoutes');
const { Movie, Actor, Genre } = require('../models');

// Create test application
const app = express();
app.use(express.json());
app.use('/movies', movieRoutes);

// Mock database models
jest.mock('../models', () => ({
    Movie: {
        findOne: jest.fn(),
        findByPk: jest.fn()
    },
    Actor: {
        findAll: jest.fn()
    },
    Genre: {
        findAll: jest.fn()
    }
}));

// Mock Wikipedia service
jest.mock('../services/wikipediaService', () => ({
    getMoviePoster: jest.fn(),
    getActorPhoto: jest.fn()
}));

describe('movie routes test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /movies/random', () => {
        it('should return a random movie', async () => {
            const mockMovie = {
                id: 1,
                title: 'test movie',
                year: 2020
            };

            Movie.findOne.mockResolvedValue(mockMovie);

            const response = await request(app)
                .get('/movies/random');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                type: 'movie',
                data: mockMovie
            });
        });

        it('if there is no movie, it should return 404', async () => {
            Movie.findOne.mockResolvedValue(null);

            const response = await request(app)
                .get('/movies/random');

            expect(response.status).toBe(404);
        });
    });

    describe('GET /movies/:id/details', () => {
        it('should return the movie details', async () => {
            const mockMovie = {
                id: 1,
                title: 'test movie',
                year: 2020,
                toJSON: () => ({
                    id: 1,
                    title: 'test movie',
                    year: 2020
                })
            };

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

            const mockGenres = [
                {
                    id: 1,
                    name: 'test genre',
                    toJSON: () => ({
                        id: 1,
                        name: 'test genre'
                    })
                }
            ];

            Movie.findByPk.mockResolvedValue({
                ...mockMovie,
                Actors: mockActors,
                Genres: mockGenres
            });

            const mockMovieData = {
                posterUrl: 'http://example.com/poster.jpg',
                extract: '电影描述'
            };

            const mockActorData = {
                photoUrl: 'http://example.com/photo.jpg',
                biography: '演员传记'
            };

            require('../services/wikipediaService').getMoviePoster.mockResolvedValue(mockMovieData);
            require('../services/wikipediaService').getActorPhoto.mockResolvedValue(mockActorData);

            const response = await request(app)
                .get('/movies/1/details');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('movie');
            expect(response.body).toHaveProperty('actors');
            expect(response.body).toHaveProperty('genres');
        });

        it('if the movie does not exist, it should return 404', async () => {
            Movie.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .get('/movies/999/details');

            expect(response.status).toBe(404);
        });
    });

    describe('POST /movies/verify', () => {
        it('should verify the correct answer', async () => {
            const mockMovie = {
                id: 1,
                title: 'test movie'
            };

            Movie.findByPk.mockResolvedValue(mockMovie);

            const response = await request(app)
                .post('/movies/verify')
                .send({
                    id: 1,
                    answer: 'test movie'
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                correct: true,
                correctAnswer: 'test movie'
            });
        });

        it('should verify the incorrect answer', async () => {
            const mockMovie = {
                id: 1,
                title: 'test movie'
            };

            Movie.findByPk.mockResolvedValue(mockMovie);

            const response = await request(app)
                .post('/movies/verify')
                .send({
                    id: 1,
                    answer: 'wrong answer'
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                correct: false,
                correctAnswer: 'test movie'
            });
        });

        it('if the parameters are missing, it should return 400', async () => {
            const response = await request(app)
                .post('/movies/verify')
                .send({});

            expect(response.status).toBe(400);
        });

        it('if the movie does not exist, it should return 404', async () => {
            Movie.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .post('/movies/verify')
                .send({
                    id: 999,
                    answer: 'test movie'
                });

            expect(response.status).toBe(404);
        });
    });
}); 