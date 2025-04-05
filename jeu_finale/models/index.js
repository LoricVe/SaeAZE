const Movie = require('./Movie');
const Actor = require('./Actor');
const Genre = require('./Genre');

// 定义多对多关系
Movie.belongsToMany(Actor, {
    through: 'MoviesActors',
    foreignKey: 'id_movie',
    otherKey: 'id_actor'
});

Actor.belongsToMany(Movie, {
    through: 'MoviesActors',
    foreignKey: 'id_actor',
    otherKey: 'id_movie'
});

Movie.belongsToMany(Genre, {
    through: 'MoviesGenres',
    foreignKey: 'id_movie',
    otherKey: 'id_genre'
});

Genre.belongsToMany(Movie, {
    through: 'MoviesGenres',
    foreignKey: 'id_genre',
    otherKey: 'id_movie'
});

module.exports = {
    Movie,
    Actor,
    Genre
}; 