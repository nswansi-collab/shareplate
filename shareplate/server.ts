import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { FoodListing, UserProfile, Reservation, DiscussionPost, RewardCoupon } from './src/types';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google GenAI client safely
let aiClient: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini API client initialized successfully.');
  } else {
    console.warn('GEMINI_API_KEY missing. Server will run with high-fidelity simulated AI features.');
  }
} catch (err) {
  console.error('Error during Gemini SDK initialization:', err);
}

// In-memory Database mock tables with high-fidelity data
let mockUser: UserProfile = {
  id: 'user_priya',
  name: 'Priya Sharma',
  email: 'priya.sharma@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
  role: 'donor',
  societyId: 'soc_greenwood',
  apartmentNo: 'Block B - 804',
  verified: true,
  greenPoints: 340,
  reputationScore: 98,
  allergies: ['Peanuts'],
  dietaryPreferences: ['veg', 'jain'],
  impact: {
    mealsSaved: 14,
    co2SavedKg: 35.0,
    moneySavedUsd: 70,
  },
};

let mockListings: FoodListing[] = [
  {
    id: 'food_1',
    donorId: 'user_arjun',
    donorName: 'Arjun Mehta',
    donorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    title: 'Excess Wedding Samosas',
    description: 'Crispy, premium potato samosas from my sister’s engagement. Stored in high-grade heat containers. Packed this afternoon.',
    category: 'sweets',
    dietType: 'veg',
    ingredients: ['Potato', 'Maida flour', 'Green peas', 'Spices'],
    allergens: ['Gluten'],
    quantity: '12 large pieces',
    servings: 6,
    expiryTime: new Date(Date.now() + 6 * 3600000).toISOString(), // 6 hours from now
    pickupWindowStart: new Date(Date.now() + 30 * 60000).toISOString(),
    pickupWindowEnd: new Date(Date.now() + 5 * 3600000).toISOString(),
    pickupLocation: 'Tower A - Lobby or Flat 302',
    storageInstructions: 'Best reheated in dry oven or air-fryer',
    images: ['https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=400'],
    freshnessScore: 94,
    aiFlags: [],
    aiAnalysis: {
      estimatedFreshness: 'Extremely fresh, packed today. High quality crispy crust.',
      suggestedIngredients: ['Potato', 'Maida', 'Peas', 'Spices'],
      expiryPrediction: 'Consume within 8 hours. Do not refrigerate cooked pastry crust to avoid sogginess.',
      foodSafetyCheck: 'Safe. Highly sealed, cleanly packed.',
    },
    status: 'available',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'food_2',
    donorId: 'user_sara',
    donorName: 'Sara Fernandes',
    donorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    title: 'Freshly Baked Banana Bread',
    description: 'Home-baked organic banana bread. Eggless, prepared with brown sugar and organic walnuts.',
    category: 'bakery',
    dietType: 'vegan',
    ingredients: ['Ripe bananas', 'Wheat flour', 'Walnuts', 'Coconut oil', 'Brown sugar'],
    allergens: ['Nuts', 'Gluten'],
    quantity: 'Half loaf remaining',
    servings: 3,
    expiryTime: new Date(Date.now() + 36 * 3600000).toISOString(), // 36 hours
    pickupWindowStart: new Date(Date.now() + 10 * 60000).toISOString(),
    pickupWindowEnd: new Date(Date.now() + 24 * 3600000).toISOString(),
    pickupLocation: 'Tower C - Floor 12, Flat 1201',
    storageInstructions: 'Keep wrapped in aluminum foil, refrigerated is optional',
    images: ['https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&q=80&w=400'],
    freshnessScore: 97,
    aiFlags: ['Contains Walnuts'],
    aiAnalysis: {
      estimatedFreshness: 'Perfect moisture level. Baked 2 hours ago.',
      suggestedIngredients: ['Flour', 'Bananas', 'Walnuts', 'Sugar', 'Oil'],
      expiryPrediction: 'Will stay soft for 2 days. Store sealed.',
      foodSafetyCheck: 'Very safe, non-perishable baked goods.',
    },
    status: 'available',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'food_3',
    donorId: 'user_kavita',
    donorName: 'Kavita Iyer',
    donorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    title: 'Surplus organic tomatoes & carrots',
    description: 'Extra vegetables from our farm box order. Crisp, washed twice and chilled in refrigeration.',
    category: 'fruits-veg',
    dietType: 'vegan',
    ingredients: ['Red tomatoes', 'Sweet carrots'],
    allergens: [],
    quantity: '1.5 kg tomatoes, 8 carrots',
    servings: 4,
    expiryTime: new Date(Date.now() + 72 * 3600000).toISOString(), // 7 days
    pickupWindowStart: new Date().toISOString(),
    pickupWindowEnd: new Date(Date.now() + 48 * 3600000).toISOString(),
    pickupLocation: 'Clubhouse Guard Desk reception box',
    storageInstructions: 'Store carrots in crisper tray; keep tomatoes out at room temperature',
    images: ['https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=400'],
    freshnessScore: 89,
    aiFlags: [],
    aiAnalysis: {
      estimatedFreshness: 'Raw produce, solid skin, no bruising detected.',
      suggestedIngredients: ['Carrots', 'Tomatoes'],
      expiryPrediction: 'Veggies stay healthy for 5-7 days.',
      foodSafetyCheck: 'Healthy. Washed raw veggies.',
    },
    status: 'available',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  }
];

