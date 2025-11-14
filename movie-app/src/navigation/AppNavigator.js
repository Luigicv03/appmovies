import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MovieDetailScreen from '../screens/MovieDetailScreen';
import MovieListScreen from '../screens/MovieListScreen';
import Colors from '../constants/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="MovieDetail" 
        component={MovieDetailScreen}
        options={({ route }) => ({
          title: route.params?.movie?.title || 'Detalle',
          headerStyle: {
            backgroundColor: Colors.background.dark,
          },
          headerTintColor: Colors.text.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      />
      <Stack.Screen
        name="MovieList"
        component={MovieListScreen}
        options={({ route }) => ({
          title: route.params?.title || 'Películas',
          headerStyle: {
            backgroundColor: Colors.background.dark,
          },
          headerTintColor: Colors.text.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      />
    </Stack.Navigator>
  );
}

function SearchStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="SearchMain" 
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="MovieDetail" 
        component={MovieDetailScreen}
        options={({ route }) => ({
          title: route.params?.movie?.title || 'Detalle',
          headerStyle: {
            backgroundColor: Colors.background.dark,
          },
          headerTintColor: Colors.text.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MovieDetail"
        component={MovieDetailScreen}
        options={({ route }) => ({
          title: route.params?.movie?.title || 'Detalle',
          headerStyle: {
            backgroundColor: Colors.background.dark,
          },
          headerTintColor: Colors.text.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Inicio') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Buscar') {
              iconName = focused ? 'search' : 'search-outline';
            } else if (route.name === 'Perfil') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.text.tertiary,
          tabBarStyle: {
            backgroundColor: Colors.background.dark,
            borderTopColor: Colors.border.light,
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 10),
            paddingTop: 10,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Inicio" 
          component={HomeStack}
          options={{
            tabBarLabel: 'Inicio',
          }}
        />
        <Tab.Screen 
          name="Buscar" 
          component={SearchStack}
          options={{
            tabBarLabel: 'Buscar',
          }}
        />
        <Tab.Screen 
          name="Perfil" 
          component={ProfileStack}
          options={{
            tabBarLabel: 'Perfil',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

//..