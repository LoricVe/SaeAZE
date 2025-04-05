const axios = require('axios');
const { getMoviePoster, getActorPhoto } = require('../services/wikipediaService');

// Mock axios pour éviter les appels API réels pendant les tests
jest.mock('axios');

describe('Wikipedia Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMoviePoster', () => {
    it('devrait récupérer le poster et l\'extrait d\'un film', async () => {
      // Mock de la réponse de Wikipedia API
      axios.get.mockResolvedValue({
        data: {
          query: {
            pages: {
              123: {
                original: { source: 'https://example.com/movie.jpg' },
                extract: 'Résumé du film'
              }
            }
          }
        }
      });

      const result = await getMoviePoster('The Matrix');

      expect(axios.get).toHaveBeenCalledWith('https://en.wikipedia.org/w/api.php', {
        params: expect.objectContaining({
          titles: 'The Matrix'
        })
      });
      expect(result).toEqual({
        posterUrl: 'https://example.com/movie.jpg',
        extract: 'Résumé du film'
      });
    });

    it('devrait gérer le cas où l\'image est absente', async () => {
      axios.get.mockResolvedValue({
        data: {
          query: {
            pages: {
              123: {
                extract: 'Résumé du film sans image'
              }
            }
          }
        }
      });

      const result = await getMoviePoster('Unknown Movie');

      expect(result).toEqual({
        posterUrl: null,
        extract: 'Résumé du film sans image'
      });
    });

    it('devrait gérer le cas où l\'extrait est absent', async () => {
      axios.get.mockResolvedValue({
        data: {
          query: {
            pages: {
              123: {
                original: { source: 'https://example.com/movie.jpg' }
              }
            }
          }
        }
      });

      const result = await getMoviePoster('Movie Without Extract');

      expect(result).toEqual({
        posterUrl: 'https://example.com/movie.jpg',
        extract: null
      });
    });

    it('devrait gérer le cas où la page n\'existe pas', async () => {
      axios.get.mockResolvedValue({
        data: {
          query: {
            pages: {}
          }
        }
      });

      const result = await getMoviePoster('Non-existent Movie');

      expect(result).toEqual({
        posterUrl: null,
        extract: null
      });
    });

    it('devrait gérer les erreurs d\'API', async () => {
      axios.get.mockRejectedValue(new Error('API Error'));

      const result = await getMoviePoster('Error Movie');

      expect(result).toEqual({
        posterUrl: null,
        extract: null
      });
    });
  });

  describe('getActorPhoto', () => {
    it('devrait récupérer la photo et la biographie d\'un acteur', async () => {
      axios.get.mockResolvedValue({
        data: {
          query: {
            pages: {
              456: {
                original: { source: 'https://example.com/actor.jpg' },
                extract: 'Biographie de l\'acteur'
              }
            }
          }
        }
      });

      const result = await getActorPhoto('Tom Hanks');

      expect(axios.get).toHaveBeenCalledWith('https://en.wikipedia.org/w/api.php', {
        params: expect.objectContaining({
          titles: 'Tom Hanks'
        })
      });
      expect(result).toEqual({
        photoUrl: 'https://example.com/actor.jpg',
        biography: 'Biographie de l\'acteur'
      });
    });

    it('devrait gérer le cas où la photo est absente', async () => {
      axios.get.mockResolvedValue({
        data: {
          query: {
            pages: {
              456: {
                extract: 'Biographie sans photo'
              }
            }
          }
        }
      });

      const result = await getActorPhoto('Unknown Actor');

      expect(result).toEqual({
        photoUrl: null,
        biography: 'Biographie sans photo'
      });
    });

    it('devrait gérer le cas où la biographie est absente', async () => {
      axios.get.mockResolvedValue({
        data: {
          query: {
            pages: {
              456: {
                original: { source: 'https://example.com/actor.jpg' }
              }
            }
          }
        }
      });

      const result = await getActorPhoto('Actor Without Bio');

      expect(result).toEqual({
        photoUrl: 'https://example.com/actor.jpg',
        biography: null
      });
    });

    it('devrait gérer les erreurs d\'API', async () => {
      axios.get.mockRejectedValue(new Error('API Error'));

      const result = await getActorPhoto('Error Actor');

      expect(result).toEqual({
        photoUrl: null,
        biography: null
      });
    });
  });
});