const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');
const { Movie, Actor } = require('../models');

// Get random movie or actor
router.get('/random', async (req, res) => {
    try {
        const randomType = Math.random() < 0.5 ? 'movie' : 'actor';
        let entity;

        if (randomType === 'movie') {
            entity = await Movie.findOne({
                order: sequelize.random(),
                attributes: ['id', 'title']
            });
        } else {
            entity = await Actor.findOne({
                order: sequelize.random(),
                attributes: ['id', 'name']
            });
        }

        if (!entity) {
            return res.status(404).json({ error: `${randomType} not found` });
        }

        res.json({
            type: randomType,
            data: {
                id: entity.id,
                title: entity.title || entity.name
            }
        });
    } catch (error) {
        console.error('Error getting random entity:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify answer
router.post('/verify', async (req, res) => {
    try {
        const { type, id, answer } = req.body;

        if (!type || !id || !answer) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        let entity;
        if (type === 'movie') {
            entity = await Movie.findByPk(id);
        } else if (type === 'actor') {
            entity = await Actor.findByPk(id);
        } else {
            return res.status(400).json({ error: 'Invalid type' });
        }

        if (!entity) {
            return res.status(404).json({ error: `${type} not found` });
        }

        const correctAnswer = type === 'movie' ? entity.title : entity.name;
        const isCorrect = answer.toLowerCase() === correctAnswer.toLowerCase();

        res.json({
            correct: isCorrect,
            correctAnswer: correctAnswer
        });
    } catch (error) {
        console.error('Error verifying answer:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 