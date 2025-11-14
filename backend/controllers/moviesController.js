const { PrismaClient } = require('@prisma/client');
const tmdbService = require('../services/tmdbService');
const omdbService = require('../services/omdbService');

const prisma = new PrismaClient();

const getExternalMovies = async () => {
  let movies = await omdbService.getTrendingMovies();
  
  if (!movies || movies.length === 0) {
    movies = await tmdbService.getTrendingMovies();
  }
  
  return movies || [];
};

const getMovies = async (req, res, next) => {
  try {
    const { search, genre, sort } = req.query;

    let where = {};
    
    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    let orderBy = {};
    if (sort === 'date' || sort === 'release_date') {
      orderBy = { release_date: 'desc' };
    } else {
      orderBy = { created_at: 'desc' };
    }

    let movies = await prisma.movie.findMany({
      where,
      orderBy,
      take: 100, // Límite temporal más alto para luego ordenar por ratings
    });

    if (movies.length < 20 && !search && !genre) {
      try {
        const externalMovies = await getExternalMovies();
        
        if (externalMovies && externalMovies.length > 0) {
          for (const externalMovie of externalMovies) {
            try {
              if (externalMovie.external_api_id) {
                await prisma.movie.upsert({
                  where: { external_api_id: externalMovie.external_api_id },
                  update: {
                    title: externalMovie.title,
                    synopsis: externalMovie.synopsis,
                    poster_url: externalMovie.poster_url,
                    genres: externalMovie.genres,
                    actors: externalMovie.actors,
                    release_date: externalMovie.release_date,
                  },
                  create: externalMovie,
                });
              }
            } catch (error) {
              if (error.code !== 'P2002') {
                console.error(`Error guardando película:`, error.message);
              }
            }
          }
          
          movies = await prisma.movie.findMany({
            where,
            orderBy,
            take: 100,
          });
        }
      } catch (error) {
        console.error('Error obteniendo películas de APIs externas:', error);
      }
    }

    let moviesWithRatings = await Promise.all(
      movies.map(async (movie) => {
        const ratings = await calculateMovieRatings(movie.id);
        return { ...movie, ...ratings };
      })
    );

    if (genre) {
      const requestedGenres = Array.isArray(genre)
        ? genre
        : genre.split(',').map((g) => g.trim()).filter(Boolean);

      if (requestedGenres.length > 0) {
        const normalizeText = (text) =>
          text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        const genreSynonyms = {
          accion: ['accion', 'action', 'accion y aventura', 'action & adventure', 'adventure'],
          drama: ['drama'],
          'ciencia ficcion': ['ciencia ficcion', 'ciencia-ficcion', 'scifi', 'science fiction', 'sci-fi'],
          comedia: ['comedia', 'comedy'],
          terror: ['terror', 'horror'],
          romance: ['romance', 'romantic'],
          animacion: ['animacion', 'animation', 'animated'],
          aventura: ['aventura', 'adventure'],
        };

        const getGenreSynonyms = (value) => {
          const normalized = normalizeText(value);
          return genreSynonyms[normalized] || [normalized];
        };

        const normalizedRequested = requestedGenres.flatMap(getGenreSynonyms);

        moviesWithRatings = moviesWithRatings.filter((movie) => {
          if (!movie.genres || !Array.isArray(movie.genres)) return false;

          return movie.genres.some((genreItem) =>
            normalizedRequested.some((requested) =>
              normalizeText(String(genreItem)).includes(requested)
            )
          );
        });
      }
    }

    if (sort === 'critic_rating') {
      moviesWithRatings.sort((a, b) => (b.critic_rating || 0) - (a.critic_rating || 0));
    } else if (sort === 'audience_rating') {
      moviesWithRatings.sort((a, b) => (b.audience_rating || 0) - (a.audience_rating || 0));
    } else if (sort === 'rating') {
      moviesWithRatings.sort((a, b) => (b.critic_rating || 0) - (a.critic_rating || 0));
    }

    moviesWithRatings = moviesWithRatings.slice(0, 50);

    res.json({
      success: true,
      data: moviesWithRatings,
    });
  } catch (error) {
    next(error);
  }
};

