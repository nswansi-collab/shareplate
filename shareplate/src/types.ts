export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'donor' | 'receiver' | 'moderator' | 'admin' | 'ngo' | 'volunteer';
  societyId: string;
  apartmentNo: string;
  verified: boolean;
  greenPoints: number;
  reputationScore: number; // 0 to 100
  allergies: string[];
  dietaryPreferences: string[];
  impact: {
    mealsSaved: number;
    co2SavedKg: number; // 1 meal saved ~ 2.5 kg CO2
    moneySavedUsd: number;
  };
}

export interface Society {
  id: string;
  name: string;
  address: string;
  inviteCode: string;
  verifiedCount: number;
}

export type FoodCategory = 'meals' | 'bakery' | 'fruits-veg' | 'sweets' | 'grocery' | 'packaged';
export type DietType = 'veg' | 'non-veg' | 'vegan' | 'jain';

export interface FoodListing {
  id: string;
  donorId: string;
  donorName: string;
  donorAvatar: string;
  title: string;
  description: string;
  category: FoodCategory;
  dietType: DietType;
  ingredients: string[];
  allergens: string[];
  quantity: string; // e.g., "3 servings", "2 kg"
  servings: number;
  expiryTime: string; // ISO String
  pickupWindowStart: string; // ISO String
  pickupWindowEnd: string; // ISO String
  pickupLocation: string;
  storageInstructions: string;
  images: string[]; // URLs or Base64
  freshnessScore: number; // 1-100 predicted by AI
  aiFlags: string[]; // e.g. "Low Image Quality", "Contains Nuts"
  aiAnalysis?: {
    estimatedFreshness: string;
    suggestedIngredients: string[];
    expiryPrediction: string;
    foodSafetyCheck: string;
  };
  status: 'available' | 'reserved' | 'claimed' | 'cancelled';
  createdAt: string;
}

export interface Reservation {
  id: string;
  listingId: string;
  listingTitle: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  otp: string;
  status: 'pending' | 'ready' | 'completed' | 'cancelled';
  reservedAt: string;
  completedAt?: string;
}

export interface DiscussionPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  content: string;
  category: 'recipe' | 'announcement' | 'sustainability' | 'tips' | 'event';
  likes: number;
  commentsCount: number;
  createdAt: string;
}

export interface RewardCoupon {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  providerName: string;
  code: string;
  category: 'grocery' | 'dining' | 'donation' | 'utility';
  logo: string;
}

export interface CommunityImpactMetrics {
  totalMealsSaved: number;
  totalCo2SavedKg: number;
  activeMembers: number;
  topCategories: { category: FoodCategory; count: number }[];
}
