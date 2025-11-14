import axios from 'axios';
import { API_CONFIG } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: async (email, username, password) => {
    const response = await api.post('/auth/register', {
      email,
      username,
      password,
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

export const moviesService = {
  getMovies: async (params = {}) => {
    const response = await api.get('/movies', { params });
    return response.data;
  },

  getTrending: async () => {
    const response = await api.get('/movies/trending');
    return response.data;
  },

  getMovieById: async (id) => {
    const response = await api.get(`/movies/${id}`);
    return response.data;
  },

  searchMovies: async (searchQuery, filters = {}) => {
    const response = await api.get('/movies', {
      params: {
        search: searchQuery,
        ...filters,
      },
    });
    return response.data;
  },
};

export const reviewsService = {
  getMovieReviews: async (movieId) => {
    const response = await api.get(`/movies/${movieId}/reviews`);
    return response.data;
  },

  createReview: async (movieId, reviewData) => {
    const response = await api.post(`/movies/${movieId}/reviews`, reviewData);
    return response.data;
  },

  updateReview: async (reviewId, reviewData) => {
    const response = await api.put(`/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  deleteReview: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },
};

export const usersService = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/users/me', profileData);
    return response.data;
  },

  getMyReviews: async () => {
    const response = await api.get('/users/me/reviews');
    return response.data;
  },
};

const getFavoritesKey = (userId) => (userId ? `favorites_${userId}` : 'favorites_guest');

export const favoritesService = {
  getFavorites: async (userId) => {
    try {
      const favoritesStr = await AsyncStorage.getItem(getFavoritesKey(userId));
      return favoritesStr ? JSON.parse(favoritesStr) : [];
    } catch (error) {
      console.error('Error obteniendo favoritos:', error);
      return [];
    }
  },

  addFavorite: async (userId, movie) => {
    try {
      const favorites = await favoritesService.getFavorites(userId);

      const exists = favorites.some((fav) =>
        fav.id === movie.id ||
        (fav.external_api_id && fav.external_api_id === movie.external_api_id) ||
        (fav.title === movie.title && fav.release_date === movie.release_date)
      );

      if (!exists) {
        const updated = [...favorites, movie];
        await AsyncStorage.setItem(getFavoritesKey(userId), JSON.stringify(updated));
        return updated;
      }

      return favorites;
    } catch (error) {
      console.error('Error agregando a favoritos:', error);
      throw error;
    }
  },

  removeFavorite: async (userId, movieId) => {
    try {
      const favorites = await favoritesService.getFavorites(userId);
      const filtered = favorites.filter((fav) => {
        if (fav.id && fav.id === movieId) return false;
        if (fav.external_api_id && movieId) {
          return fav.external_api_id.toString() !== movieId.toString();
        }
        return true;
      });
      await AsyncStorage.setItem(getFavoritesKey(userId), JSON.stringify(filtered));
      return filtered;
    } catch (error) {
      console.error('Error removiendo de favoritos:', error);
      throw error;
    }
  },

  isFavorite: async (userId, movieId) => {
    try {
      const favorites = await favoritesService.getFavorites(userId);
      return favorites.some((fav) => {
        if (fav.id && fav.id === movieId) return true;
        if (fav.external_api_id && movieId) {
          return fav.external_api_id.toString() === movieId.toString();
        }
        return false;
      });
    } catch (error) {
      console.error('Error verificando favorito:', error);
      return false;
    }
  },
};

export default api;

