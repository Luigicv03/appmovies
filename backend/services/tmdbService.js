const axios = require('axios');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

class TMDBService {
  constructor() {
    this.api = axios.create({
      baseURL: TMDB_BASE_URL,
      params: {
        api_key: TMDB_API_KEY,
      },
    });
  }

  // Buscar película por ID
  async getMovieById(movieId) {
    try {
      // Verificar si hay API key configurada
      if (!TMDB_API_KEY || TMDB_API_KEY.trim() === '') {
        console.warn('⚠️ TMDB_API_KEY no está configurada.');
        return null;
      }

      const response = await this.api.get(`/movie/${movieId}`);
      return this.formatMovieData(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn('⚠️ TMDB API Key inválida o no configurada.');
        return null;
      }
      console.error('Error fetching movie from TMDB:', error.message);
      return null; // Devolver null en lugar de lanzar error
    }
  }

  // Buscar películas por query
  async searchMovies(query, page = 1) {
    try {
      // Verificar si hay API key configurada
      if (!TMDB_API_KEY || TMDB_API_KEY.trim() === '') {
        console.warn('⚠️ TMDB_API_KEY no está configurada.');
        return [];
      }

      const response = await this.api.get('/search/movie', {
        params: {
          query,
          page,
        },
      });
      return response.data.results.map(movie => this.formatMovieData(movie));
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn('⚠️ TMDB API Key inválida o no configurada.');
        return [];
      }
      console.error('Error searching movies from TMDB:', error.message);
      return []; // Devolver array vacío en lugar de lanzar error
    }
  }

  // Obtener películas trending
  async getTrendingMovies() {
    try {
      // Verificar si hay API key configurada
      if (!TMDB_API_KEY || TMDB_API_KEY.trim() === '') {
        console.warn('⚠️ TMDB_API_KEY no está configurada. Ve a https://www.themoviedb.org/settings/api para obtener una API key gratuita.');
        return [];
      }

      const response = await this.api.get('/trending/movie/day');
      return response.data.results.map(movie => this.formatMovieData(movie));
    } catch (error) {
      // Si es un error 401 (no autorizado), es porque la API key no está configurada o es inválida
      if (error.response?.status === 401) {
        console.warn('⚠️ TMDB API Key inválida o no configurada. Ve a https://www.themoviedb.org/settings/api para obtener una API key gratuita.');
        return [];
      }
      console.error('Error fetching trending movies from TMDB:', error.message);
      return []; // Devolver array vacío en lugar de lanzar error
    }
  }

  // Formatear datos de película
  formatMovieData(tmdbMovie) {
    return {
      external_api_id: tmdbMovie.id,
      title: tmdbMovie.title,
      synopsis: tmdbMovie.overview || null,
      release_date: tmdbMovie.release_date ? new Date(tmdbMovie.release_date) : null,
      poster_url: tmdbMovie.poster_path
        ? `${TMDB_IMAGE_BASE_URL}${tmdbMovie.poster_path}`
        : null,
      genres: tmdbMovie.genre_ids || [], // TMDB devuelve IDs, los convertiremos a nombres si es necesario
      actors: [], // Se necesitaría una llamada adicional para obtener el elenco
    };
  }
}

module.exports = new TMDBService();

