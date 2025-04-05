const request = require('supertest');
const express = require('express');
const actorRoutes = require('../routes/actorRoutes');
const { Movie, Actor, Genre } = require('../models');

// Create test application
const app = express();
app.use(express.json());
app.use('/actors', actorRoutes);

// Mock database models
jest.mock('../models', () => ({
    Actor: {
        findOne: jest.fn(),
        findByPk: jest.fn()
    },
    Movie: {
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

describe('actor routes test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /actors/random', () => {
        it('should return a random actor', async () => {
            const mockActor = {
                id: 1,
                name: 'test actor'
            };

            Actor.findOne.mockResolvedValue(mockActor);

            const response = await request(app)
                .get('/actors/random');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                type: 'actor',
                data: mockActor
            });
        });

        it('if there is no actor, it should return 404', async () => {
            Actor.findOne.mockResolvedValue(null);

            const response = await request(app)
                .get('/actors/random');

            expect(response.status).toBe(404);
        });
    });

    describe('GET /actors/:id/details', () => {
        it('should return the actor details', async () => {
            const mockActor = {
                id: 1,
                name: 'test actor',
                toJSON: () => ({
                    id: 1,
                    name: 'test actor'
                })
            };

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

            Actor.findByPk.mockResolvedValue({
                ...mockActor,
                Movies: mockMovies
            });

            const mockActorData = {
                photoUrl: 'http://example.com/photo.jpg',
                biography: 'actor biography'
            };

            const mockMovieData = {
                posterUrl: 'http://example.com/poster.jpg',
                extract: 'movie description'
            };

            require('../services/wikipediaService').getActorPhoto.mockResolvedValue(mockActorData);
            require('../services/wikipediaService').getMoviePoster.mockResolvedValue(mockMovieData);

            const response = await request(app)
                .get('/actors/1/details');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('actor');
            expect(response.body).toHaveProperty('movies');
        });

        it('if the actor does not exist, it should return 404', async () => {
            Actor.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .get('/actors/999/details');

            expect(response.status).toBe(404);
        });
    });

    describe('POST /actors/verify', () => {
        it('should verify the correct answer', async () => {
            const mockActor = {
                id: 1,
                name: 'test actor'
            };

            Actor.findByPk.mockResolvedValue(mockActor);

            const response = await request(app)
                .post('/actors/verify')
                .send({
                    id: 1,
                    answer: 'test actor'
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                correct: true,
                correctAnswer: 'test actor'
            });
        });

        it('should verify the incorrect answer', async () => {
            const mockActor = {
                id: 1,
                name: 'test actor'
            };

            Actor.findByPk.mockResolvedValue(mockActor);

            const response = await request(app)
                .post('/actors/verify')
                .send({
                    id: 1,
                    answer: 'wrong answer'
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                correct: false,
                correctAnswer: 'test actor'
            });
        });

        it('if the parameters are missing, it should return 400', async () => {
            const response = await request(app)
                .post('/actors/verify')
                .send({});

            expect(response.status).toBe(400);
        });

        it('if the actor does not exist, it should return 404', async () => {
            Actor.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .post('/actors/verify')
                .send({
                    id: 999,
                    answer: 'test actor'
                });

            expect(response.status).toBe(404);
        });
    });
}); 