let mockReservations: Reservation[] = [];

let mockDiscussions: DiscussionPost[] = [
  {
    id: 'post_1',
    authorId: 'user_arjun',
    authorName: 'Arjun Mehta',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    title: 'Cooking hacks: Storing leftover curry without losing flavor',
    content: 'Always let the curry cool down to room temperature entirely before covering and sealing in glass bowls. Storing metallic containers causes light oxidation that degrades the spices.',
    category: 'tips',
    likes: 18,
    commentsCount: 4,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'post_2',
    authorId: 'user_admin',
    authorName: 'Greenwood Association',
    authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    title: 'Surplus food collection from AGM inside the Clubhouse',
    content: 'Our annual general meeting just finished and we have around 10 plates of packed vegetable biryani remaining. Please drop by the lobby table to pick them up or reserve them!',
    category: 'announcement',
    likes: 34,
    commentsCount: 9,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  }
];

// Helper to generate dynamic OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// -------------------------------------------------
// ENDPOINTS
// -------------------------------------------------

// API Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Profile Management
app.get('/api/profile', (req, res) => {
  res.json(mockUser);
});

// Reward Coupons List
app.get('/api/rewards/coupons', (req, res) => {
  const coupons: RewardCoupon[] = [
    { id: 'c1', title: 'Free Organic Salad Bowl', description: 'Redeem at Greenwood Co-op Cafe', pointsCost: 150, providerName: 'GreenLife Salad Bar', code: 'ECOSALAD150', category: 'dining', logo: '🥗' },
    { id: 'c2', title: '$10 Grocery Coupon', description: 'Applicable on bills above $30', pointsCost: 300, providerName: 'Supermart Fresh', code: 'SMART10OFF', category: 'grocery', logo: '🛒' },
    { id: 'c3', title: 'Sponsor a Child Meal', description: 'Donate your points to Robin Hood Army NGO', pointsCost: 100, providerName: 'Robin Hood Army NGO', code: 'DONATEMEAL', category: 'donation', logo: '❤️' },
  ];
  res.json(coupons);
});

// Redeme Points
app.post('/api/profile/rewards', (req, res) => {
  const { pointsCost } = req.body;
  if (mockUser.greenPoints >= pointsCost) {
    mockUser.greenPoints -= pointsCost;
    res.json({ success: true, remainingPoints: mockUser.greenPoints });
  } else {
    res.status(400).json({ error: 'Insufficient Green Points.' });
  }
});

