const axios = require('axios');

const OMDB_BASE_URL = 'http://www.omdbapi.com/';
const OMDB_API_KEY = process.env.OMDB_API_KEY || process.env.TMDB_API_KEY; // Permite usar TMDB_API_KEY si OMDb no está configurada

// Debug: Verificar si la API key se está cargando correctamente
console.log('🔍 OMDB_API_KEY cargada:', OMDB_API_KEY ? '✅ SÍ (' + OMDB_API_KEY.substring(0, 4) + '...)' : '❌ NO');

class OMDBService {
  constructor() {
    this.api = axios.create({
      baseURL: OMDB_BASE_URL,
      params: {
        apikey: OMDB_API_KEY,
      },
    });
  }

  // Buscar película por ID (OMDb usa imdbID)
  async getMovieById(imdbId) {
    try {
      // Verificar si hay API key configurada
      if (!OMDB_API_KEY || OMDB_API_KEY.trim() === '') {
        console.warn('⚠️ OMDB_API_KEY no está configurada. Ve a http://www.omdbapi.com/apikey.aspx para obtener una API key gratuita (muy rápido).');
        return null;
      }

      // Si el ID no es un IMDB ID (formato tt1234567), intentar buscar primero
      let searchId = imdbId;
      if (!imdbId.startsWith('tt')) {
        // Si es un número, intentar buscar películas populares
        // OMDb no tiene endpoint de trending directo, así que usamos búsqueda
        return null;
      }

      const response = await this.api.get('/', {
        params: {
          i: searchId,
          plot: 'full',
        },
      });

      if (response.data.Response === 'False') {
        console.warn('OMDb: Película no encontrada:', response.data.Error);
        return null;
      }

      return this.formatMovieData(response.data);
    } catch (error) {
      console.error('Error fetching movie from OMDb:', error.message);
      return null;
    }
  }

  // Buscar películas por query
  async searchMovies(query, page = 1) {
    try {
      // Verificar si hay API key configurada
      if (!OMDB_API_KEY || OMDB_API_KEY.trim() === '') {
        console.warn('⚠️ OMDB_API_KEY no está configurada.');
        return [];
      }

      const response = await this.api.get('/', {
        params: {
          s: query,
          page: page,
          type: 'movie',
        },
      });

      if (response.data.Response === 'False') {
        return [];
      }

      // OMDb devuelve resultados básicos en la búsqueda, necesitamos obtener detalles
      const movies = response.data.Search || [];
      
      // Obtener detalles completos para cada película (limitamos a 10 para no exceder límites)
      const detailedMovies = await Promise.all(
        movies.slice(0, 10).map(async (movie) => {
          try {
            const detailResponse = await this.api.get('/', {
              params: {
                i: movie.imdbID,
                plot: 'full',
              },
            });
            return detailResponse.data.Response === 'True' 
              ? this.formatMovieData(detailResponse.data)
              : null;
          } catch (error) {
            console.error(`Error obteniendo detalles de ${movie.imdbID}:`, error.message);
            return null;
          }
        })
      );

      return detailedMovies.filter(movie => movie !== null);
    } catch (error) {
      console.error('Error searching movies from OMDb:', error.message);
      return [];
    }
  }

