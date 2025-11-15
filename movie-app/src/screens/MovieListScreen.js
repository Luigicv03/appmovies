import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../constants/colors';
import { moviesService } from '../services/api';

const MAX_ITEMS = 100;

const MovieListScreen = ({ route, navigation }) => {
  const { type, title } = route.params || {};
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMovies = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      let response;

      switch (type) {
        case 'critics':
          response = await moviesService.getMovies({ sort: 'critic_rating', limit: MAX_ITEMS });
          break;
        case 'audience':
          response = await moviesService.getMovies({ sort: 'audience_rating', limit: MAX_ITEMS });
          break;
        case 'new':
          response = await moviesService.getMovies({ sort: 'date', limit: MAX_ITEMS });
          break;
        case 'trending':
        default:
          response = await moviesService.getTrending();
          break;
      }

      const data = Array.isArray(response)
        ? response
        : response?.data || response?.movies || [];

      setMovies(data);
    } catch (error) {
      setMovies([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMovies(false);
  }, [type]);

  useFocusEffect(
    useCallback(() => {
      fetchMovies(false);
    }, [type])
  );

  const onRefresh = () => fetchMovies(true);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.movieCard}
      onPress={() => navigation.navigate('MovieDetail', { movie: item })}
    >
      <Image
        source={{ uri: item.poster_url || 'https://via.placeholder.com/300x450?text=No+Image' }}
        style={styles.poster}
      />
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.critic_rating || item.audience_rating ? (
          <Text style={styles.movieMeta}>
            {item.critic_rating ? `Críticos: ${item.critic_rating}%  ` : ''}
            {item.audience_rating ? `Audiencia: ${item.audience_rating}%` : ''}
          </Text>
        ) : null}
        {item.release_date ? (
          <Text style={styles.movieMeta}>
            Estreno: {new Date(item.release_date).toLocaleDateString()}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>{title}</Text>
      <FlatList
        data={movies}
        keyExtractor={(item, index) => item.id || item.external_api_id?.toString() || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={movies.length === 0 ? styles.emptyContainer : styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No hay películas para mostrar.</Text>
            <Text style={styles.emptySubtitle}>Intenta actualizar o vuelve más tarde.</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.dark,
  },
  listContent: {
    paddingBottom: 24,
  },
  movieCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  poster: {
    width: 90,
    height: 135,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    marginRight: 12,
  },
  movieInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  movieMeta: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default MovieListScreen;
