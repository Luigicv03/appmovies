export const UserRoles = {
  USER: 'user',
  CRITIC: 'critic',
};

export const User = {
  id: null,
  username: '',
  email: '',
  role: UserRoles.USER,
  avatar_url: null,
  created_at: null,
};

export const Movie = {
  id: null,
  external_api_id: null,
  title: '',
  synopsis: null,
  release_date: null,
  poster_url: null,
  genres: [],
  actors: [],
  created_at: null,
  critic_rating: 0,
  audience_rating: 0,
  critic_reviews_count: 0,
  audience_reviews_count: 0,
};

export const Review = {
  id: null,
  user_id: null,
  movie_id: null,
  score: 0,
  comment_text: null,
  created_at: null,
  user: null,
};

export const ApiResponse = {
  success: false,
  data: null,
  error: null,
  message: '',
};

export default { User, Movie, Review, UserRoles, ApiResponse };

