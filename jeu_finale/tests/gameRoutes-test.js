const request = require('supertest');
const app = require('./testServer');
const { Movie, Actor } = require('../models');
const sequelize = require('../config/database');

describe('Game Routes', () => {
    beforeAll(async () => {
        try {
            // Vérifier la connexion à la base de données
            await sequelize.authenticate();
            // Synchroniser les modèles de la base de données
            await sequelize.sync({ force: false });
        } catch (error) {
            console.error('Erreur de connexion à la base de données:', error);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            // Fermer la connexion à la base de données
            await sequelize.close();
        } catch (error) {
            console.error('Erreur lors de la fermeture de la connexion:', error);
        }
    });

    describe('GET /api/game/random', () => {
        it('devrait retourner un film ou un acteur aléatoire', async () => {
            // Créer des données de test
            const movie = await Movie.create({
                title: 'Test Movie',
                year: 2020,
                imageUrl: 'test.jpg',
                extract: 'Test description'
            });

            const actor = await Actor.create({
                name: 'Test Actor',
                photoUrl: 'test.jpg',
                biography: 'Test biography'
            });

            const response = await request(app)
                .get('/api/game/random')
                .expect(200);

            expect(response.body).toHaveProperty('type');
            expect(['movie', 'actor']).toContain(response.body.type);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('id');
        });

        it('devrait gérer les erreurs de base de données', async () => {
            // Simuler une erreur de base de données
            jest.spyOn(Movie, 'findOne').mockRejectedValueOnce(new Error('Erreur de base de données'));

            const response = await request(app)
                .get('/api/game/random')
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /api/game/verify', () => {
        it('devrait vérifier une réponse correcte pour un film', async () => {
            const movie = await Movie.create({
                title: 'Test Movie',
                year: 2020,
                imageUrl: 'test.jpg',
                extract: 'Test description'
            });

            const response = await request(app)
                .post('/api/game/verify')
                .send({
                    type: 'movie',
                    id: movie.id,
                    answer: 'Test Movie'
                })
                .expect(200);

            expect(response.body).toHaveProperty('correct', true);
            expect(response.body).toHaveProperty('correctAnswer', 'Test Movie');
        });

        it('devrait vérifier une réponse correcte pour un acteur', async () => {
            const actor = await Actor.create({
                name: 'Test Actor',
                photoUrl: 'test.jpg',
                biography: 'Test biography'
            });

            const response = await request(app)
                .post('/api/game/verify')
                .send({
                    type: 'actor',
                    id: actor.id,
                    answer: 'Test Actor'
                })
                .expect(200);

            expect(response.body).toHaveProperty('correct', true);
            expect(response.body).toHaveProperty('correctAnswer', 'Test Actor');
        });

        it('devrait gérer les réponses incorrectes', async () => {
            const movie = await Movie.create({
                title: 'Test Movie',
                year: 2020,
                imageUrl: 'test.jpg',
                extract: 'Test description'
            });

            const response = await request(app)
                .post('/api/game/verify')
                .send({
                    type: 'movie',
                    id: movie.id,
                    answer: 'Wrong Answer'
                })
                .expect(200);

            expect(response.body).toHaveProperty('correct', false);
            expect(response.body).toHaveProperty('correctAnswer', 'Test Movie');
        });

        it('devrait gérer les paramètres manquants', async () => {
            const response = await request(app)
                .post('/api/game/verify')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('devrait gérer les entités inexistantes', async () => {
            const response = await request(app)
                .post('/api/game/verify')
                .send({
                    type: 'movie',
                    id: 99999,
                    answer: 'Test'
                })
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });
}); 