  // Obtener películas populares/trending
  // OMDb no tiene endpoint de trending, así que buscamos películas populares por título
  async getTrendingMovies() {
    try {
      // Verificar si hay API key configurada
      if (!OMDB_API_KEY || OMDB_API_KEY.trim() === '') {
        console.warn('⚠️ OMDB_API_KEY no está configurada. Ve a http://www.omdbapi.com/apikey.aspx para obtener una API key gratuita.');
        return [];
      }

      // OMDb no tiene endpoint de trending, así que buscamos películas populares
      // Usamos búsquedas de películas conocidas recientes
      const popularSearches = [
        'avengers', 'batman', 'spider', 'star wars', 'harry potter',
        'inception', 'interstellar', 'matrix', 'titanic', 'avatar',
        'joker', 'toy story', 'frozen', 'finding nemo', 'cars',
        'iron man', 'captain america', 'thor', 'black panther', 'wonder woman'
      ];

      // Buscar películas populares - ahora obtenemos múltiples resultados por búsqueda
      const allMovies = [];
      const seenIds = new Set(); // Para evitar duplicados más eficientemente
      
      for (const searchTerm of popularSearches.slice(0, 10)) {
        try {
          const response = await this.api.get('/', {
            params: {
              s: searchTerm,
              type: 'movie',
              page: 1,
            },
          });

          if (response.data.Response === 'True' && response.data.Search) {
            // Obtener detalles de las primeras 3 películas encontradas (no solo 1)
            const moviesToFetch = response.data.Search.slice(0, 3);
            
            for (const movie of moviesToFetch) {
              if (movie && movie.imdbID && !seenIds.has(movie.imdbID)) {
                seenIds.add(movie.imdbID);
                
                try {
                  const detailResponse = await this.api.get('/', {
                    params: {
                      i: movie.imdbID,
                      plot: 'full',
                    },
                  });

                  if (detailResponse.data.Response === 'True') {
                    const formattedMovie = this.formatMovieData(detailResponse.data);
                    
                    // Evitar duplicados por external_api_id también
                    if (!allMovies.find(m => m.external_api_id === formattedMovie.external_api_id)) {
                      allMovies.push(formattedMovie);
                    }
                    
                    // Si ya tenemos suficientes películas, salir del loop
                    if (allMovies.length >= 20) {
                      break;
                    }
                  }
                  
                  // Esperar un poco para no exceder límites de rate
                  await new Promise(resolve => setTimeout(resolve, 200));
                } catch (error) {
                  console.error(`Error obteniendo detalles de ${movie.imdbID}:`, error.message);
                }
              }
            }
            
            // Si ya tenemos suficientes películas, salir del loop principal
            if (allMovies.length >= 20) {
              break;
            }
          }
          
          // Esperar un poco entre búsquedas
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error buscando "${searchTerm}":`, error.message);
        }
      }

      return allMovies;
    } catch (error) {
      console.error('Error fetching trending movies from OMDb:', error.message);
      return [];
    }
  }

  // Formatear datos de película de OMDb a nuestro formato
  formatMovieData(omdbMovie) {
    // OMDb usa imdbID como identificador externo
    // Convertimos "tt1234567" a número para usar como external_api_id
    let external_api_id = null;
    
    if (omdbMovie.imdbID) {
      // Si tiene formato tt1234567, extraer el número
      if (omdbMovie.imdbID.startsWith('tt')) {
        const imdbIdNumeric = omdbMovie.imdbID.replace('tt', '');
        external_api_id = parseInt(imdbIdNumeric);
        
        // Si el parseInt falla o devuelve NaN, usar un hash del título como fallback
        if (isNaN(external_api_id) || external_api_id <= 0) {
          // Usar un hash simple del título + año para generar un ID único
          const titleYear = `${omdbMovie.Title || ''}${omdbMovie.Year || ''}`;
          external_api_id = this.hashString(titleYear);
        }
      } else {
        // Si no tiene formato tt, intentar parsear directamente
        const parsed = parseInt(omdbMovie.imdbID);
        external_api_id = isNaN(parsed) || parsed <= 0 
          ? this.hashString(`${omdbMovie.Title || ''}${omdbMovie.Year || ''}`)
          : parsed;
      }
    } else {
      // Si no tiene imdbID, generar un hash del título + año
      const titleYear = `${omdbMovie.Title || ''}${omdbMovie.Year || ''}`;
      external_api_id = this.hashString(titleYear);
    }

    return {
      external_api_id: external_api_id,
      title: omdbMovie.Title || '',
      synopsis: omdbMovie.Plot || null,
      release_date: omdbMovie.Released ? new Date(omdbMovie.Released) : null,
      poster_url: omdbMovie.Poster && omdbMovie.Poster !== 'N/A' ? omdbMovie.Poster : null,
      genres: omdbMovie.Genre ? omdbMovie.Genre.split(',').map(g => g.trim()) : [],
      actors: omdbMovie.Actors ? omdbMovie.Actors.split(',').map(a => a.trim()).slice(0, 5) : [], // Primeros 5 actores
    };
  }

  // Función helper para generar un hash simple de un string a número
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Asegurarse de que sea positivo y tenga al menos 6 dígitos
    return Math.abs(hash) || 1000000;
  }
}

module.exports = new OMDBService();
