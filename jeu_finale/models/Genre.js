const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Genre = sequelize.define('Genre', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    genre: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'genres',
    timestamps: false
});

module.exports = Genre; 