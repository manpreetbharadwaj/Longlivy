import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NutritionStackParamList } from './types';
import { NutritionDashboardScreen } from '@/screens/nutrition/NutritionDashboardScreen';
import { FoodSearchScreen } from '@/screens/nutrition/FoodSearchScreen';
import { AddFoodScreen } from '@/screens/nutrition/AddFoodScreen';
import { MealDetailsScreen } from '@/screens/nutrition/MealDetailsScreen';
import { FavoritesScreen } from '@/screens/nutrition/FavoritesScreen';
import { MyFoodsScreen } from '@/screens/nutrition/MyFoodsScreen';
import { MyRecipesScreen } from '@/screens/nutrition/MyRecipesScreen';
import { CreateRecipeScreen } from '@/screens/nutrition/CreateRecipeScreen';
import { NutritionGoalsScreen } from '@/screens/nutrition/NutritionGoalsScreen';
import { NutritionHistoryScreen } from '@/screens/nutrition/NutritionHistoryScreen';
import { BarcodeScannerScreen } from '@/screens/nutrition/BarcodeScannerScreen';
import { AiPhotoEntryScreen } from '@/screens/nutrition/AiPhotoEntryScreen';
import { AiVoiceEntryScreen, AiTextEntryScreen } from '@/screens/nutrition/AiTextVoiceEntryScreen';
import { AiMealReviewScreen } from '@/screens/nutrition/AiMealReviewScreen';

const Stack = createNativeStackNavigator<NutritionStackParamList>();

export const NutritionNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="NutritionDashboard" component={NutritionDashboardScreen} />
    <Stack.Screen name="FoodSearch" component={FoodSearchScreen} />
    <Stack.Screen name="AddFood" component={AddFoodScreen} />
    <Stack.Screen name="MealDetails" component={MealDetailsScreen} />
    <Stack.Screen name="Favorites" component={FavoritesScreen} />
    <Stack.Screen name="MyFoods" component={MyFoodsScreen} />
    <Stack.Screen name="MyRecipes" component={MyRecipesScreen} />
    <Stack.Screen name="CreateRecipe" component={CreateRecipeScreen} />
    <Stack.Screen name="NutritionGoalsScreen" component={NutritionGoalsScreen} />
    <Stack.Screen name="NutritionHistory" component={NutritionHistoryScreen} />
    <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
    <Stack.Screen name="AiPhotoEntry" component={AiPhotoEntryScreen} />
    <Stack.Screen name="AiVoiceEntry" component={AiVoiceEntryScreen} />
    <Stack.Screen name="AiTextEntry" component={AiTextEntryScreen} />
    <Stack.Screen name="AiMealReview" component={AiMealReviewScreen} />
  </Stack.Navigator>
);
