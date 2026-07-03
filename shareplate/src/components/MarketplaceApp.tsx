import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Filter, Plus, ShieldCheck, HelpCircle, Flame, MapPin, AlertTriangle,
  Clock, Award, MessageSquare, PlusCircle, CheckCircle, RefreshCw, X, Heart,
  Send, Sparkles, User, ShoppingBag, ArrowRight, ClipboardCheck, Trash2
} from 'lucide-react';
import { FoodListing, UserProfile, Reservation, DiscussionPost, RewardCoupon } from '../types';

export default function MarketplaceApp() {
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [discussions, setDiscussions] = useState<DiscussionPost[]>([]);
  const [rewards, setRewards] = useState<RewardCoupon[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dietFilter, setDietFilter] = useState<string>('all');

  // Modals & Active States
  const [activeTab, setActiveTab] = useState<'discover' | 'impact' | 'community' | 'admin'>('discover');
  const [selectedItem, setSelectedItem] = useState<FoodListing | null>(null);
  const [activeReservation, setActiveReservation] = useState<{ listing: FoodListing; reservation: Reservation } | null>(null);
  const [showAddListing, setShowAddListing] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);
  const [aiRecipe, setAiRecipe] = useState<{ recipeName: string; instructions: string; prepTime: string } | null>(null);

  // Form States for Add Listing
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState<'meals' | 'bakery' | 'fruits-veg' | 'sweets' | 'grocery' | 'packaged'>('meals');
  const [newDiet, setNewDiet] = useState<'veg' | 'non-veg' | 'vegan' | 'jain'>('veg');
  const [newQuantity, setNewQuantity] = useState('');
  const [newServings, setNewServings] = useState(1);
  const [newExpiry, setNewExpiry] = useState(6);
  const [newInstructions, setNewInstructions] = useState('');
  const [newAllergens, setNewAllergens] = useState('');

  // OTP Verification
  const [verifyOtpInput, setVerifyOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  // Discussion Form
  const [discTitle, setDiscTitle] = useState('');
  const [discContent, setDiscContent] = useState('');
  const [discCat, setDiscCat] = useState<'recipe' | 'tips' | 'event' | 'sustainability'>('tips');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const listingRes = await fetch('/api/listings');
      const listingData = await listingRes.json();
      setListings(listingData);

      const profileRes = await fetch('/api/profile');
      const profileData = await profileRes.json();
      setProfile(profileData);

      const discRes = await fetch('/api/discussions');
      const discData = await discRes.json();
      setDiscussions(discData);

      const rewardRes = await fetch('/api/rewards/coupons');
      const rewardData = await rewardRes.json();
      setRewards(rewardData);
    } catch (err) {
      console.error('Error fetching marketplace data:', err);
    }
  };

  // Run Real Gemini AI freshness scan/allergen audit on active item
  const handleAiScan = async (item: FoodListing) => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: item.description }),
      });
      const data = await res.json();
      setListings(prev =>
        prev.map(lst => (lst.id === item.id ? { ...lst, aiAnalysis: data } : lst))
      );
      setSelectedItem(prev => (prev?.id === item.id ? { ...prev, aiAnalysis: data } : prev));
    } catch (err) {
      console.error('Gemini AI scan failed:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Run Real Gemini AI zero-waste recipe coach
  const handleGenerateRecipe = async () => {
    setIsRecipeLoading(true);
    setAiRecipe(null);
    try {
      const currentListingTitles = listings.map(l => l.title);
      const res = await fetch('/api/ai/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: currentListingTitles }),
      });
      const data = await res.json();
      setAiRecipe(data);
    } catch (err) {
      console.error('Gemini Recipe Engine failed:', err);
    } finally {
      setIsRecipeLoading(false);
    }
  };

  // Reserve listing
  const handleReserve = async (item: FoodListing) => {
    try {
      const res = await fetch(`/api/listings/${item.id}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setActiveReservation({ listing: data.listing, reservation: data.reservation });
        setSelectedItem(null);
        fetchInitialData(); // reload
      }
    } catch (err) {
      console.error('Reservation process failed:', err);
    }
  };

  // Confirm pickup via OTP
  const handleConfirmPickup = async () => {
    if (!activeReservation) return;
    setOtpError('');
    try {
      const res = await fetch(`/api/listings/${activeReservation.listing.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: verifyOtpInput }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveReservation(null);
        setVerifyOtpInput('');
        fetchInitialData(); // reload stats, listings
      } else {
        setOtpError(data.error || 'Invalid OTP code.');
      }
    } catch (err) {
      console.error('Claim verification failed:', err);
    }
  };

  // Cancel claim
  const handleCancelReservation = async () => {
    if (!activeReservation) return;
    try {
      await fetch(`/api/listings/${activeReservation.listing.id}/cancel`, { method: 'POST' });
      setActiveReservation(null);
      fetchInitialData();
    } catch (err) {
      console.error('Cancel reservation failed:', err);
    }
  };

  // Add Listing
  const handleCreateListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          category: newCat,
          dietType: newDiet,
          quantity: newQuantity,
          servings: newServings,
          storageInstructions: newInstructions,
          allergens: newAllergens ? newAllergens.split(',').map(s => s.trim()) : [],
          expiryHours: newExpiry,
        }),
      });
      if (res.ok) {
        setShowAddListing(false);
        // Clear forms
        setNewTitle('');
        setNewDesc('');
        setNewQuantity('');
        setNewServings(1);
        setNewInstructions('');
        setNewAllergens('');
        fetchInitialData();
      }
    } catch (err) {
      console.error('Add listing failed:', err);
    }
  };

  // Create discussion post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discTitle || !discContent) return;
    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: discTitle, content: discContent, category: discCat }),
      });
      if (res.ok) {
        setDiscTitle('');
        setDiscContent('');
        fetchInitialData();
      }
    } catch (err) {
      console.error('Discussion creation failed:', err);
    }
  };

  // Redeem Rewards Coupon
  const handleRedeemCoupon = async (coupon: RewardCoupon) => {
    try {
      const res = await fetch('/api/profile/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointsCost: coupon.pointsCost }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully redeemed! Use Coupon Code: ${coupon.code}`);
        fetchInitialData();
      } else {
        alert(data.error || 'Failed to redeem.');
      }
    } catch (err) {
      console.error('Coupon redemption failure:', err);
    }
  };

  // Filter listings
  const filteredListings = listings.filter(item => {
    if (item.status !== 'available') return false;
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                          item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesDiet = dietFilter === 'all' || item.dietType === dietFilter;
    return matchesSearch && matchesCat && matchesDiet;
  });

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xl h-full flex flex-col font-sans relative">
      {/* Top Mobile Bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 text-white w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-600/10">
            SP
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
              SharePlate
              <span className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">SOCIETY BETA</span>
            </h1>
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-600" /> Greenwood Heights Resident Pool
            </p>
          </div>
        </div>

        {/* Mini profile header */}
        {profile && (
          <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
            <img src={profile.avatar} alt="User Avatar" className="w-6 h-6 rounded-full object-cover border border-emerald-500" />
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-800 leading-none">{profile.name}</p>
              <p className="text-[9px] text-emerald-600 font-mono font-semibold leading-none mt-0.5">{profile.greenPoints} Green Pts</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Container Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50">
        
        {/* Navigation Tabs bar inside app */}
        <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200 w-full max-w-md shadow-sm">
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
              activeTab === 'discover'
                ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/10'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Discover Food
          </button>
          <button
            onClick={() => setActiveTab('impact')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
              activeTab === 'impact'
                ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/10'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            My Impact
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
              activeTab === 'community'
                ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/10'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Discussions
          </button>
        </div>

        {/* DISCOVER TAB */}
        {activeTab === 'discover' && (
          <div className="space-y-6">
            
            {/* Active Lock Notification */}
            {activeReservation && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm"
              >
                <div className="space-y-1">
                  <span className="bg-emerald-600 text-white text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">ACTIVE BOOKING</span>
                  <h3 className="text-base font-bold text-slate-900">Claiming: {activeReservation.listing.title}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    Pickup from: <strong className="text-slate-800">{activeReservation.listing.pickupLocation}</strong>
                  </p>
                  <p className="text-xs font-mono text-emerald-700">YOUR VERIFICATION OTP: <strong className="text-slate-900 text-sm bg-white px-2 py-0.5 rounded ml-1 border border-emerald-200 shadow-sm">{activeReservation.reservation.otp}</strong></p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter verification OTP"
                      value={verifyOtpInput}
                      onChange={(e) => setVerifyOtpInput(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono w-32 focus:border-emerald-500 outline-none shadow-sm"
                    />
                    <button
                      onClick={handleConfirmPickup}
                      className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      Verify Claim
                    </button>
                  </div>
                  <button
                    onClick={handleCancelReservation}
                    className="text-xs text-slate-500 hover:text-red-600 font-medium px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                {otpError && <p className="text-xs text-red-500 w-full font-mono mt-1">{otpError}</p>}
              </motion.div>
            )}

            {/* Smart Search & Filters */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                  <input
                    type="text"
                    placeholder="Search fresh meals, sweets, fresh veggies..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
                  />
                </div>
                
                <button
                  onClick={() => setShowAddListing(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors duration-150 flex items-center gap-2 shadow-md shadow-emerald-600/10 justify-center h-10 cursor-pointer text-center"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  Post Extra Food
                </button>
              </div>

              {/* Categorical Tabs */}
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
                {['all', 'meals', 'bakery', 'fruits-veg', 'sweets', 'packaged'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium border capitalize transition-all duration-150 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {cat === 'all' ? 'All Foods' : cat.replace('-', ' ')}
                  </button>
                ))}
              </div>

              {/* Dietary Fast Filters */}
              <div className="flex gap-2">
                {['all', 'veg', 'vegan', 'jain'].map((diet) => (
                  <button
                    key={diet}
                    onClick={() => setDietFilter(diet)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-all duration-150 border cursor-pointer ${
                      dietFilter === diet
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {diet === 'all' ? 'All Diets' : `#${diet.toUpperCase()}`}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Zero-Waste Smart Recipe Tool */}
            <div className="bg-gradient-to-r from-emerald-50/50 to-white border border-emerald-100 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    SharePlate AI Recipe Coach
                  </h3>
                  <p className="text-xs text-slate-500">
                    Our AI scans currently active listings of Greenwood and recommends creative home recipes!
                  </p>
                </div>
                <button
                  onClick={handleGenerateRecipe}
                  disabled={isRecipeLoading || listings.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRecipeLoading ? 'animate-spin' : ''}`} />
                  {isRecipeLoading ? 'Drafting...' : 'Recommend Recipes'}
                </button>
              </div>

              {aiRecipe && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-2 font-mono text-slate-700"
                >
                  <div className="flex justify-between">
                    <span className="text-emerald-700 font-bold uppercase tracking-wider">{aiRecipe.recipeName}</span>
                    <span className="text-slate-400 font-bold">Prep: {aiRecipe.prepTime}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-2.5 rounded border border-slate-100">
                    {aiRecipe.instructions}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Grid of Listings */}
            {filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((item) => (
                  <motion.div
                    key={item.id}
                    layoutId={`listing_${item.id}`}
                    onClick={() => setSelectedItem(item)}
                    className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col group h-full shadow-sm"
                  >
                    <div className="relative aspect-video overflow-hidden bg-slate-100">
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className={`absolute top-3 left-3 text-[10px] font-bold font-mono px-2.5 py-1 rounded-full shadow-md ${
                        item.dietType === 'veg' ? 'bg-emerald-500 text-white' :
                        item.dietType === 'vegan' ? 'bg-emerald-600 text-white' :
                        item.dietType === 'jain' ? 'bg-orange-500 text-white' :
                        'bg-red-500 text-white'
                      }`}>
                        {item.dietType.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex justify-between items-start mb-1.5">
                          <h3 className="font-bold text-slate-800 text-sm tracking-tight line-clamp-1 group-hover:text-emerald-600 transition-colors">
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          Exp: {new Date(item.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-600 text-[10px] capitalize">
                          {item.category.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500 bg-white">
                <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                <p className="text-sm font-medium text-slate-600">No surplus food available matching your criteria</p>
                <p className="text-xs text-slate-400 mt-1">Be the first to list surplus home-cooked meals inside your tower block!</p>
              </div>
            )}
          </div>
        )}

        {/* MY IMPACT / REDEEM REWARDS TAB */}
        {activeTab === 'impact' && (
          <div className="space-y-8 animate-fade-in">
            {profile && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Visual score */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl p-6 shadow-md space-y-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold font-mono tracking-wider bg-white/15 px-2 py-0.5 rounded">COMMUNITY RATING</span>
                    <h2 className="text-4xl font-extrabold font-sans mt-2">{profile.greenPoints}</h2>
                    <p className="text-xs font-semibold text-emerald-100 font-mono mt-0.5">Ecological Green Points Earned</p>
                  </div>
                  <div className="text-xs text-emerald-50">
                    Saved <strong className="text-white">{profile.impact.mealsSaved} healthy meals</strong> from organic wastage!
                  </div>
                </div>

                {/* carbon metric card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-md">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold font-mono text-emerald-600">CARBON FOOTPRINT REDUCTION</span>
                    <h2 className="text-3xl font-extrabold text-slate-800 mt-2">{profile.impact.co2SavedKg.toFixed(1)} Kg</h2>
                    <p className="text-xs text-slate-500">Net CO₂ Greenhouse Gas Avoided</p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono italic mt-4 border-t border-slate-100 pt-3">
                    Equivalent to planting { (profile.impact.co2SavedKg / 2.0).toFixed(1) } medium evergreen high-rise trees!
                  </p>
                </div>

                {/* Rep points */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-md">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold font-mono text-emerald-600">REPUTATION RATING</span>
                    <h2 className="text-3xl font-extrabold text-slate-800 mt-2">{profile.reputationScore}%</h2>
                    <p className="text-xs text-slate-500">High-Safety Trust Badge Level</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-200 w-max mt-4 font-bold">
                    ● CERTIFIED RESIDENT
                  </span>
                </div>
              </div>
            )}

            {/* REDEEM COUPONS LEDGER */}
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  Redeem Rewards Points Catalog
                </h3>
                <p className="text-xs text-slate-500">Convert your ecological goodwill into local groceries, dining discount vouchers, or NGO meal sponsorships</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rewards.map((reward) => (
                  <div key={reward.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex gap-3">
                      <span className="text-3xl">{reward.logo}</span>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 text-xs">{reward.title}</h4>
                        <p className="text-[10px] text-slate-400">{reward.description}</p>
                        <p className="text-[9px] text-emerald-600 font-mono font-bold uppercase tracking-wider">{reward.providerName}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRedeemCoupon(reward)}
                      disabled={profile ? profile.greenPoints < reward.pointsCost : true}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 text-slate-700 font-mono text-[10px] font-bold py-2 rounded-lg transition-all disabled:opacity-30 disabled:border-slate-100 disabled:text-slate-400 cursor-pointer"
                    >
                      Redeem for {reward.pointsCost} Pts
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DISCUSSIONS TAB */}
        {activeTab === 'community' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            
            {/* Thread Creator */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 h-max shadow-sm">
              <h3 className="text-sm font-bold text-slate-800">Create a Community Post</h3>
              <form onSubmit={handleCreatePost} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Post Topic</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Storing ripe papayas, surplus cake"
                    value={discTitle}
                    onChange={(e) => setDiscTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 outline-none focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Category</label>
                  <select
                    value={discCat}
                    onChange={(e) => setDiscCat(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 outline-none focus:bg-white"
                  >
                    <option value="tips">Cooking Tips & Hacks</option>
                    <option value="recipe">Recipe Ideas</option>
                    <option value="sustainability">Sustainability Challenge</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Body Content</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe cooking techniques, surplus warnings, or zero-waste schedules..."
                    value={discContent}
                    onChange={(e) => setDiscContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 text-xs focus:border-emerald-500 outline-none resize-none focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Publish Post
                </button>
              </form>
            </div>

            {/* Forums Stream */}
            <div className="lg:col-span-7 space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Greenwood Resident Discussions
                </h3>
              </div>

              {discussions.map((post) => (
                <div key={post.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <img src={post.authorAvatar} alt="author" className="w-6 h-6 rounded-full object-cover border border-slate-100" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{post.authorName}</h4>
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100/30 text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold">
                          {post.category}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm leading-snug">{post.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* OVERLAY DETAILS VIEW DRAWER (WITH REAL-TIME GEMINI RUN ENGINE) */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-20 p-4 md:p-8 overflow-y-auto flex justify-center items-start"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl mt-4"
            >
              <div className="relative aspect-video bg-slate-100">
                <img src={selectedItem.images[0]} alt={selectedItem.title} className="w-full h-full object-cover" />
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 bg-white/90 text-slate-800 hover:text-red-500 p-2 rounded-full border border-slate-200 transition-colors shadow-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full">
                      # {selectedItem.dietType.toUpperCase()}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-bold px-2.5 py-0.5 rounded-full capitalize">
                      {selectedItem.category.replace('-', ' ')}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">{selectedItem.title}</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">{selectedItem.description}</p>
                </div>

                {/* Specs list */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block font-mono text-[9px] uppercase tracking-wider font-bold">AVAILABLE PORTION</span>
                    <strong className="text-slate-800 font-bold">{selectedItem.quantity}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-mono text-[9px] uppercase tracking-wider font-bold">PREPARATION SHELF LIFE</span>
                    <strong className="text-slate-800 font-bold">Expires in {Math.round((new Date(selectedItem.expiryTime).getTime() - Date.now()) / 3600000)} hrs</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-mono text-[9px] uppercase tracking-wider font-bold">PICKUP GATEWAY</span>
                    <strong className="text-emerald-700 font-bold">{selectedItem.pickupLocation}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-mono text-[9px] uppercase tracking-wider font-bold">STORAGE REQUIREMENTS</span>
                    <strong className="text-slate-800 font-bold">{selectedItem.storageInstructions}</strong>
                  </div>
                </div>

                {/* AI INTELLIGENCE SYSTEM INTEGRATION */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3.5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Gemini Food Safety & Intelligence Report
                    </h3>
                    {!selectedItem.aiAnalysis && (
                      <button
                        onClick={() => handleAiScan(selectedItem)}
                        disabled={isAiLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-mono text-[10px] px-2.5 py-1 rounded transition-colors cursor-pointer"
                      >
                        {isAiLoading ? 'Analyzing...' : 'Run Safety Scan'}
                      </button>
                    )}
                  </div>

                  {selectedItem.aiAnalysis ? (
                    <div className="space-y-3 text-xs leading-relaxed font-mono">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Estimated Freshness:</span>
                        <p className="text-emerald-700 font-bold mt-0.5">{selectedItem.aiAnalysis.estimatedFreshness}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Extracted Ingredients:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedItem.aiAnalysis.suggestedIngredients.map((ing, i) => (
                            <span key={i} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] shadow-xs">
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Food Safety Warnings / Allergens:</span>
                        <p className="text-red-600 font-semibold mt-0.5">{selectedItem.aiAnalysis.foodSafetyCheck}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 font-mono italic">
                      Click Safety Scan to run real Gemini LLM ingredients and allergen auditing.
                    </div>
                  )}
                </div>

                {/* Primary claim buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReserve(selectedItem)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10"
                  >
                    Reserve Surplus Food
                  </button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm px-5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE NEW LISTING POPUP DRAWER */}
      <AnimatePresence>
        {showAddListing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-20 p-4 md:p-8 overflow-y-auto flex justify-center items-start"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl mt-4 p-6 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                  <PlusCircle className="w-5 h-5 text-emerald-600" /> List Excess Surplus Food
                </h2>
                <button
                  onClick={() => setShowAddListing(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateListingSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Food Title</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. Roasted Garlic Pasta, Veg Biryani"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 outline-none focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Portion Quantity</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. 3 large boxes, 4 bowls"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 outline-none focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Servings</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newServings}
                      onChange={(e) => setNewServings(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 outline-none focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Expiry (Hours)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newExpiry}
                      onChange={(e) => setNewExpiry(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 outline-none focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Category</label>
                    <select
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2 py-2 text-xs focus:border-emerald-500 outline-none focus:bg-white"
                    >
                      <option value="meals">Meals</option>
                      <option value="bakery">Bakery</option>
                      <option value="fruits-veg">Produce</option>
                      <option value="sweets">Sweets</option>
                    </select>
                  </div>
                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Dietary Tag</label>
                    <select
                      value={newDiet}
                      onChange={(e) => setNewDiet(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2 py-2 text-xs focus:border-emerald-500 outline-none focus:bg-white"
                    >
                      <option value="veg">VEG</option>
                      <option value="vegan">VEGAN</option>
                      <option value="jain">JAIN</option>
                      <option value="non-veg">NON-VEG</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Description & Ingredients</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="E.g. Eggless banana bread, contains flour, nuts. Prepared under strict hygienic environment."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 text-xs focus:border-emerald-500 outline-none resize-none focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Allergens (Comma-separated)</label>
                    <input
                      type="text"
                      placeholder="E.g. Gluten, nuts, dairy"
                      value={newAllergens}
                      onChange={(e) => setNewAllergens(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 outline-none focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Storage Requirements</label>
                    <input
                      type="text"
                      placeholder="E.g. Keep refrigerated, air-tight box"
                      value={newInstructions}
                      onChange={(e) => setNewInstructions(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 outline-none focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm py-3 rounded-xl transition-colors cursor-pointer shadow-md shadow-emerald-600/10"
                  >
                    Submit Surplus Listing
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddListing(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm px-5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