const getTrending = async (req, res, next) => {
  try {
    let localMovies = await prisma.movie.findMany({
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    if (localMovies.length < 10) {
      try {
        const externalMovies = await getExternalMovies();
        
        if (externalMovies && externalMovies.length > 0) {
          const savedMovies = [];
          
          for (const externalMovie of externalMovies) {
            try {
              const savedMovie = await prisma.movie.upsert({
                where: { external_api_id: externalMovie.external_api_id },
                update: {
                  title: externalMovie.title,
                  synopsis: externalMovie.synopsis,
                  poster_url: externalMovie.poster_url,
                  genres: externalMovie.genres,
                  actors: externalMovie.actors,
                  release_date: externalMovie.release_date,
                },
                create: externalMovie,
              });
              
              savedMovies.push(savedMovie);
            } catch (error) {
              if (error.code === 'P2002' || !externalMovie.external_api_id) {
                try {
                  const existingMovie = await prisma.movie.findFirst({
                    where: { title: externalMovie.title },
                  });
                  
                  if (existingMovie) {
                    savedMovies.push(existingMovie);
                  }
                } catch (searchError) {
                  console.error(`Error buscando película "${externalMovie.title}":`, searchError.message);
                }
              } else {
                console.error(`Error guardando película con external_api_id ${externalMovie.external_api_id}:`, error.message);
              }
            }
          }
          
          if (savedMovies.length > 0) {
            localMovies = await prisma.movie.findMany({
              orderBy: { created_at: 'desc' },
              take: 20,
            });
          }
        }
      } catch (error) {
        console.error('Error obteniendo películas de APIs externas:', error);
      }
    }

    const moviesWithRatings = await Promise.all(
      localMovies.map(async (movie) => {
        const ratings = await calculateMovieRatings(movie.id);
        return { ...movie, ...ratings };
      })
    );

    res.json({
      success: true,
      data: moviesWithRatings,
    });
  } catch (error) {
    next(error);
  }
};

const getMovieById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let movie = await prisma.movie.findUnique({
      where: { id },
    });

    if (!movie && !isNaN(id)) {
      try {
        movie = await prisma.movie.findUnique({
          where: { external_api_id: parseInt(id) },
        });
      } catch (error) {
        console.log('No se encontró película por external_api_id:', id);
      }
    }

    if (!movie) {
      let externalMovie = null;
      
      if (typeof id === 'string' && id.startsWith('tt')) {
        externalMovie = await omdbService.getMovieById(id);
      } else if (!isNaN(id)) {
        const imdbId = `tt${id}`;
        externalMovie = await omdbService.getMovieById(imdbId);
        
        if (!externalMovie) {
          externalMovie = await tmdbService.getMovieById(parseInt(id));
        }
      }
      
      if (externalMovie) {
        try {
          movie = await prisma.movie.upsert({
            where: { external_api_id: externalMovie.external_api_id },
            update: {
              title: externalMovie.title,
              synopsis: externalMovie.synopsis,
              poster_url: externalMovie.poster_url,
              genres: externalMovie.genres,
              actors: externalMovie.actors,
              release_date: externalMovie.release_date,
            },
            create: externalMovie,
          });
        } catch (error) {
          if (error.code === 'P2002') {
            movie = await prisma.movie.findUnique({
              where: { external_api_id: externalMovie.external_api_id },
            });
          }
          if (!movie) {
            movie = await prisma.movie.findFirst({
              where: { title: externalMovie.title },
            });
          }
          if (!movie) {
            throw error;
          }
        }
      }
    }

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Película no encontrada',
      });
    }

    const ratings = await calculateMovieRatings(movie.id);
    
    res.json({
      success: true,
      data: { ...movie, ...ratings },
    });
  } catch (error) {
    next(error);
  }
};

const calculateMovieRatings = async (movieId) => {
  const reviews = await prisma.review.findMany({
    where: { movie_id: movieId },
    include: {
      user: {
        select: {
          role: true,
        },
      },
    },
  });

  const criticReviews = reviews.filter(r => r.user.role === 'CRITIC');
  const audienceReviews = reviews.filter(r => r.user.role === 'USER');

  const criticRating = criticReviews.length > 0
    ? Math.round(criticReviews.reduce((sum, r) => sum + r.score, 0) / criticReviews.length * 10)
    : 0;

  const audienceRating = audienceReviews.length > 0
    ? Math.round(audienceReviews.reduce((sum, r) => sum + r.score, 0) / audienceReviews.length * 10)
    : 0;

  return {
    critic_rating: criticRating,
    audience_rating: audienceRating,
    critic_reviews_count: criticReviews.length,
    audience_reviews_count: audienceReviews.length,
  };
};

module.exports = { getMovies, getTrending, getMovieById };

