import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { moviesService, reviewsService, favoritesService } from '../services/api';

const { width, height } = Dimensions.get('window');

export default function MovieDetailScreen({ route, navigation }) {
  const { movie } = route.params || {};
  const { user, isAuthenticated, updateUser } = useAuth();
  const [movieDetails, setMovieDetails] = useState(movie);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sinopsis');
  const [reviewText, setReviewText] = useState('');
  const [reviewScore, setReviewScore] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);

  useEffect(() => {
    if (movie) {
      if (!movie.id && (movie.external_api_id || movie.title)) {
        loadMovieByIdOrExternalId();
      } else if (movie.id) {
        loadMovieDetails();
        loadReviews();
      }
    }
    checkIfFavorite();
  }, [movie?.id, movie?.external_api_id, movieDetails?.id, user?.id]);

  const checkIfFavorite = async () => {
    if (!isAuthenticated || !user?.id) {
      setIsFavorite(false);
      return;
    }
    const movieIdToUse = movieDetails?.id || movie?.id || movie?.external_api_id;
    if (!movieIdToUse) return;
    
    try {
      const favorite = await favoritesService.isFavorite(user.id, movieIdToUse);
      setIsFavorite(favorite);
    } catch (error) {
      console.error('Error verificando favorito:', error);
      setIsFavorite(false);
    }
  };

  const loadMovieByIdOrExternalId = async () => {
    if (!movie) return;
    try {
      setLoading(true);
      
      let movieId = movie.id;
      
      if (!movieId && movie.external_api_id) {
        try {
          const response = await moviesService.getMovieById(movie.external_api_id.toString());
          if (response.data && response.data.id) {
            movieId = response.data.id;
            setMovieDetails(response.data);
            setTimeout(() => {
              loadReviews();
            }, 100);
            return;
          }
        } catch (error) {
          console.error('Error buscando película por external_api_id:', error);
        }
      }
      
      if (movieId) {
        loadMovieDetails();
        loadReviews();
      } else {
        console.error('No se pudo encontrar un id válido para la película');
        Alert.alert('Error', 'No se pudo cargar la película. Por favor, intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error cargando película:', error);
      Alert.alert('Error', 'No se pudo cargar la película');
    } finally {
      setLoading(false);
    }
  };

  const loadMovieDetails = async () => {
    if (!movie || !movie.id) return;
    try {
      setLoading(true);
      const response = await moviesService.getMovieById(movie.id);
      if (response.data) {
        setMovieDetails(response.data);
        if (!response.data.id && movie.id) {
          setMovieDetails({ ...response.data, id: movie.id });
        }
        await checkIfFavorite();
      }
    } catch (error) {
      console.error('Error cargando detalles de película:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    const movieIdToUse = movieDetails?.id || movie?.id;
    if (!movieIdToUse) return;
    
    try {
      const response = await reviewsService.getMovieReviews(movieIdToUse);
      setReviews(response.data || []);
    } catch (error) {
      console.error('Error cargando reseñas:', error);
    }
  };

  const resetReviewForm = () => {
    setReviewText('');
    setReviewScore(0);
    setEditingReviewId(null);
  };

  const handleStartEditingReview = (review) => {
    setEditingReviewId(review.id);
    setReviewText(review.comment_text || '');
    setReviewScore(review.score || 0);
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'Debes iniciar sesión para publicar una reseña');
      return;
    }

    if (reviewScore === 0) {
      Alert.alert('Error', 'Por favor selecciona una puntuación');
      return;
    }

    const movieIdToUse = movieDetails?.id || movie?.id;
    
    if (!movieIdToUse) {
      Alert.alert('Error', 'Película no válida. Por favor, recarga la página.');
      return;
    }

    try {
      if (editingReviewId) {
        await reviewsService.updateReview(editingReviewId, {
          score: reviewScore,
          comment_text: reviewText,
        });
        Alert.alert('Éxito', 'Tu reseña fue actualizada.');
      } else {
        const result = await reviewsService.createReview(movieIdToUse, {
          score: reviewScore,
          comment_text: reviewText,
        });
        if (result?.meta?.promotedToCritic) {
          updateUser({ role: 'CRITIC' });
          Alert.alert('¡Felicidades!', 'Has sido promovido a crítico verificado.');
        }
      }
      resetReviewForm();
      loadReviews();
    } catch (error) {
      console.error('Error guardando reseña:', error);
      const errorMessage = error.response?.data?.message || 'No se pudo guardar la reseña';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleDeleteReview = (reviewId) => {
    Alert.alert('Confirmar', '¿Estás seguro de que quieres eliminar esta reseña?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await reviewsService.deleteReview(reviewId);
            loadReviews();
          } catch (error) {
            console.error('Error eliminando reseña:', error);
          }
        },
      },
    ]);
  };

  const handleToggleFavorite = async () => {
    const movieToSave = movieDetails || movie;
    if (!movieToSave) return;

    if (!isAuthenticated || !user?.id) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para usar tu lista.');
      return;
    }

    try {
      if (isFavorite) {
        const movieIdToUse = movieToSave.id || movieToSave.external_api_id;
        await favoritesService.removeFavorite(user.id, movieIdToUse);
        setIsFavorite(false);
        Alert.alert('Éxito', 'Película removida de tu lista');
      } else {
        await favoritesService.addFavorite(user.id, movieToSave);
        setIsFavorite(true);
        Alert.alert('Éxito', 'Película agregada a tu lista');
      }
    } catch (error) {
      console.error('Error cambiando favorito:', error);
      Alert.alert('Error', 'No se pudo actualizar tu lista');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!movieDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: Colors.text.primary }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <Image source={{ uri: movieDetails.poster_url }} style={styles.heroImage} />
          <LinearGradient
            colors={['rgba(18,18,18,0)', 'rgba(18,18,18,0.6)', 'rgba(18,18,18,1)']}
            style={styles.heroGradient}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{movieDetails.title}</Text>
          </View>
        </View>

        <Text style={styles.movieInfo}>
          {new Date(movieDetails.release_date).getFullYear()} • 2h 30m • R
        </Text>

        <View style={styles.addButtonContainer}>
          <TouchableOpacity 
            style={[styles.addButton, isFavorite && styles.addButtonActive]}
            onPress={handleToggleFavorite}
          >
            <Ionicons 
              name={isFavorite ? "checkmark" : "add"} 
              size={24} 
              color={Colors.text.primary} 
            />
            <Text style={styles.addButtonText}>
              {isFavorite ? 'En Mi Lista' : 'Añadir a Mi Lista'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ratingsGrid}>
          <View style={styles.ratingCard}>
            <Ionicons name="star" size={32} color={Colors.primary} />
            <Text style={styles.ratingPercent}>
              {movieDetails.critic_rating || 0}%
            </Text>
            <Text style={styles.ratingSubtext}>
              Basado en {movieDetails.critic_reviews_count || 0} reseñas de Críticos
            </Text>
          </View>
          <View style={styles.ratingCard}>
            <Ionicons name="film" size={32} color={Colors.primary} />
            <Text style={styles.ratingPercent}>
              {movieDetails.audience_rating || 0}%
            </Text>
            <Text style={styles.ratingSubtext}>
              Basado en {movieDetails.audience_reviews_count || 0} calificaciones
            </Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'sinopsis' && styles.tabActive,
            ]}
            onPress={() => setActiveTab('sinopsis')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'sinopsis' && styles.tabTextActive,
              ]}
            >
              Sinopsis
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'elenco' && styles.tabActive]}
            onPress={() => setActiveTab('elenco')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'elenco' && styles.tabTextActive,
              ]}
            >
              Elenco y Equipo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.tabActive]}
            onPress={() => setActiveTab('info')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'info' && styles.tabTextActive,
              ]}
            >
              Info
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'sinopsis' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentText}>{movieDetails.synopsis || 'Sin sinopsis disponible'}</Text>
          </View>
        )}

        {activeTab === 'elenco' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentText}>
              {movieDetails.actors?.join(', ') || 'Sin información de elenco'}
            </Text>
          </View>
        )}

        {activeTab === 'info' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentText}>
              Géneros: {movieDetails.genres?.join(', ') || 'N/A'}
              {'\n\n'}
              Fecha de estreno: {new Date(movieDetails.release_date).toLocaleDateString() || 'N/A'}
            </Text>
          </View>
        )}

        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.reviewsTitle}>Reseñas de la Comunidad</Text>
            <TouchableOpacity>
              <Text style={styles.reviewsSortText}>Más Recientes</Text>
              <Ionicons name="chevron-down" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          {isAuthenticated && (
            <View style={styles.reviewForm}>
              <TextInput
                style={styles.reviewInput}
                placeholder="Deja tu reseña..."
                placeholderTextColor={Colors.text.tertiary}
                multiline
                numberOfLines={3}
                value={reviewText}
                onChangeText={setReviewText}
              />
              <View style={styles.reviewFormFooter}>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setReviewScore(star * 2)}
                    >
                      <Ionicons
                        name={star * 2 <= reviewScore ? 'star' : 'star-outline'}
                        size={24}
                        color={Colors.primary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.reviewButtons}>
                  {editingReviewId && (
                    <TouchableOpacity
                      style={[styles.publishButton, styles.cancelButton]}
                      onPress={resetReviewForm}
                    >
                      <Text style={[styles.publishButtonText, styles.cancelButtonText]}>
                        Cancelar
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.publishButton}
                    onPress={handleSubmitReview}
                  >
                    <Text style={styles.publishButtonText}>
                      {editingReviewId ? 'Actualizar' : 'Publicar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Image
                  source={{ uri: review.user?.avatar_url }}
                  style={styles.reviewAvatar}
                />
                <View style={styles.reviewUserInfo}>
                  <View style={styles.reviewUserHeader}>
                    <Text style={styles.reviewUsername}>
                      {review.user?.username}
                    </Text>
                    {review.user?.role?.toUpperCase() === 'CRITIC' && (
                      <View style={styles.criticBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                        <Text style={styles.criticBadgeText}>Crítico Verificado</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.reviewRating}>
                    <Ionicons name="star" size={16} color={Colors.primary} />
                    <Text style={styles.reviewScore}>{review.score}/10</Text>
                  </View>
                </View>
                {user?.id === review.user_id && (
                  <View style={styles.reviewActions}>
                    <TouchableOpacity onPress={() => handleStartEditingReview(review)}>
                      <Ionicons name="create-outline" size={24} color={Colors.text.tertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteReview(review.id)}>
                      <Ionicons name="trash-outline" size={24} color={Colors.text.tertiary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Text style={styles.reviewText}>{review.comment_text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: 400,
    width: '100%',
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
    height: '100%',
  },
  heroContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  movieInfo: {
    fontSize: 16,
    color: Colors.text.tertiary,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 9999,
  },
  addButtonActive: {
    backgroundColor: Colors.success,
  },
  addButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  ratingsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,    marginBottom: 16,
  },
  ratingCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    padding: 16,  },
  ratingPercent: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  ratingSubtext: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text.tertiary,
  },
  tabTextActive: {
    color: Colors.text.primary,
  },
  tabContent: {
    padding: 16,
  },
  tabContentText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text.secondary,
  },
  reviewsSection: {
    padding: 16,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  reviewsSortText: {
    fontSize: 14,
    color: Colors.text.tertiary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewForm: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  reviewInput: {
    color: Colors.text.secondary,
    fontSize: 16,
    minHeight: 80,
    marginBottom: 12,
  },
  reviewFormFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',  },
  publishButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  publishButtonText: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginRight: 8,
  },
  cancelButtonText: {
    color: Colors.text.secondary,
  },
  reviewCard: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingVertical: 16,  },
  reviewHeader: {
    flexDirection: 'row',  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewUserInfo: {
    flex: 1,  },
  reviewUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',  },
  reviewUsername: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  criticBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '33',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,  },
  criticBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',  },
  reviewScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  reviewActions: {
    flexDirection: 'row',  },
  reviewText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text.secondary,
  },
});

