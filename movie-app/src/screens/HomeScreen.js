import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { moviesService } from '../services/api';
import { Movie } from '../types';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [trending, setTrending] = useState([]);
  const [topCritics, setTopCritics] = useState([]);
  const [topAudience, setTopAudience] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      setLoading(true);
      
      const trendingResponse = await moviesService.getTrending();
      console.log('Trending response:', trendingResponse);
      const trendingMovies = Array.isArray(trendingResponse) 
        ? trendingResponse 
        : (trendingResponse?.data || trendingResponse?.movies || []);
      setTrending(trendingMovies);

      const criticsResponse = await moviesService.getMovies({ 
        sort: 'critic_rating', 
        limit: 20 
      });
      console.log('Critics response:', criticsResponse);
      const criticsMovies = Array.isArray(criticsResponse) 
        ? criticsResponse 
        : (criticsResponse?.data || criticsResponse?.movies || []);
      setTopCritics(criticsMovies);

      const audienceResponse = await moviesService.getMovies({ 
        sort: 'audience_rating', 
        limit: 20 
      });
      console.log('Audience response:', audienceResponse);
      const audienceMovies = Array.isArray(audienceResponse) 
        ? audienceResponse 
        : (audienceResponse?.data || audienceResponse?.movies || []);
      setTopAudience(audienceMovies);

      const newReleasesResponse = await moviesService.getMovies({ 
        sort: 'date', 
        limit: 20 
      });
      console.log('New releases response:', newReleasesResponse);
      const newReleasesMovies = Array.isArray(newReleasesResponse) 
        ? newReleasesResponse 
        : (newReleasesResponse?.data || newReleasesResponse?.movies || []);
      setNewReleases(newReleasesMovies);
    } catch (error) {
      console.error('Error cargando películas:', error);
      console.error('Error details:', error.response?.data || error.message);
      setTrending([]);
      setTopCritics([]);
      setTopAudience([]);
      setNewReleases([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="film" size={32} color={Colors.primary} />
          <Text style={styles.headerTitle}>CineURU</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.heroCarousel}
        >
          {trending.map((movie, index) => (
            <TouchableOpacity
              key={index}
              style={styles.heroCard}
              onPress={() => navigation.navigate('MovieDetail', { movie })}
            >
              <Image source={{ uri: movie.poster_url }} style={styles.heroImage} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.heroGradient}
              >
                <View style={styles.heroContent}>
                  <Text style={styles.heroCategory}>En Tendencia</Text>
                  <Text style={[styles.heroTitle, { marginTop: 4 }]}>{movie.title}</Text>
                  <TouchableOpacity
                    style={[styles.heroButton, { marginTop: 8 }]}
                    onPress={() => navigation.navigate('MovieDetail', { movie })}
                  >
                    <Text style={styles.heroButtonText}>Ver Más</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <MovieSection
          title="Mejor Puntuadas (Críticos)"
          movies={topCritics}
          navigation={navigation}
          showRating
          ratingType="critic"
          onPressViewAll={() =>
            navigation.navigate('MovieList', {
              type: 'critics',
              title: 'Mejor Puntuadas (Críticos)',
            })
          }
        />

        <MovieSection
          title="Mejor Puntuadas (Audiencia)"
          movies={topAudience}
          navigation={navigation}
          showRating
          ratingType="audience"
          onPressViewAll={() =>
            navigation.navigate('MovieList', {
              type: 'audience',
              title: 'Mejor Puntuadas (Audiencia)',
            })
          }
        />

        <MovieSection
          title="Nuevos Estrenos"
          movies={newReleases}
          navigation={navigation}
          onPressViewAll={() =>
            navigation.navigate('MovieList', {
              type: 'new',
              title: 'Nuevos Estrenos',
            })
          }
        />
      </ScrollView>
    </View>
  );
}

const MovieSection = ({ title, movies, navigation, showRating, ratingType, onPressViewAll }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onPressViewAll}>
        <Text style={styles.sectionLink}>Ver Todo</Text>
      </TouchableOpacity>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {movies.map((movie, index) => (
        <TouchableOpacity
          key={index}
          style={styles.movieCard}
          onPress={() => navigation.navigate('MovieDetail', { movie })}
        >
          <Image
            source={{ uri: movie.poster_url }}
            style={styles.moviePoster}
          />
          {showRating && (
            <View
              style={[
                styles.ratingBadge,
                ratingType === 'critic' ? styles.criticBadge : styles.audienceBadge,
              ]}
            >
              {ratingType === 'critic' ? (
                <Text style={styles.ratingText}>
                  {movie.critic_rating}%
                </Text>
              ) : (
                <Ionicons name="film" size={12} color="#FFFFFF" />
              )}
            </View>
          )}
          <Text style={styles.movieTitle} numberOfLines={1}>
            {movie.title}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: Platform.OS === 'android' ? 48 : 32,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  heroCarousel: {
    height: 400,
  },
  heroCard: {
    width: width * 0.9,
    marginHorizontal: width * 0.05,
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
  },
  heroContent: {
    padding: 16,
  },
  heroCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  heroTitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  heroButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  movieCard: {
    width: 144,
    marginLeft: 16,
  },
  moviePoster: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  criticBadge: {
    backgroundColor: Colors.rating.fresh + 'E6',
  },
  audienceBadge: {
    backgroundColor: Colors.rating.audience + 'E6',
  },
  ratingText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
});

