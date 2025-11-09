"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, X, Calculator, Info, Sparkles, GitCompare } from "lucide-react";
import vehicleData from "@/data/toyota-vehicles.json";
import { loadUserProfile, getCurrentUserId } from "@/utils/userProfile";
import { getMatchingVehicles, CompatibilityResult } from "@/utils/compatibility";
import { getCreditScore, getAPRFromCreditScore, getCreditScoreTier } from "@/utils/creditScore";
import { CircularScore } from "@/components/CircularScore";
import { quizAnswersToProfile, QuizAnswers } from "@/utils/quizToProfile";
import { loadAllVehicleData } from "@/utils/loadVehicleData";
import { InventoryChatbot } from "@/components/InventoryChatbot";
import { analyzeVehicleReviews } from "@/utils/sentimentAnalysis";
import { TrendingUp, TrendingDown, Star, MessageSquare } from "lucide-react";

interface Vehicle {
  id: number;
  name: string;
  trim: string;
  year: number;
  price: number;
  bodyType: string;
  fuelType: string;
  mpg: string;
  mpgCity?: number;
  mpgHighway?: number;
  features: string[];
  image: string;
  drivetrain: string;
  cargoSpace: string;
  electricRange?: string;
  seats?: number;
  keyFeatures?: string[];
  colors?: string[];
  // Detailed features from 2025 JSON files
  horsepower?: number;
  engine?: string;
  transmission?: string;
  safetyFeatures?: string[];
  exteriorFeatures?: string[];
  interiorFeatures?: string[];
  audioMultimedia?: {
    systemName?: string;
    display?: string;
    features?: string[];
  };
  packages?: Array<{
    packageName: string;
    contents: string[];
  }>;
  connectedServices?: string[];
}

interface Filters {
  priceRange: [number, number];
  fuelType: string[];
  bodyType: string[];
}

