import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { usersService, favoritesService } from '../services/api';

export default function ProfileScreen({ navigation }) {
  const { user, isAuthenticated, login, register, logout, updateUser } = useAuth();
  const [myReviews, setMyReviews] = useState([]);
  const [myFavorites, setMyFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [activeTab, setActiveTab] = useState('reviews');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadMyFavorites(true);
        loadMyReviews(true);
      } else {
        setMyReviews([]);
        setMyFavorites([]);
      }
    }, [isAuthenticated, user?.id])
  );

  const loadMyReviews = async (force = false) => {
    if (!force && myReviews.length > 0) return;
    
    try {
      setLoading(true);
      const response = await usersService.getMyReviews();
      setMyReviews(response.data || []);
    } catch (error) {
      if (myReviews.length === 0) {
        setMyReviews([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMyFavorites = async (force = false) => {
    if (!isAuthenticated || !user?.id) {
      setMyFavorites([]);
      return;
    }
    if (!force && myFavorites.length > 0) return;
    
    try {
      setLoadingFavorites(true);
      const favorites = await favoritesService.getFavorites(user.id);
      setMyFavorites(favorites || []);
    } catch (error) {
      if (myFavorites.length === 0) {
        setMyFavorites([]);
      }
    } finally {
      setLoadingFavorites(false);
    }
  };

  const ProfileHeaderSection = () => (
    <View style={styles.profileHeader}>
      <View style={styles.profileInfo}>
        <Image
          source={{ uri: user?.avatar_url || 'https://via.placeholder.com/100' }}
          style={styles.avatar}
        />
        <View style={styles.profileDetails}>
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.role}>
            {user?.role?.toUpperCase() === 'CRITIC' ? 'Crítico' : 'Usuario'}
          </Text>
        </View>
      </View>

      <View style={styles.profileActions}>
        <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
          <Text style={styles.editButtonText}>Editar Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const TabsSection = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
        onPress={() => setActiveTab('reviews')}
      >
        <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
          Mis Reseñas
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
        onPress={() => setActiveTab('favorites')}
      >
        <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
          Mi Lista
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = (iconName, title, subtitle) => (
    <View style={styles.emptyContainer}>
      <Ionicons name={iconName} size={64} color={Colors.text.tertiary} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('Buscar')}
      >
        <Text style={styles.emptyButtonText}>Buscar Películas</Text>
      </TouchableOpacity>
    </View>
  );

  const handleAuth = async () => {
    setError('');
    setAuthLoading(true);

    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      const trimmedUsername = username.trim();

      if (!trimmedEmail) {
        setError('El email es requerido');
        setAuthLoading(false);
        return;
      }

      if (!trimmedPassword) {
        setError('La contraseña es requerida');
        setAuthLoading(false);
        return;
      }

      if (isLogin) {
        const result = await login(trimmedEmail, trimmedPassword);
        if (!result.success) {
          setError(result.error || 'Credenciales inválidas');
        }
      } else {
        if (!trimmedUsername) {
          setError('El nombre de usuario es requerido');
          setAuthLoading(false);
          return;
        }
        const result = await register(trimmedEmail, trimmedUsername, trimmedPassword);
        if (!result.success) {
          setError(result.error || 'Error al registrarse');
        }
      }
    } catch (err) {
      setError('Ocurrió un error. Por favor intenta de nuevo.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setEmail('');
    setPassword('');
    setUsername('');
    setError('');
    setMyFavorites([]);
  };

  const openEditModal = () => {
    setEditUsername(user?.username || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setUpdateError('');
    setUpdateSuccess('');
    setShowEditModal(true);
  };

  const handleUpdateProfile = async () => {
    setUpdateError('');
    setUpdateSuccess('');

    const trimmedUsername = editUsername.trim();

    if (!trimmedUsername) {
      setUpdateError('El nombre de usuario no puede estar vacío.');
      return;
    }

    const isChangingPassword =
      currentPassword.length > 0 ||
      newPassword.length > 0 ||
      confirmPassword.length > 0;

    if (isChangingPassword) {
      if (!currentPassword) {
        setUpdateError('Debes ingresar tu contraseña actual.');
        return;
      }
      if (!newPassword) {
        setUpdateError('Debes ingresar la nueva contraseña.');
        return;
      }
      if (newPassword.length < 6) {
        setUpdateError('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setUpdateError('La confirmación de contraseña no coincide.');
        return;
      }
    }

    setUpdateLoading(true);

    try {
      const payload = {
        username: trimmedUsername,
      };

      if (isChangingPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      const response = await usersService.updateProfile(payload);

      if (!response.success) {
        setUpdateError(response.message || 'No se pudo actualizar el perfil.');
        return;
      }

      await updateUser(response.data);
      setUpdateSuccess('Perfil actualizado correctamente.');

      if (!isChangingPassword) {
        setShowEditModal(false);
      } else {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
      
      loadMyReviews(true);
    } catch (err) {
      setUpdateError(
        err.response?.data?.message || 'Ocurrió un error al actualizar el perfil.'
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bienvenido</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.authContainer}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor={Colors.text.tertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre de Usuario</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Usuario"
                  placeholderTextColor={Colors.text.tertiary}
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          {error ? (
            <View style={[styles.errorContainer, styles.authFeedback]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAuth}
              disabled={authLoading}
            >
              {authLoading ? (
                <ActivityIndicator color={Colors.text.primary} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
            >
              <Text style={styles.secondaryButtonText}>
                {isLogin ? 'Registrarse' : 'Iniciar Sesión'}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      {activeTab === 'favorites' ? (
        <FlatList
          data={myFavorites}
          keyExtractor={(item, index) => item.id || item.external_api_id?.toString() || index.toString()}
          numColumns={2}
          columnWrapperStyle={styles.favoriteRow}
          contentContainerStyle={styles.favoritesListContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.favoriteItem}
              onPress={() => navigation.navigate('MovieDetail', { movie: item })}
            >
              <Image
                source={{ uri: item.poster_url || 'https://via.placeholder.com/300x450?text=No+Image' }}
                style={styles.favoritePoster}
              />
              <Text style={styles.favoriteTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
          ListHeaderComponent={() => (
            <>
              <ProfileHeaderSection />
              <TabsSection />
            </>
          )}
          ListEmptyComponent={() => (
            loadingFavorites
              ? <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>
              : renderEmptyState(
                  'heart-outline',
                  'Tu lista está vacía',
                  '¡Agrega películas a tu lista desde el detalle de cualquier película!'
                )
          )}
        />
      ) : (
        <ScrollView style={styles.scrollView}>
          <ProfileHeaderSection />
          <TabsSection />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : myReviews.length === 0 ? (
            renderEmptyState(
              'film-outline',
              'No has escrito ninguna reseña',
              '¡Busca una película y comparte tu opinión!'
            )
          ) : (
            <View style={styles.reviewsList}>
              {myReviews.map((review) => (
                <TouchableOpacity
                  key={review.id}
                  style={styles.reviewItem}
                  onPress={() => navigation.navigate('MovieDetail', { movie: review.movie })}
                >
                  <Image
                    source={{ uri: review.movie?.poster_url || 'https://via.placeholder.com/300x450?text=No+Image' }}
                    style={styles.reviewPoster}
                  />
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewMovieTitle} numberOfLines={1}>
                      {review.movie?.title}
                    </Text>
                    <Text style={styles.reviewText} numberOfLines={2}>
                      {review.comment_text}
                    </Text>
                  </View>
                  <View style={styles.reviewRating}>
                    <Text style={styles.reviewStars}>
                      {'⭐'.repeat(Math.floor(review.score / 2))}
                      {'☆'.repeat(5 - Math.floor(review.score / 2))}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <ScrollView
              contentContainerStyle={styles.modalForm}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre de usuario</Text>
                <TextInput
                  style={styles.input}
                  value={editUsername}
                  onChangeText={setEditUsername}
                  placeholder="Nombre de usuario"
                  placeholderTextColor={Colors.text.tertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

          <View style={styles.dividerSmall}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerTextSmall}>Cambiar contraseña</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña actual</Text>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.text.tertiary}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nueva contraseña</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.text.tertiary}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmar nueva contraseña</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.text.tertiary}
                  secureTextEntry
                />
              </View>

              {updateError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{updateError}</Text>
                </View>
              ) : null}

              {updateSuccess ? (
                <View style={styles.successContainer}>
                  <Text style={styles.successText}>{updateSuccess}</Text>
                </View>
              ) : null}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.primaryButton, updateLoading && styles.disabledButton]}
                  onPress={handleUpdateProfile}
                  disabled={updateLoading}
                >
                  {updateLoading ? (
                    <ActivityIndicator color={Colors.text.primary} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Guardar cambios</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setShowEditModal(false)}
                  disabled={updateLoading}
                >
                  <Text style={styles.secondaryButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: Platform.OS === 'android' ? 48 : 32,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  authContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 360,
    marginTop: 32,
    alignSelf: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text.primary,
  },
  errorContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: Colors.error + '20',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
  },
  successContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: Colors.success + '20',
    borderRadius: 8,
  },
  successText: {
    fontSize: 14,
    color: Colors.success,
  },
  authFeedback: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  actions: {
    width: '100%',
    maxWidth: 360,
    marginTop: 32,
    gap: 12,
    alignSelf: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.light,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 16,
    color: Colors.text.tertiary,
  },
  profileHeader: {
    padding: 16,  },
  profileInfo: {
    flexDirection: 'row',    alignItems: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  profileDetails: {
    marginLeft: 16,
  },
  profileActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
    width: '100%',
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  role: {
    fontSize: 16,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  editButton: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 9999,
    alignItems: 'center',
    flex: 1,
  },
  editButtonText: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 9999,
    alignItems: 'center',
    flex: 1,
  },
  logoutButtonText: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text.primary,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.tertiary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 9999,
  },
  emptyButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewsList: {
    flex: 1,
  },
  reviewItem: {
    flexDirection: 'row',
    padding: 16,    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  reviewPoster: {
    width: 48,
    height: 72,
    borderRadius: 8,
  },
  reviewInfo: {
    flex: 1,
    marginLeft: 16,
  },
  reviewMovieTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  reviewText: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
  reviewRating: {
    justifyContent: 'center',
    marginLeft: 16,
  },
  reviewStars: {
    fontSize: 16,
    color: Colors.primary,
  },
  favoriteItem: {
    width: '48%',
  },
  favoritePoster: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  favoriteTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
    marginTop: 8,
  },
  favoriteRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  favoritesListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.dark,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  modalForm: {
    paddingBottom: 16,
    gap: 16,
  },
  modalActions: {
    marginTop: 16,
    gap: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  dividerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dividerTextSmall: {
    marginHorizontal: 12,
    fontSize: 14,
    color: Colors.text.tertiary,
  },
});

