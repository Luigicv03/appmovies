import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { moviesService } from '../services/api';

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [sortBy, setSortBy] = useState('rating');
  const [mediaType, setMediaType] = useState('movie');

  const genres = [
    'Acción',
    'Drama',
    'Ciencia Ficción',
    'Comedia',
    'Terror',
    'Romance',
    'Animación',
    'Aventura',
  ];

  const buildGenreParam = (genres = selectedGenres) => {
    if (!genres || genres.length === 0) return undefined;
    return genres.join(',');
  };

  const normalizationMap = (text) =>
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

  const getGenreSynonyms = (genre) => {
    const normalized = normalizationMap(genre);
    return genreSynonyms[normalized] || [normalized];
  };

  const filterBySelectedGenres = (movies, genresToUse) => {
    if (!genresToUse || genresToUse.length === 0 || movies.length === 0) return movies;

    const normalizedSelected = genresToUse.flatMap(getGenreSynonyms);
    return movies.filter((movie) => {
      if (!movie.genres || !Array.isArray(movie.genres)) return false;
      return movie.genres.some((genre) =>
        normalizedSelected.some((selected) => normalizationMap(String(genre)).includes(selected))
      );
    });
  };

  const filterBySearchQuery = (movies, query) => {
    if (!query.trim()) return movies;
    const normalizedQuery = normalizationMap(query.trim());
    return movies.filter((movie) =>
      normalizationMap(movie.title || '').includes(normalizedQuery)
    );
  };

  const typeSynonyms = {
    movie: ['movie', 'pelicula', 'film', 'films'],
    series: ['series', 'tv', 'show', 'tvshow', 'tv series', 'tv_series', 'tvshows'],
  };

  const filterByMediaType = (movies, type) => {
    if (!type || type === 'movie') return movies;
    const normalizedType = normalizationMap(type);
    const accepted = typeSynonyms[normalizedType] || [normalizedType];
    return movies.filter((movie) => {
      const movieTypeFields = [
        movie.media_type,
        movie.type,
        movie.format,
        movie.category,
      ]
        .filter(Boolean)
        .map((value) => normalizationMap(String(value)));

      return movieTypeFields.some((field) =>
        accepted.some((target) => field.includes(target))
      );
    });
  };

  const handleSearch = async (options = {}) => {
    const {
      query = searchQuery,
      genres = selectedGenres,
      sort = sortBy,
      type = mediaType,
    } = options;

    if (!query.trim() && (!genres || genres.length === 0)) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      let movies = [];
      const sortParam = sort === 'date' ? 'release_date' : 'rating';
      const genreParam = buildGenreParam(genres);

      if (query.trim()) {
        const searchParams = {
          sort: sortParam,
        };

        if (genreParam) {
          searchParams.genre = genreParam;
        }

        const response = await moviesService.searchMovies(
          query.trim(), 
          searchParams
        );

        movies = response.data || [];
      } else {
        const params = {
          sort: sortParam,
        };
        if (genreParam) {
          params.genre = genreParam;
        }
        const response = await moviesService.getMovies(params);
        movies = response.data || [];
      }

      movies = filterBySelectedGenres(movies, genres);
      movies = filterBySearchQuery(movies, query);
      movies = filterByMediaType(movies, type);

      if (sort === 'date' && movies.length > 0) {
        movies.sort((a, b) => {
          const dateA = a.release_date ? new Date(a.release_date) : new Date(0);
          const dateB = b.release_date ? new Date(b.release_date) : new Date(0);
          return dateB - dateA;
        });
      } else if (sort === 'rating' && movies.length > 0) {
        movies.sort((a, b) => {
          const ratingA = a.audience_rating || a.critic_rating || 0;
          const ratingB = b.audience_rating || b.critic_rating || 0;
          return ratingB - ratingA;
        });
      }
      
      setResults(movies);
    } catch (error) {
      console.error('Error buscando películas:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (genre) => {
    const newSelectedGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter((g) => g !== genre)
      : [...selectedGenres, genre];
    setSelectedGenres(newSelectedGenres);
    handleSearch({ genres: newSelectedGenres });
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSortBy('rating');
    setSearchQuery('');
    setResults([]);
  };

  const renderMovie = ({ item }) => (
    <TouchableOpacity
      style={styles.movieItem}
      onPress={() => navigation.navigate('MovieDetail', { movie: item })}
    >
      <Image 
        source={{ uri: item.poster_url || 'https://via.placeholder.com/300x450?text=No+Image' }} 
        style={styles.moviePoster} 
      />
      <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buscar</Text>
      </View>

      <View style={styles.searchBarContainer}>
                  <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (!text.trim()) {
                if (selectedGenres.length > 0) {
                  handleSearch({ query: '' });
                } else {
                  setResults([]);
                }
              }
            }}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleSearch} style={{ marginLeft: 8 }}>
              <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ordenar por</Text>
          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[
                styles.sortButton,
                sortBy === 'rating' && styles.sortButtonActive,
              ]}
              onPress={() => {
                setSortBy('rating');
                handleSearch({ sort: 'rating' });
              }}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === 'rating' && styles.sortButtonTextActive,
                ]}
              >
                Puntuación
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortButton,
                sortBy === 'date' && styles.sortButtonActive,
              ]}
              onPress={() => {
                setSortBy('date');
                handleSearch({ sort: 'date' });
              }}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === 'date' && styles.sortButtonTextActive,
                ]}
              >
                Fecha de Estreno
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Filtros</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearButton}>Limpiar filtros</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.typeFilter}>
            <View style={styles.typeButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  mediaType === 'movie' && styles.typeButtonActive,
                ]}
                onPress={() => {
                  const nextType = 'movie';
                  setMediaType(nextType);
                  handleSearch({ type: nextType });
                }}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    mediaType === 'movie' && styles.typeButtonTextActive,
                  ]}
                >
                  Películas
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  mediaType === 'series' && styles.typeButtonActive,
                ]}
                onPress={() => {
                  const nextType = 'series';
                  setMediaType(nextType);
                  handleSearch({ type: nextType });
                }}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    mediaType === 'series' && styles.typeButtonTextActive,
                  ]}
                >
                  Series
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.genreFilter}>
            <Text style={styles.genreTitle}>Género</Text>
            <View style={styles.genreButtons}>
              {genres.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.genreButton,
                    selectedGenres.includes(genre) && styles.genreButtonActive,
                  ]}
                  onPress={() => toggleGenre(genre)}
                >
                  <Text
                    style={[
                      styles.genreButtonText,
                      selectedGenres.includes(genre) &&
                        styles.genreButtonTextActive,
                    ]}
                  >
                    {genre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            <FlatList
              data={results}
              renderItem={renderMovie}
              keyExtractor={(item, index) => item.id || item.external_api_id?.toString() || index.toString()}
              numColumns={2}
              columnWrapperStyle={styles.row}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: Platform.OS === 'android' ? 48 : 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 9999,
    paddingHorizontal: 20,
    height: 56,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: Colors.text.primary,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    paddingHorizontal: 16,
  },
  sortButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: '#2A2A2A',
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  sortButtonTextActive: {
    color: Colors.text.primary,
  },
  typeFilter: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 9999,
    padding: 4,  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9999,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  typeButtonTextActive: {
    color: Colors.text.primary,
  },
  genreFilter: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  genreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  genreButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genreButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: '#2A2A2A',
    marginBottom: 8,
  },
  genreButtonActive: {
    backgroundColor: Colors.primary + '33',
    borderWidth: 1,
    borderColor: Colors.primary + '80',
  },
  genreButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  genreButtonTextActive: {
    color: Colors.primary,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  resultsContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  movieItem: {
    width: '48%',
    marginBottom: 16,
  },
  moviePoster: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  movieTitle: {
    color: Colors.text.primary,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
});