export default function InventoryPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(vehicleData as Vehicle[]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>(vehicleData as Vehicle[]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [compatibilityScores, setCompatibilityScores] = useState<Map<number, number>>(new Map());
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [sentimentAnalysis, setSentimentAnalysis] = useState<any>(null);
  const [reviewsData, setReviewsData] = useState<any[]>([]);
  const [filters, setFilters] = useState<Filters>({
    priceRange: [0, 80000],
    fuelType: [],
    bodyType: [],
  });
  const [expandedFilters, setExpandedFilters] = useState({
    price: true,
    fuelType: true,
    bodyType: true,
  });
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [compareVehicles, setCompareVehicles] = useState<Vehicle[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [calculatorInputs, setCalculatorInputs] = useState({
    downPayment: "",
    apr: "",
    term: "",
    type: "finance" as "finance" | "lease",
  });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [apr, setApr] = useState<number | null>(null);

  // Get quiz preferences from URL
  const [quizPreferences, setQuizPreferences] = useState<any>({});

  // Load new vehicle data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const newVehicles = await loadAllVehicleData();
        // Merge with toyota-vehicles.json data
        const existingVehicles = vehicleData as Vehicle[];
        
        // Create a map of vehicles from 2025 files (these have detailed fields)
        const newVehiclesMap = new Map<string, Vehicle>();
        newVehicles.forEach(v => {
          const key = `${v.name}-${v.trim}-${v.year}`;
          newVehiclesMap.set(key, v);
        });
        
        // Combine: use 2025 vehicles when available, otherwise use toyota-vehicles.json
        const unique: Vehicle[] = [];
        const seen = new Set<string>();
        
        // First, add all vehicles from 2025 files (these have detailed fields)
        newVehicles.forEach(v => {
          const key = `${v.name}-${v.trim}-${v.year}`;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(v);
          }
        });
        
        // Then, add vehicles from toyota-vehicles.json only if they don't exist in 2025 files
        existingVehicles.forEach(v => {
          const key = `${v.name}-${v.trim}-${v.year}`;
          if (!seen.has(key)) {
            seen.add(key);
            // Vehicle only exists in toyota-vehicles.json (not in 2025 files), add it as-is
            unique.push(v);
          }
        });
        // Ensure all vehicles have unique IDs using hash of name+trim+year
        const vehiclesWithUniqueIds = unique.map((v, idx) => {
          // Create a unique ID based on vehicle properties
          const idString = `${v.name}-${v.trim}-${v.year}`;
          let hashId = 0;
          for (let i = 0; i < idString.length; i++) {
            const char = idString.charCodeAt(i);
            hashId = ((hashId << 5) - hashId) + char;
            hashId = hashId & hashId; // Convert to 32bit integer
          }
          // Ensure positive ID
          const uniqueId = Math.abs(hashId) || (10000 + idx);
          return {
            ...v,
            id: uniqueId
          };
        });
        console.log(`Loaded ${vehiclesWithUniqueIds.length} vehicles`);
        setVehicles(vehiclesWithUniqueIds);
        setFilteredVehicles(vehiclesWithUniqueIds);
      } catch (error) {
        console.error("Error loading vehicle data:", error);
        setVehicles([]); // Set empty array instead of falling back to toyota-vehicles.json
        setFilteredVehicles([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    // Load reviews data
    const loadReviews = async () => {
      try {
        const response = await fetch("/data/toyota_reviews.json");
        if (!response.ok) throw new Error("Failed to fetch reviews");
        const text = await response.text();
        // Remove the "@" prefix if present and parse JSON
        const cleanedText = text.trim().startsWith("@") ? text.trim().substring(1) : text.trim();
        const reviews = JSON.parse(cleanedText);
        setReviewsData(Array.isArray(reviews) ? reviews : []);
      } catch (error) {
        console.error("Error loading reviews data:", error);
        // Try alternative import method
        try {
          const reviewsModule = await import("@/data/toyota_reviews.json");
          let reviews = reviewsModule.default || reviewsModule;
          if (typeof reviews === "string") {
            const cleanedText = reviews.startsWith("@") ? reviews.substring(1) : reviews;
            reviews = JSON.parse(cleanedText);
          }
          setReviewsData(Array.isArray(reviews) ? reviews : []);
        } catch (fallbackError) {
          console.error("Fallback import also failed:", fallbackError);
          setReviewsData([]);
        }
      }
    };

    loadData();
    loadReviews();
  }, []);

  useEffect(() => {
    // Wait for vehicles to be loaded before processing quiz data
    if (isLoadingData || vehicles.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const newFilters: Filters = {
      priceRange: [0, 80000],
      fuelType: [],
      bodyType: [],
    };

    const prefs: any = {};
    params.getAll("fuelType").forEach((ft) => {
      if (!newFilters.fuelType.includes(ft)) newFilters.fuelType.push(ft);
      if (!prefs.fuelType) prefs.fuelType = [];
      prefs.fuelType.push(ft);
    });
    params.getAll("bodyType").forEach((bt) => {
      if (!newFilters.bodyType.includes(bt)) newFilters.bodyType.push(bt);
      if (!prefs.bodyType) prefs.bodyType = [];
      prefs.bodyType.push(bt);
    });

    const maxBudget = params.get("maxBudget");
    if (maxBudget) {
      prefs.maxBudget = parseInt(maxBudget);
      const maxPrice = parseInt(maxBudget);
      // Add 20% buffer to budget filter to show vehicles slightly above budget
      // This gives users options even if they're slightly over their ideal budget
      const budgetWithBuffer = Math.floor(maxPrice * 1.2);
      newFilters.priceRange[1] = Math.min(budgetWithBuffer, 80000);
      newFilters.priceRange[0] = 0;
      console.log(`Budget filter: maxBudget=${maxPrice}, with buffer=${budgetWithBuffer}`);
    }

    const drivingType = params.get("drivingType");
    if (drivingType) prefs.drivingType = drivingType;

    const priority = params.get("priority");
    if (priority) prefs.priority = priority;

    const paymentType = params.get("paymentType");
    if (paymentType) prefs.paymentType = paymentType;

    // Apply quiz-based filters
    const vehicleType = params.get("vehicleType");
    if (vehicleType) {
      // Map quiz vehicle types to body types
      const typeMap: { [key: string]: string } = {
        "Sedan": "Sedan",
        "SUV": "SUV",
        "Truck": "Truck",
        "Minivan": "Minivan",
        "Coupe": "Coupe",
        "Hatchback": "Hatchback",
      };
      if (typeMap[vehicleType] && !newFilters.bodyType.includes(typeMap[vehicleType])) {
        newFilters.bodyType.push(typeMap[vehicleType]);
      }
    }

    const fuelPreference = params.get("fuelPreference");
    if (fuelPreference && fuelPreference !== "No Preference") {
      // Map quiz fuel preferences to fuel types
      const fuelMap: { [key: string]: string } = {
        "Gas": "Gas",
        "Hybrid": "Hybrid",
        "Electric": "Electric",
        "Plug-in Hybrid": "Plug-in Hybrid",
      };
      if (fuelMap[fuelPreference] && !newFilters.fuelType.includes(fuelMap[fuelPreference])) {
        newFilters.fuelType.push(fuelMap[fuelPreference]);
      }
    }

    setQuizPreferences(prefs);
    setFilters(newFilters);

    // Check if coming from quiz
    const fromQuiz = params.get("fromQuiz") === "true";
    const sortBy = params.get("sortBy");
    
    if (fromQuiz && sortBy === "compatibility") {
      // Convert quiz answers to profile format
      const quizAnswers: QuizAnswers = {
        vehicleType: params.get("vehicleType") || undefined,
        fuelPreference: params.get("fuelPreference") || undefined,
        passengerSize: params.get("passengerSize") || undefined,
        paymentPlan: params.get("paymentPlan") || undefined,
        drivingStyle: params.get("drivingStyle") || undefined,
        vehicleUsage: params.get("vehicleUsage") || undefined,
        budget: params.get("maxBudget") ? 
          (parseInt(params.get("maxBudget")!) <= 25000 ? "Under $25,000" :
           parseInt(params.get("maxBudget")!) <= 35000 ? "$25,000 - $35,000" :
           parseInt(params.get("maxBudget")!) <= 45000 ? "$35,000 - $45,000" :
           parseInt(params.get("maxBudget")!) <= 60000 ? "$45,000 - $60,000" :
           "Over $60,000") : undefined,
        topPriorities: params.getAll("topPriorities"),
        features: params.getAll("features"),
        mustHaveFeatures: params.getAll("mustHaveFeatures"),
      };
      
      const quizProfile = quizAnswersToProfile(quizAnswers);
      
          // Calculate compatibility scores from quiz
          setIsLoadingScores(true);
          setTimeout(() => {
            const matches = getMatchingVehicles(quizProfile as any, vehicles);
            const scoreMap = new Map<number, number>();
        matches.forEach((match) => {
          scoreMap.set(match.vehicle.id, match.score);
        });
        setCompatibilityScores(scoreMap);
        
        // Sort vehicles by compatibility score (highest first)
        const sortedVehicles = [...vehicles].sort((a, b) => {
          const scoreA = scoreMap.get(a.id) || 0;
          const scoreB = scoreMap.get(b.id) || 0;
          return scoreB - scoreA; // Highest first
        });
        setVehicles(sortedVehicles);
        setFilteredVehicles(sortedVehicles); // Also update filtered vehicles
        setIsLoadingScores(false);
      }, 1500);
    } else {
      // Load user profile and credit score (existing flow)
      const userId = params.get("userId") || getCurrentUserId();
      loadUserProfile(userId).then((profile) => {
        if (profile) {
          setUserProfile(profile);
          
          // Calculate credit score and APR from SSN placeholder
          if (profile.ssn_placeholder) {
            const score = getCreditScore(profile.ssn_placeholder);
            const calculatedApr = getAPRFromCreditScore(score);
            setCreditScore(score);
            setApr(calculatedApr);
          }
          
              // Load compatibility scores if sortBy=compatibility
              if (sortBy === "compatibility") {
                setIsLoadingScores(true);
                setTimeout(() => {
                  const matches = getMatchingVehicles(profile, vehicles);
                  const scoreMap = new Map<number, number>();
              matches.forEach((match) => {
                scoreMap.set(match.vehicle.id, match.score);
              });
              setCompatibilityScores(scoreMap);
              
              // Sort vehicles by compatibility score (highest first)
              const sortedVehicles = [...vehicles].sort((a, b) => {
                const scoreA = scoreMap.get(a.id) || 0;
                const scoreB = scoreMap.get(b.id) || 0;
                return scoreB - scoreA; // Highest first
              });
              setVehicles(sortedVehicles);
              setIsLoadingScores(false);
            }, 1000);
          }
        }
      }).catch((error) => {
        console.error("Error loading user profile:", error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingData, vehicles.length]);

  // Trigger sentiment analysis when modal opens with a vehicle
  useEffect(() => {
    if (showVehicleModal && selectedVehicle && reviewsData.length > 0) {
      const analysis = analyzeVehicleReviews(selectedVehicle.name, reviewsData as any);
      setSentimentAnalysis(analysis);
    } else if (showVehicleModal && selectedVehicle && reviewsData.length === 0) {
      // If reviews aren't loaded yet, wait and try again
      const timeout = setTimeout(() => {
        if (reviewsData.length > 0 && selectedVehicle) {
          const analysis = analyzeVehicleReviews(selectedVehicle.name, reviewsData as any);
          setSentimentAnalysis(analysis);
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [showVehicleModal, selectedVehicle, reviewsData]);

  // Auto-fill calculator inputs when profile/credit score loads
  useEffect(() => {
    if (userProfile && apr) {
      setCalculatorInputs((prev) => ({
        ...prev,
        apr: prev.apr || (apr * 100).toFixed(1), // Auto-fill APR if not manually set
        downPayment: prev.downPayment || userProfile.down_payment?.replace(/[^0-9.]/g, "") || "",
        term: prev.term || userProfile.loan_term_preference || "",
      }));
    }
  }, [userProfile, apr]);

  useEffect(() => {
    // Don't filter if vehicles aren't loaded yet
    if (vehicles.length === 0) return;

    let filtered = [...vehicles];

    filtered = filtered.filter(
      (v) => v.price >= filters.priceRange[0] && v.price <= filters.priceRange[1]
    );

    if (filters.fuelType.length > 0) {
      filtered = filtered.filter((v) => filters.fuelType.includes(v.fuelType));
    }

    if (filters.bodyType.length > 0) {
      filtered = filtered.filter((v) => filters.bodyType.includes(v.bodyType));
    }


    // Sort by compatibility if scores are available
    if (compatibilityScores.size > 0) {
      filtered.sort((a, b) => {
        const scoreA = compatibilityScores.get(a.id) || 0;
        const scoreB = compatibilityScores.get(b.id) || 0;
        return scoreB - scoreA; // Highest first
      });
    }

    console.log(`Filtered to ${filtered.length} vehicles`);
    setFilteredVehicles(filtered);
  }, [filters, vehicles, compatibilityScores]);

  const minPrice = 0;
  const maxPrice = 80000;

  const fuelTypes = ["Gas", "Hybrid", "Plug-in Hybrid", "EV"];
  const bodyTypes = ["Sedan", "SUV", "Truck", "Coupe", "Van", "Hatchback"];

  // Algorithm-based match score (only shown after quiz)
  const calculateMatchScore = (vehicle: Vehicle): number => {
    if (Object.keys(quizPreferences).length === 0) return 0;

    let score = 50; // Base score

    // Fuel type match
    if (quizPreferences.fuelType && quizPreferences.fuelType.includes(vehicle.fuelType)) {
      score += 20;
    }

    // Body type match
    if (quizPreferences.bodyType && quizPreferences.bodyType.includes(vehicle.bodyType)) {
      score += 15;
    }

    // Budget match
    if (quizPreferences.maxBudget) {
      const estimatedPrice = quizPreferences.maxBudget * 60;
      const priceDiff = Math.abs(vehicle.price - estimatedPrice);
      const priceScore = Math.max(0, 15 - (priceDiff / estimatedPrice) * 15);
      score += priceScore;
    }

    // Priority match
    if (quizPreferences.priority === "fuel" && (vehicle.fuelType === "Hybrid" || vehicle.fuelType === "Plug-in Hybrid" || vehicle.fuelType === "EV")) {
      score += 10;
    } else if (quizPreferences.priority === "performance" && (vehicle.name.includes("GR") || vehicle.name.includes("TRD"))) {
      score += 10;
    } else if (quizPreferences.priority === "comfort" && (vehicle.trim.includes("XLE") || vehicle.trim.includes("Platinum") || vehicle.trim.includes("Limited"))) {
      score += 10;
    }

    // Driving type match
    if (quizPreferences.drivingType === "city" && (vehicle.fuelType === "Hybrid" || vehicle.fuelType === "Plug-in Hybrid" || vehicle.fuelType === "EV")) {
      score += 5;
    }

    // Return score with 1 decimal place for realistic variation
    return Math.min(100, Math.round(score * 10) / 10);
  };

  const calculateMonthlyPayment = (vehicle: Vehicle) => {
    const downPayment = parseFloat(calculatorInputs.downPayment) || 0;
    // Use credit score APR if available, otherwise use manual input
    const aprValue = calculatorInputs.apr ? parseFloat(calculatorInputs.apr) : (apr ? apr * 100 : 0);
    const term = parseFloat(calculatorInputs.term) || (userProfile?.loan_term_preference ? parseFloat(userProfile.loan_term_preference) : 60);
    const principal = vehicle.price - downPayment;
    const monthlyRate = aprValue / 100 / 12;

    if (calculatorInputs.type === "lease") {
      const residualValue = vehicle.price * 0.6;
      const leaseAmount = vehicle.price - residualValue;
      const monthlyPayment = (leaseAmount / term) + (vehicle.price * 0.001);
      return Math.round(monthlyPayment);
    } else {
      if (monthlyRate === 0) return Math.round(principal / term);
      const monthlyPayment =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) /
        (Math.pow(1 + monthlyRate, term) - 1);
      return Math.round(monthlyPayment);
    }
  };

  const calculateEnvironmentalSavings = (vehicle: Vehicle) => {
    const mpg = vehicle.mpgCity || 0;
    const annualMiles = 12000;
    const gasPrice = 3.50;
    const co2PerGallon = 19.6;

    if (vehicle.fuelType === "EV") {
      return {
        annualSavings: 1200,
        co2Reduction: 4800,
        yearsToBreakEven: 0,
      };
    } else if (vehicle.fuelType === "Hybrid" || vehicle.fuelType === "Plug-in Hybrid") {
      const hybridMpg = mpg;
      const gasMpg = 25;
      const hybridGallons = annualMiles / hybridMpg;
      const gasGallons = annualMiles / gasMpg;
      const savings = (gasGallons - hybridGallons) * gasPrice;
      return {
        annualSavings: Math.round(savings),
        co2Reduction: Math.round((gasGallons - hybridGallons) * co2PerGallon),
        yearsToBreakEven: Math.round((vehicle.price - 25000) / savings),
      };
    }
    return {
      annualSavings: 0,
      co2Reduction: 0,
      yearsToBreakEven: 0,
    };
  };

  const toggleFilter = (category: "fuelType" | "bodyType", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((v) => v !== value)
        : [...prev[category], value],
    }));
  };

  const toggleCompare = (vehicle: Vehicle) => {
    setCompareVehicles((prev) => {
      if (prev.some((v) => v.id === vehicle.id)) {
        return prev.filter((v) => v.id !== vehicle.id);
      } else if (prev.length < 3) {
        return [...prev, vehicle];
      }
      return prev;
    });
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3 text-white">
                <Sparkles className="w-8 h-8 text-white/70" />
                Available Models
              </h1>
              <p className="text-white/60 text-sm">
                Refine filters to find your perfect Toyota. <span className="font-semibold text-white">{filteredVehicles.length} vehicles</span> available
              </p>
            </div>
            <div className="flex items-center gap-4">
              {compareVehicles.length > 0 && (
                <button
                  onClick={() => setShowCompareModal(true)}
                  className="px-4 py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 transition-all flex items-center gap-2"
                >
                  <GitCompare className="w-4 h-4" />
                  Compare ({compareVehicles.length})
                </button>
              )}
              <select className="px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer">
                <option className="text-black">Sort by: Featured</option>
                <option className="text-black">Price: Low to High</option>
                <option className="text-black">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-10 bg-[#1a1a1a] min-h-screen">
        {/* Sidebar Filters */}
        <aside className="w-80 flex-shrink-0">
          <div className="bg-[#2a2a2a] rounded-lg p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto hover:overflow-y-auto shadow-sm border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-2">Inventory</h2>
            <p className="text-sm text-white/60 mb-6">Browse our full inventory</p>
            <div className="space-y-6">
              {/* Price Filter */}
              <div className="border-b border-white/10 pb-6">
                <button
                  onClick={() =>
                    setExpandedFilters((prev) => ({ ...prev, price: !prev.price }))
                  }
                  className="w-full flex items-center justify-between text-base font-bold text-white mb-4 hover:text-white/80 transition-colors"
                >
                  Price Range
                  {expandedFilters.price ? (
                    <ChevronUp className="w-4 h-4 text-white/60" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/60" />
                  )}
                </button>
                {expandedFilters.price && (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-white/70">
                      <span>${filters.priceRange[0].toLocaleString()}</span>
                      <span>${filters.priceRange[1].toLocaleString()}</span>
                    </div>
                    <div className="relative h-2 bg-white/10 rounded-full">
                      <div
                        className="absolute h-2 bg-white/30 rounded-full"
                        style={{
                          left: `${(filters.priceRange[0] / maxPrice) * 100}%`,
                          width: `${((filters.priceRange[1] - filters.priceRange[0]) / maxPrice) * 100}%`,
                        }}
                      />
                      <input
                        type="range"
                        min={minPrice}
                        max={maxPrice}
                        value={filters.priceRange[0]}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            priceRange: [Math.min(parseInt(e.target.value), prev.priceRange[1] - 1000), prev.priceRange[1]],
                          }))
                        }
                        className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer"
                        style={{
                          background: 'transparent',
                        }}
                        style={{
                          zIndex: filters.priceRange[0] > filters.priceRange[1] - 1000 ? 2 : 1,
                        }}
                      />
                      <input
                        type="range"
                        min={minPrice}
                        max={maxPrice}
                        value={filters.priceRange[1]}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            priceRange: [prev.priceRange[0], Math.max(parseInt(e.target.value), prev.priceRange[0] + 1000)],
                          }))
                        }
                        className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer"
                        style={{
                          background: 'transparent',
                        }}
                        style={{ zIndex: 2 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Fuel Type Filter */}
              <div className="border-b border-white/10 pb-6">
                <button
                  onClick={() =>
                    setExpandedFilters((prev) => ({ ...prev, fuelType: !prev.fuelType }))
                  }
                  className="w-full flex items-center justify-between text-base font-bold text-white mb-4 hover:text-white/80 transition-colors"
                >
                  Fuel Type
                  {expandedFilters.fuelType ? (
                    <ChevronUp className="w-4 h-4 text-white/60" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/60" />
                  )}
                </button>
                {expandedFilters.fuelType && (
                  <div className="space-y-2">
                    {fuelTypes.map((type) => (
                      <label key={type} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="fuelType"
                          checked={filters.fuelType.length === 1 && filters.fuelType[0] === type}
                          onChange={() => setFilters((prev) => ({ ...prev, fuelType: [type] }))}
                          className="w-4 h-4 text-white border-white/30 focus:ring-white/50 cursor-pointer"
                        />
                        <span className="text-sm text-white/80 group-hover:text-white">{type}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Body Type Filter */}
              <div className="border-b border-white/10 pb-6">
                <button
                  onClick={() =>
                    setExpandedFilters((prev) => ({ ...prev, bodyType: !prev.bodyType }))
                  }
                  className="w-full flex items-center justify-between text-base font-bold text-white mb-4 hover:text-white/80 transition-colors"
                >
                  Body Type
                  {expandedFilters.bodyType ? (
                    <ChevronUp className="w-4 h-4 text-white/60" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/60" />
                  )}
                </button>
                {expandedFilters.bodyType && (
                  <div className="space-y-2">
                    {bodyTypes.map((type) => (
                      <label key={type} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="bodyType"
                          checked={filters.bodyType.length === 1 && filters.bodyType[0] === type}
                          onChange={() => setFilters((prev) => ({ ...prev, bodyType: [type] }))}
                          className="w-4 h-4 text-white border-white/30 focus:ring-white/50 cursor-pointer"
                        />
                        <span className="text-sm text-white/80 group-hover:text-white">{type}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </aside>

        {/* Vehicle Grid */}
        <main className="flex-1">
          {isLoadingData || isLoadingScores ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Finding the right car for you...</p>
              </div>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-20 bg-gray-800/50 rounded-2xl border border-white/10">
              <p className="text-white/60 text-lg">No vehicles match your filters.</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-white/60 text-sm">{filteredVehicles.length} vehicles found</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredVehicles.map((vehicle, index) => {
                  const matchScore = calculateMatchScore(vehicle);
                  return (
                    <motion.div
                      key={`vehicle-${vehicle.id}-${index}`}
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ 
                        duration: 0.5,
                        delay: index * 0.1,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      whileHover={{ 
                        y: -8, 
                        scale: 1.02,
                        transition: { duration: 0.3 }
                      }}
                      className="bg-[#2a2a2a] border border-white/10 rounded-xl overflow-hidden hover:border-white/30 hover:shadow-2xl hover:shadow-white/10 transition-all duration-300 cursor-pointer group"
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setShowVehicleModal(true);
                        // Analyze reviews for this vehicle (async to ensure reviewsData is loaded)
                        if (reviewsData && reviewsData.length > 0) {
                          const analysis = analyzeVehicleReviews(vehicle.name, reviewsData as any);
                          setSentimentAnalysis(analysis);
                        } else {
                          // Wait a bit for reviews to load, then try again
                          setTimeout(() => {
                            if (reviewsData && reviewsData.length > 0) {
                              const analysis = analyzeVehicleReviews(vehicle.name, reviewsData as any);
                              setSentimentAnalysis(analysis);
                            } else {
                              setSentimentAnalysis(null);
                            }
                          }, 500);
                        }
                      }}
                    >
                      <div className="aspect-[4/3] relative overflow-hidden flex items-center justify-center bg-transparent">
                        <motion.img
                          src={vehicle.image}
                          alt={vehicle.name}
                          className="w-full h-full object-contain"
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.6, delay: index * 0.1 + 0.2 }}
                          whileHover={{ scale: 1.1 }}
                          style={{ 
                            filter: 'brightness(1.05) contrast(1.1) saturate(1.15)',
                            mixBlendMode: 'normal',
                            opacity: 1
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/CarImages/1.png";
                          }}
                        />
                        <motion.div 
                          className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-semibold border border-white/20"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.3 }}
                          whileHover={{ scale: 1.1 }}
                        >
                          {vehicle.year}
                        </motion.div>
                        {(matchScore > 0 || compatibilityScores.has(vehicle.id)) && (
                          <motion.div 
                            className="absolute top-3 left-3 z-20"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ 
                              delay: index * 0.1 + 0.4,
                              type: "spring",
                              stiffness: 200,
                              damping: 15
                            }}
                            whileHover={{ scale: 1.1 }}
                          >
                            <CircularScore 
                              score={compatibilityScores.has(vehicle.id) 
                                ? (compatibilityScores.get(vehicle.id) || 0)
                                : matchScore} 
                              size={50}
                              strokeWidth={4}
                            />
                          </motion.div>
                        )}
                      </div>
                      <div className="p-4">
                        <motion.div 
                          className="mb-3"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 + 0.3 }}
                        >
                          <h3 className="text-base font-semibold text-white mb-1 group-hover:text-white/90 transition-colors">
                            {vehicle.year} {vehicle.name} {vehicle.trim}
                          </h3>
                          <motion.p 
                            className="text-xl font-bold text-green-400"
                            whileHover={{ scale: 1.05 }}
                          >
                            ${vehicle.price.toLocaleString()}
                          </motion.p>
                        </motion.div>
                        <motion.div 
                          className="mb-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.4 }}
                        >
                          <p className="text-xs text-white/70 mb-2">
                            MPG: {vehicle.mpgCity || 0} {vehicle.fuelType}
                          </p>
                          {vehicle.keyFeatures && vehicle.keyFeatures.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {vehicle.keyFeatures.slice(0, 3).map((feature, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-white/10 text-white/80 rounded text-xs border border-white/20"
                                >
                                  {feature.length > 25 ? feature.substring(0, 25) + "..." : feature}
                                </span>
                              ))}
                              {vehicle.keyFeatures.length > 3 && (
                                <span className="px-2 py-0.5 bg-white/5 text-white/60 rounded text-xs">
                                  +{vehicle.keyFeatures.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </motion.div>
                        <motion.div 
                          className="flex gap-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 + 0.5 }}
                        >
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVehicle(vehicle);
                              setShowVehicleModal(true);
                            }}
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 py-2 px-3 rounded text-xs font-medium text-white hover:bg-white/10 transition-colors"
                          >
                            Learn More
                          </motion.button>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCompare(vehicle);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-3 py-2 rounded text-xs font-medium border transition-colors ${
                              compareVehicles.some((v) => v.id === vehicle.id)
                                ? "bg-white/10 text-white border-white/30"
                                : "text-white border-white/20 hover:bg-white/5"
                            }`}
                          >
                            Compare
                          </motion.button>
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            </>
          )}
        </main>
      </div>

      {/* Vehicle Detail Modal */}
      <AnimatePresence>
        {showVehicleModal && selectedVehicle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowVehicleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative">
                  <img
                    src={selectedVehicle.image}
                    alt={selectedVehicle.name}
                    className="w-full h-full object-contain"
                    style={{
                      filter: 'brightness(1.05) contrast(1.1) saturate(1.15)',
                      mixBlendMode: 'normal',
                      opacity: 1
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/CarImages/1.png";
                    }}
                  />
                  <button
                    onClick={() => setShowVehicleModal(false)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-4xl font-bold text-white mb-2">
                        {selectedVehicle.year} {selectedVehicle.name} {selectedVehicle.trim}
                      </h2>
                      <p className="text-3xl font-bold text-white">
                        ${selectedVehicle.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => {
                          setShowVehicleModal(false);
                          setShowCalculator(true);
                        }}
                        className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors flex items-center gap-2"
                      >
                        <Calculator className="w-5 h-5" />
                        Calculate Payment
                      </button>
                    </div>
                  </div>

                  {/* Match Score (only if quiz completed) */}
                  {(() => {
                    // Use compatibility score from quiz if available, otherwise use calculateMatchScore
                    const quizMatchScore = compatibilityScores.has(selectedVehicle.id) 
                      ? compatibilityScores.get(selectedVehicle.id) || 0
                      : calculateMatchScore(selectedVehicle);
                    return (
                      <>
                        {quizMatchScore > 0 && (
                          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6 mb-6">
                            <div className="flex items-center gap-3 mb-2">
                              <Sparkles className="w-6 h-6 text-green-400" />
                              <h3 className="text-xl font-bold text-white">Your Match Score</h3>
                            </div>
                            <p className="text-5xl font-bold text-green-400 mb-2">{typeof quizMatchScore === 'number' ? quizMatchScore.toFixed(1) : quizMatchScore}%</p>
                            <p className="text-sm text-white/70">Based on your quiz preferences</p>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Specifications Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3">Specifications</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-white/70">
                          <span>Body Type:</span>
                          <span className="text-white">{selectedVehicle.bodyType}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>Fuel Type:</span>
                          <span className="text-white">{selectedVehicle.fuelType}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>MPG:</span>
                          <span className="text-white">{selectedVehicle.mpg}</span>
                        </div>
                        {selectedVehicle.horsepower && (
                          <div className="flex justify-between text-white/70">
                            <span>Horsepower:</span>
                            <span className="text-white">{selectedVehicle.horsepower} hp</span>
                          </div>
                        )}
                        {selectedVehicle.engine && (
                          <div className="flex justify-between text-white/70">
                            <span>Engine:</span>
                            <span className="text-white text-right max-w-[60%]">{selectedVehicle.engine}</span>
                          </div>
                        )}
                        {selectedVehicle.transmission && (
                          <div className="flex justify-between text-white/70">
                            <span>Transmission:</span>
                            <span className="text-white text-right max-w-[60%]">{selectedVehicle.transmission}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-white/70">
                          <span>Drivetrain:</span>
                          <span className="text-white">{selectedVehicle.drivetrain}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>Cargo Space:</span>
                          <span className="text-white">{selectedVehicle.cargoSpace}</span>
                        </div>
                        {selectedVehicle.seats && (
                          <div className="flex justify-between text-white/70">
                            <span>Seats:</span>
                            <span className="text-white">{selectedVehicle.seats}</span>
                          </div>
                        )}
                        {selectedVehicle.electricRange && (
                          <div className="flex justify-between text-white/70">
                            <span>Electric Range:</span>
                            <span className="text-white">{selectedVehicle.electricRange}</span>
                          </div>
                        )}
                        {selectedVehicle.colors && selectedVehicle.colors.length > 0 && (
                          <div className="flex justify-between text-white/70">
                            <span>Available Colors:</span>
                            <span className="text-white text-right max-w-[60%]">{selectedVehicle.colors.length} options</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3">Key Features</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedVehicle.keyFeatures && selectedVehicle.keyFeatures.length > 0 ? (
                          selectedVehicle.keyFeatures.map((feature, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs font-semibold border border-white/20"
                            >
                              {feature}
                            </span>
                          ))
                        ) : selectedVehicle.features && selectedVehicle.features.length > 0 ? (
                          selectedVehicle.features.map((feature, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs font-semibold border border-white/20"
                            >
                              {feature}
                            </span>
                          ))
                        ) : (
                          <span className="text-white/60 text-sm">No features available</span>
                        )}
                      </div>
                    </div>
                    {/* Show all features if there are more than keyFeatures */}
                    {selectedVehicle.keyFeatures && selectedVehicle.keyFeatures.length > 0 && selectedVehicle.features && selectedVehicle.features.length > selectedVehicle.keyFeatures.length && (
                      <div className="mt-4">
                        <h3 className="text-lg font-bold text-white mb-3">All Features</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedVehicle.features.map((feature, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-white/5 text-white/80 rounded-lg text-xs border border-white/10"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Detailed Features Sections */}
                  {selectedVehicle.safetyFeatures && selectedVehicle.safetyFeatures.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white mb-3">Safety & Driver Assistance</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedVehicle.safetyFeatures.map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-red-500/20 text-red-200 rounded-lg text-xs font-semibold border border-red-500/30"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedVehicle.exteriorFeatures && selectedVehicle.exteriorFeatures.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white mb-3">Exterior Features</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedVehicle.exteriorFeatures.map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-blue-500/20 text-blue-200 rounded-lg text-xs font-semibold border border-blue-500/30"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedVehicle.interiorFeatures && selectedVehicle.interiorFeatures.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white mb-3">Interior Features</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedVehicle.interiorFeatures.map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-purple-500/20 text-purple-200 rounded-lg text-xs font-semibold border border-purple-500/30"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedVehicle.audioMultimedia && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white mb-3">Audio & Multimedia</h3>
                      <div className="space-y-2">
                        {selectedVehicle.audioMultimedia.systemName && (
                          <div className="text-white/90 font-semibold">{selectedVehicle.audioMultimedia.systemName}</div>
                        )}
                        {selectedVehicle.audioMultimedia.display && (
                          <div className="text-white/70 text-sm">{selectedVehicle.audioMultimedia.display}</div>
                        )}
                        {selectedVehicle.audioMultimedia.features && selectedVehicle.audioMultimedia.features.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedVehicle.audioMultimedia.features.map((feature, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1.5 bg-yellow-500/20 text-yellow-200 rounded-lg text-xs font-semibold border border-yellow-500/30"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedVehicle.packages && selectedVehicle.packages.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white mb-3">Available Packages</h3>
                      <div className="space-y-3">
                        {selectedVehicle.packages.map((pkg, idx) => (
                          <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <div className="font-semibold text-white mb-2">{pkg.packageName}</div>
                            <div className="flex flex-wrap gap-2">
                              {pkg.contents.map((content, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="px-2 py-1 bg-white/10 text-white/80 rounded text-xs border border-white/20"
                                >
                                  {content}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedVehicle.connectedServices && selectedVehicle.connectedServices.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white mb-3">Connected Services</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedVehicle.connectedServices.map((service, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-green-500/20 text-green-200 rounded-lg text-xs font-semibold border border-green-500/30"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedVehicle.colors && selectedVehicle.colors.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white mb-3">Available Colors</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedVehicle.colors.map((color, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs font-semibold border border-white/20"
                          >
                            {color}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sentiment Analysis Section */}
                  {sentimentAnalysis && (
                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <MessageSquare className="w-6 h-6 text-blue-400" />
                        <h3 className="text-xl font-bold text-white">Review Sentiment Analysis</h3>
                        <span className="ml-auto text-sm text-white/60">
                          Based on {sentimentAnalysis.reviewCount} review{sentimentAnalysis.reviewCount !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Overall Sentiment Score */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <p className="text-sm text-white/60 mb-2">Overall Sentiment</p>
                          <div className="flex items-center gap-2">
                            {sentimentAnalysis.overallSentiment === "positive" ? (
                              <TrendingUp className="w-5 h-5 text-green-400" />
                            ) : sentimentAnalysis.overallSentiment === "negative" ? (
                              <TrendingDown className="w-5 h-5 text-red-400" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-yellow-400 rounded-full" />
                            )}
                            <p className={`text-2xl font-bold ${
                              sentimentAnalysis.overallSentiment === "positive" ? "text-green-400" :
                              sentimentAnalysis.overallSentiment === "negative" ? "text-red-400" :
                              "text-yellow-400"
                            }`}>
                              {sentimentAnalysis.sentimentScore}%
                            </p>
                          </div>
                          <p className="text-xs text-white/60 mt-1 capitalize">
                            {sentimentAnalysis.overallSentiment}
                          </p>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <p className="text-sm text-white/60 mb-2">Average Rating</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            <p className="text-2xl font-bold text-white">
                              {sentimentAnalysis.rating.split(" ")[0]}
                            </p>
                          </div>
                          <p className="text-xs text-white/60 mt-1">out of 5 stars</p>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <p className="text-sm text-white/60 mb-2">Review Insights</p>
                          <p className="text-2xl font-bold text-white">
                            {sentimentAnalysis.keyInsights.strengths.length + sentimentAnalysis.keyInsights.weaknesses.length}
                          </p>
                          <p className="text-xs text-white/60 mt-1">key points identified</p>
                        </div>
                      </div>

                      {/* Strengths */}
                      {sentimentAnalysis.keyInsights.strengths.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                            Strengths
                          </h4>
                          <div className="space-y-2">
                            {sentimentAnalysis.keyInsights.strengths.map((strength: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 flex-shrink-0" />
                                <p className="text-sm text-white/90">{strength}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Weaknesses */}
                      {sentimentAnalysis.keyInsights.weaknesses.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-red-400" />
                            Areas for Improvement
                          </h4>
                          <div className="space-y-2">
                            {sentimentAnalysis.keyInsights.weaknesses.map((weakness: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                                <p className="text-sm text-white/90">{weakness}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Common Themes */}
                      {sentimentAnalysis.keyInsights.commonThemes.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-3">Common Themes</h4>
                          <div className="flex flex-wrap gap-2">
                            {sentimentAnalysis.keyInsights.commonThemes.map((theme: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm text-white capitalize"
                              >
                                {theme}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calculator Modal */}
      <AnimatePresence>
        {showCalculator && selectedVehicle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCalculator(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-white/20 rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {selectedVehicle.year} {selectedVehicle.name} {selectedVehicle.trim}
                </h2>
                <button
                  onClick={() => setShowCalculator(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setCalculatorInputs((prev) => ({ ...prev, type: "finance" }))}
                  className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                    calculatorInputs.type === "finance"
                      ? "bg-white text-black border-transparent"
                      : "bg-white/5 text-white border-white/20 hover:border-white/40"
                  }`}
                >
                  Finance
                </button>
                <button
                  onClick={() => setCalculatorInputs((prev) => ({ ...prev, type: "lease" }))}
                  className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                    calculatorInputs.type === "lease"
                      ? "bg-white text-black border-transparent"
                      : "bg-white/5 text-white border-white/20 hover:border-white/40"
                  }`}
                >
                  Lease
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">Down Payment</label>
                  <input
                    type="number"
                    value={calculatorInputs.downPayment}
                    onChange={(e) =>
                      setCalculatorInputs((prev) => ({
                        ...prev,
                        downPayment: e.target.value,
                      }))
                    }
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-white/40 focus:ring-2 focus:ring-white/20 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">
                    APR (%) {apr && creditScore && (
                      <span className="text-xs font-normal text-white/60 ml-2">
                        (Based on {getCreditScoreTier(creditScore)} credit: {creditScore})
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={calculatorInputs.apr || (apr ? (apr * 100).toFixed(1) : "")}
                    onChange={(e) =>
                      setCalculatorInputs((prev) => ({
                        ...prev,
                        apr: e.target.value,
                      }))
                    }
                    placeholder={apr ? `${(apr * 100).toFixed(1)}% (auto-filled)` : "Enter APR"}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-white/40 focus:ring-2 focus:ring-white/20 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">Term (months)</label>
                  <input
                    type="number"
                    value={calculatorInputs.term}
                    onChange={(e) =>
                      setCalculatorInputs((prev) => ({
                        ...prev,
                        term: e.target.value,
                      }))
                    }
                    placeholder="Enter term"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-white/40 focus:ring-2 focus:ring-white/20 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="mt-6 p-6 bg-white/5 border border-white/20 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">Estimated Monthly Payment</span>
                  <Info className="w-4 h-4 text-white/40" />
                </div>
                <p className="text-4xl font-bold text-white">
                  ${calculatorInputs.downPayment && calculatorInputs.apr && calculatorInputs.term ? calculateMonthlyPayment(selectedVehicle).toLocaleString() : "0"}/mo
                </p>
                <p className="text-xs text-white/50 mt-3">
                  *Estimated payment. Actual terms may vary. See dealer for details.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare Modal */}
      <AnimatePresence>
        {showCompareModal && compareVehicles.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCompareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-white/20 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                    <GitCompare className="w-8 h-8" />
                    Compare Vehicles
                  </h2>
                  <button
                    onClick={() => setShowCompareModal(false)}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${compareVehicles.length + 1}, minmax(200px, 1fr))` }}>
                  {/* Header Row */}
                  <div className="font-bold text-white/60 text-sm">Specification</div>
                  {compareVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="text-center">
                      <div className="aspect-video bg-gray-800 rounded-lg mb-3 overflow-hidden">
                        <img
                          src={vehicle.image}
                          alt={vehicle.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/CarImages/1.png";
                          }}
                        />
                      </div>
                      <h3 className="font-bold text-white mb-1">{vehicle.year} {vehicle.name} {vehicle.trim}</h3>
                      <p className="text-xl font-bold text-white mb-2">${vehicle.price.toLocaleString()}</p>
                      {calculateMatchScore(vehicle) > 0 && (
                        <div className="inline-block bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold mb-2">
                          {calculateMatchScore(vehicle).toFixed(1)}% Match
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Comparison Rows */}
                  <div className="font-semibold text-white/70 text-sm py-2 border-t border-white/10">Price</div>
                  {compareVehicles.map((vehicle) => (
                    <div key={`price-${vehicle.id}`} className="text-white text-sm py-2 border-t border-white/10">
                      ${vehicle.price.toLocaleString()}
                    </div>
                  ))}

                  <div className="font-semibold text-white/70 text-sm py-2 border-t border-white/10">MPG</div>
                  {compareVehicles.map((vehicle) => (
                    <div key={`mpg-${vehicle.id}`} className="text-white text-sm py-2 border-t border-white/10">
                      {vehicle.mpg}
                    </div>
                  ))}

                  <div className="font-semibold text-white/70 text-sm py-2 border-t border-white/10">Fuel Type</div>
                  {compareVehicles.map((vehicle) => (
                    <div key={`fuel-${vehicle.id}`} className="text-white text-sm py-2 border-t border-white/10">
                      {vehicle.fuelType}
                    </div>
                  ))}

                  <div className="font-semibold text-white/70 text-sm py-2 border-t border-white/10">Body Type</div>
                  {compareVehicles.map((vehicle) => (
                    <div key={`body-${vehicle.id}`} className="text-white text-sm py-2 border-t border-white/10">
                      {vehicle.bodyType}
                    </div>
                  ))}

                  <div className="font-semibold text-white/70 text-sm py-2 border-t border-white/10">Drivetrain</div>
                  {compareVehicles.map((vehicle) => (
                    <div key={`drive-${vehicle.id}`} className="text-white text-sm py-2 border-t border-white/10">
                      {vehicle.drivetrain}
                    </div>
                  ))}

                  <div className="font-semibold text-white/70 text-sm py-2 border-t border-white/10">Cargo Space</div>
                  {compareVehicles.map((vehicle) => (
                    <div key={`cargo-${vehicle.id}`} className="text-white text-sm py-2 border-t border-white/10">
                      {vehicle.cargoSpace}
                    </div>
                  ))}

                  {/* Only show Horsepower if at least one vehicle has it */}
                  {compareVehicles.some(v => v.horsepower) && (
                    <>
                      <div className="font-semibold text-white/70 text-sm py-2 border-t border-white/10">Horsepower</div>
                      {compareVehicles.map((vehicle) => (
                        <div key={`hp-${vehicle.id}`} className="text-white text-sm py-2 border-t border-white/10">
                          {vehicle.horsepower ? `${vehicle.horsepower} hp` : "N/A"}
                        </div>
                      ))}
                    </>
                  )}

                  {/* Only show Engine if at least one vehicle has it */}
                  {compareVehicles.some(v => v.engine) && (
                    <>
                      <div className="font-semibold text-white/70 text-sm py-2 border-t border-white/10">Engine</div>
                      {compareVehicles.map((vehicle) => (
                        <div key={`engine-${vehicle.id}`} className="text-white text-sm py-2 border-t border-white/10">
                          {vehicle.engine ? (vehicle.engine.length > 40 ? vehicle.engine.substring(0, 40) + "..." : vehicle.engine) : "N/A"}
                        </div>
                      ))}
                    </>
                  )}

                  {/* Only show Safety Features if at least one vehicle has it */}
                  {compareVehicles.some(v => v.safetyFeatures && v.safetyFeatures.length > 0) && (
                    <>
                      <div className="font-semibold text-white/70 text-sm py-2 border-t border-white/10">Safety Features</div>
                      {compareVehicles.map((vehicle) => (
                        <div key={`safety-${vehicle.id}`} className="text-white text-sm py-2 border-t border-white/10">
                          {vehicle.safetyFeatures && vehicle.safetyFeatures.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {vehicle.safetyFeatures.slice(0, 2).map((feature, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-red-500/20 rounded text-xs">
                                  {feature.length > 30 ? feature.substring(0, 30) + "..." : feature}
                                </span>
                              ))}
                              {vehicle.safetyFeatures.length > 2 && (
                                <span className="px-2 py-0.5 bg-white/5 rounded text-xs">+{vehicle.safetyFeatures.length - 2} more</span>
                              )}
                            </div>
                          ) : "N/A"}
                        </div>
                      ))}
                    </>
                  )}

                  <div className="font-semibold text-white/70 text-sm py-2 border-t border-white/10">Key Features</div>
                  {compareVehicles.map((vehicle) => (
                    <div key={`features-${vehicle.id}`} className="text-white text-sm py-2 border-t border-white/10">
                      <div className="flex flex-wrap gap-1">
                        {(vehicle.keyFeatures || vehicle.features).slice(0, 3).map((feature, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-white/10 rounded text-xs">
                            {feature.length > 25 ? feature.substring(0, 25) + "..." : feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .slider-white::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #111827;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .slider-white::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #111827;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
      <InventoryChatbot />
    </div>
  );
}
