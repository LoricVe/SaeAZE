const axios = require('axios');

async function getWikipediaImage(query, type) {
    try {
        const response = await axios.get('https://en.wikipedia.org/w/api.php', {
            params: {
                action: 'query',
                format: 'json',
                prop: 'pageimages|extracts',
                titles: query,
                piprop: 'original',
                exintro: true,
                explaintext: true,
                origin: '*'
            }
        });

        const pages = response.data.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];

        if (!page) {
            console.log('Page non trouvée:', query);
            return {
                posterUrl: null,
                extract: null
            };
        }

        const imageUrl = page.original?.source || null;
        const extract = page.extract || null;

        console.log(`Informations ${type} récupérées:`, {
            query,
            imageUrl,
            hasExtract: !!extract
        });

        if (type === 'film') {
            return {
                posterUrl: imageUrl,
                extract: extract
            };
        } else {
            return {
                photoUrl: imageUrl,
                biography: extract
            };
        }
    } catch (error) {
        console.error(`Erreur lors de la récupération des informations ${type}:`, error);
        if (type === 'film') {
            return {
                posterUrl: null,
                extract: null
            };
        } else {
            return {
                photoUrl: null,
                biography: null
            };
        }
    }
}

async function getMoviePoster(title) {
    return getWikipediaImage(title, 'film');
}

async function getActorPhoto(name) {
    return getWikipediaImage(name, 'acteur');
}

module.exports = {
    getMoviePoster,
    getActorPhoto
};