// Get Active Listings
app.get('/api/listings', (req, res) => {
  res.json(mockListings);
});

// Create Listing with Optional AI Assistant Enhancement
app.post('/api/listings', (req, res) => {
  const { title, description, category, dietType, quantity, servings, storageInstructions, ingredients, allergens, image, expiryHours } = req.body;

  const newId = `food_${Date.now()}`;
  const expiry = new Date(Date.now() + (expiryHours || 12) * 3600000).toISOString();

  const freshScore = Math.floor(Math.random() * 15) + 85; // 85-100

  const newListing: FoodListing = {
    id: newId,
    donorId: mockUser.id,
    donorName: mockUser.name,
    donorAvatar: mockUser.avatar,
    title,
    description,
    category,
    dietType,
    ingredients: ingredients || ['Home ingredients'],
    allergens: allergens || [],
    quantity,
    servings: Number(servings) || 1,
    expiryTime: expiry,
    pickupWindowStart: new Date().toISOString(),
    pickupWindowEnd: expiry,
    pickupLocation: mockUser.apartmentNo,
    storageInstructions: storageInstructions || 'Keep fresh and chilled',
    images: [image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400'],
    freshnessScore: freshScore,
    aiFlags: allergens || [],
    status: 'available',
    createdAt: new Date().toISOString(),
  };

  mockListings.unshift(newListing);
  res.status(201).json(newListing);
});

// Reserve a Listing
app.post('/api/listings/:id/reserve', (req, res) => {
  const { id } = req.params;
  const listingIndex = mockListings.findIndex((item) => item.id === id);

  if (listingIndex === -1) {
    return res.status(404).json({ error: 'Listing not found.' });
  }

  const listing = mockListings[listingIndex];
  if (listing.status !== 'available') {
    return res.status(400).json({ error: 'Listing is no longer available.' });
  }

  // Update listing status
  listing.status = 'reserved';

  const reservation: Reservation = {
    id: `res_${Date.now()}`,
    listingId: listing.id,
    listingTitle: listing.title,
    receiverId: mockUser.id,
    receiverName: mockUser.name,
    receiverAvatar: mockUser.avatar,
    otp: generateOTP(),
    status: 'ready',
    reservedAt: new Date().toISOString(),
  };

  mockReservations.push(reservation);
  res.json({ success: true, listing, reservation });
});

// Complete / Claim Reservation (Contactless OTP step)
app.post('/api/listings/:id/claim', (req, res) => {
  const { id } = req.params;
  const { otp } = req.body;

  const reservationIndex = mockReservations.findIndex((item) => item.listingId === id && item.status === 'ready');

  if (reservationIndex === -1) {
    return res.status(404).json({ error: 'Active reservation not found for this listing.' });
  }

  const reservation = mockReservations[reservationIndex];

  // Optional OTP match
  if (otp && reservation.otp !== otp) {
    return res.status(400).json({ error: 'Invalid verification OTP code.' });
  }

  reservation.status = 'completed';
  reservation.completedAt = new Date().toISOString();

  const listingIndex = mockListings.findIndex((item) => item.id === id);
  if (listingIndex !== -1) {
    mockListings[listingIndex].status = 'claimed';
  }

  // Award eco green points!
  mockUser.greenPoints += 50;
  mockUser.impact.mealsSaved += 1;
  mockUser.impact.co2SavedKg += 2.5;

  res.json({ success: true, reservation, awardedPoints: 50 });
});

// Cancel Reservation
app.post('/api/listings/:id/cancel', (req, res) => {
  const { id } = req.params;

  const reservationIndex = mockReservations.findIndex((item) => item.listingId === id && item.status === 'ready');
  if (reservationIndex !== -1) {
    mockReservations[reservationIndex].status = 'cancelled';
  }

  const listingIndex = mockListings.findIndex((item) => item.id === id);
  if (listingIndex !== -1) {
    mockListings[listingIndex].status = 'available';
  }

  res.json({ success: true, msg: 'Reservation canceled successfully' });
});

// Community Discussions Board
app.get('/api/discussions', (req, res) => {
  res.json(mockDiscussions);
});

app.post('/api/discussions', (req, res) => {
  const { title, content, category } = req.body;
  const newPost: DiscussionPost = {
    id: `post_${Date.now()}`,
    authorId: mockUser.id,
    authorName: mockUser.name,
    authorAvatar: mockUser.avatar,
    title,
    content,
    category: category || 'tips',
    likes: 0,
    commentsCount: 0,
    createdAt: new Date().toISOString(),
  };

  mockDiscussions.unshift(newPost);
  res.json(newPost);
});

// -------------------------------------------------
// GEMINI INTELLIGENCE API ROUTES
// -------------------------------------------------

// 1. Analyze Listing description (Multimodal/Text Ingredients Parser & Safety Guard)
app.post('/api/ai/analyze', async (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description query is required.' });
  }

  if (!aiClient) {
    // Return high-fidelity fallback response if Gemini client is unconfigured
    return res.json({
      estimatedFreshness: '88% Fresh (Simulated AI)',
      suggestedIngredients: ['Curry spice', 'Potato', 'Milk/Dairy base', 'Peas', 'Cashews'],
      expiryPrediction: 'Expires in approximately 4 hours. Recommend refrigeration.',
      foodSafetyCheck: 'Contains allergens: DAIRY, TREE NUTS. Highly safe if consumed soon.',
    });
  }

  try {
    const prompt = `You are the food intelligence engine of SharePlate. Analyze this resident food description:
"${description}"

Return a JSON with the following schema:
{
  "estimatedFreshness": "Short description of freshness",
  "suggestedIngredients": ["list", "of", "likely", "ingredients"],
  "expiryPrediction": "When should this be eaten",
  "foodSafetyCheck": "Allergen warning or safety flags if suspicious"
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedFreshness: { type: Type.STRING },
            suggestedIngredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            expiryPrediction: { type: Type.STRING },
            foodSafetyCheck: { type: Type.STRING },
          },
          required: ['estimatedFreshness', 'suggestedIngredients', 'expiryPrediction', 'foodSafetyCheck'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    res.json(parsedData);
  } catch (error: any) {
    console.error('Gemini API analysis failed:', error);
    res.status(500).json({ error: 'AI processing error', details: error.message });
  }
});

// 2. Dynamic Smart Recipe Recommendations from listing elements
app.post('/api/ai/recipe', async (req, res) => {
  const { items } = req.body; // e.g. ["tomatoes", "carrots", "bread"]

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Active ingredients/items array required.' });
  }

  if (!aiClient) {
    return res.json({
      recipeName: 'Hyperlocal Roasted Tomato & Carrot Toast (Simulated AI)',
      instructions: '1. Lightly chop farm fresh tomatoes and carrots.\n2. Roast with a drizzle of oil and herbs.\n3. Smash on toasted walnut bread slices.\n4. Garnish with pepper.',
      prepTime: '15 mins',
    });
  }

  try {
    const prompt = `Suggest a simple, delicious home recipe that can be cooked using some of these hyperlocal surplus food ingredients: ${items.join(', ')}. Keep it extremely clear and direct.

Return a JSON with the following schema:
{
  "recipeName": "Title of Recipe",
  "instructions": "Step-by-step numbered string",
  "prepTime": "Estimation time"
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recipeName: { type: Type.STRING },
            instructions: { type: Type.STRING },
            prepTime: { type: Type.STRING },
          },
          required: ['recipeName', 'instructions', 'prepTime'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    res.json(parsedData);
  } catch (error: any) {
    console.error('Gemini Recipe API failed:', error);
    res.status(500).json({ error: 'AI cooking suggestion failed', details: error.message });
  }
});

// -------------------------------------------------
// VITE OR STATIC STATIC MIDDLEWARES
// -------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SharePlate Server] listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
