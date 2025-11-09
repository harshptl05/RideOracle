"use client";

import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Car, Users, CreditCard, ArrowRight, Shield, Zap, Gauge, Leaf, TrendingUp, Loader2 } from "lucide-react";

interface QuizAnswers {
  vehicleType?: string;
  vehicleUsage?: string;
  topPriorities?: string[];
  features?: string[];
  fuelPreference?: string;
  passengerSize?: string;
  paymentPlan?: string;
  budget?: string;
  drivingStyle?: string;
  mustHaveFeatures?: string[];
}

function AnalysisPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!searchParams) return;
    const params: QuizAnswers = {};
    searchParams.forEach((value, key) => {
      if (params[key as keyof QuizAnswers]) {
        const existing = params[key as keyof QuizAnswers];
        if (Array.isArray(existing)) {
          (existing as string[]).push(value);
        } else {
          params[key as keyof QuizAnswers] = [existing as string, value] as any;
        }
      } else {
        params[key as keyof QuizAnswers] = value as any;
      }
    });
    // Handle arrays properly
    Object.keys(params).forEach((key) => {
      const values = searchParams.getAll(key);
      if (values.length > 1) {
        params[key as keyof QuizAnswers] = values as any;
      }
    });
    setAnswers(params);
  }, [searchParams]);

  // Calculate driving style radar data
  const getDrivingStyleData = () => {
    const priorities = answers.topPriorities || [];
    const features = answers.features || [];
    const mustHave = answers.mustHaveFeatures || [];

    // Comfort is always high (80-85 range) - all Toyota cars prioritize comfort
    const comfortScore = 82; // Fixed high value in 80-85 range

    const performanceScore =
      (priorities.includes("Performance") ? 80 : 40) +
      (features.includes("All-Wheel Drive") ? 20 : 0);

    const technologyScore =
      (priorities.includes("Technology") ? 80 : 40) +
      (features.includes("Apple CarPlay / Android Auto") ? 20 : 0) +
      (features.includes("Wireless Charging") ? 10 : 0) +
      (mustHave.includes("360° Camera") ? 15 : 0) +
      (mustHave.includes("Adaptive Cruise Control") ? 15 : 0);

    const safetyScore =
      (priorities.includes("Safety") ? 80 : 40) +
      (features.includes("Advanced Safety Features") ? 20 : 0) +
      (mustHave.includes("Toyota Safety Sense") ? 15 : 0) +
      (mustHave.includes("Blind Spot Monitor") ? 15 : 0);

    const efficiencyScore =
      (priorities.includes("Fuel Efficiency") ? 80 : 40) +
      (priorities.includes("Eco-Friendly") ? 20 : 0) +
      (answers.fuelPreference === "Hybrid" || answers.fuelPreference === "Electric" ? 20 : 0);

    // Order: Comfort (top), Efficiency (left), Performance (right), Safety (bottom-left), Technology (bottom-right)
    return [
      { attribute: "Comfort", value: Math.min(100, comfortScore), fullMark: 100 },
      { attribute: "Efficiency", value: Math.min(100, efficiencyScore), fullMark: 100 },
      { attribute: "Performance", value: Math.min(100, performanceScore), fullMark: 100 },
      { attribute: "Safety", value: Math.min(100, safetyScore), fullMark: 100 },
      { attribute: "Technology", value: Math.min(100, technologyScore), fullMark: 100 },
    ];
  };

  // Calculate priority distribution
  const getPriorityData = () => {
    const priorities = answers.topPriorities || [];
    const features = answers.features || [];
    const mustHave = answers.mustHaveFeatures || [];

    const data = [
      {
        name: "Safety",
        value: 95, // Always high - all Toyota cars have excellent safety
      },
      {
        name: "Fuel Efficiency",
        value: 90, // Always high - Toyota is known for fuel efficiency
      },
      {
        name: "Eco-Friendly",
        value:
          (priorities.includes("Eco-Friendly") ? 90 : 75) +
          (answers.fuelPreference === "Electric" ? 10 : answers.fuelPreference === "Hybrid" ? 5 : 0),
      },
      {
        name: "Cargo",
        value:
          (priorities.includes("Cargo Space") ? 60 : 0) +
          (answers.vehicleType === "SUV" || answers.vehicleType === "Truck" ? 20 : 0),
      },
      {
        name: "Maintenance",
        value: 45, // Default moderate priority
      },
    ];

    return data.filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  };

  const drivingStyleData = getDrivingStyleData();
  const priorityData = getPriorityData();

  const handleSeeMatches = () => {
    console.log("View Recommendations clicked");
    console.log("Current answers:", answers);
    
    setIsLoading(true);
    
    try {
      // Build URL params for inventory - pass all quiz answers
      const params = new URLSearchParams();
      
      // Pass all quiz answers as params
      if (answers.vehicleType) params.append("vehicleType", answers.vehicleType);
      if (answers.fuelPreference && answers.fuelPreference !== "No Preference") {
        params.append("fuelPreference", answers.fuelPreference);
      }
      if (answers.budget) {
        const budgetMap: { [key: string]: string } = {
          "Under $25,000": "25000",
          "$25,000 - $35,000": "35000",
          "$35,000 - $45,000": "45000",
          "$45,000 - $60,000": "60000",
          "Over $60,000": "80000",
        };
        params.append("maxBudget", budgetMap[answers.budget] || "60000");
      }
      if (answers.passengerSize) params.append("passengerSize", answers.passengerSize);
      if (answers.paymentPlan) params.append("paymentPlan", answers.paymentPlan);
      if (answers.drivingStyle) params.append("drivingStyle", answers.drivingStyle);
      if (answers.vehicleUsage) params.append("vehicleUsage", answers.vehicleUsage);
      
      // Pass arrays
      if (answers.topPriorities && Array.isArray(answers.topPriorities)) {
        answers.topPriorities.forEach((p) => params.append("topPriorities", p));
      }
      if (answers.features && Array.isArray(answers.features)) {
        answers.features.forEach((f) => params.append("features", f));
      }
      if (answers.mustHaveFeatures && Array.isArray(answers.mustHaveFeatures)) {
        answers.mustHaveFeatures.forEach((f) => params.append("mustHaveFeatures", f));
      }
      
      params.append("sortBy", "compatibility");
      params.append("fromQuiz", "true");
      
      const url = `/inventory?${params.toString()}`;
      console.log("Navigating to:", url);
      
      // Small delay to show loading state, then navigate
      setTimeout(() => {
        try {
          router.push(url);
          // Fallback: if router.push doesn't work, use window.location
          setTimeout(() => {
            if (window.location.pathname !== "/inventory") {
              console.log("Router.push failed, using window.location");
              window.location.href = url;
            }
          }, 1000);
        } catch (error) {
          console.error("Navigation error:", error);
          window.location.href = url;
        }
      }, 500);
    } catch (error) {
      console.error("Error navigating to inventory:", error);
      setIsLoading(false);
    }
  };

  // Icon mapping for driving style attributes
  const attributeIcons: { [key: string]: any } = {
    Comfort: Gauge,
    Efficiency: Leaf,
    Performance: Zap,
    Safety: Shield,
    Technology: TrendingUp,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent"
          >
            Your Personalized Vehicle Assessment
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-white/70 mb-8"
          >
            We&apos;ve analyzed your preferences to create your unique driver profile.{" "}
            <span className="text-white font-semibold">
              See your personalized Toyota matches below!
            </span>
          </motion.p>
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Button clicked");
              if (!isLoading) {
                handleSeeMatches();
              }
            }}
            whileHover={{ scale: isLoading ? 1 : 1.05 }}
            whileTap={{ scale: isLoading ? 1 : 0.95 }}
            disabled={isLoading}
            className="px-8 py-4 bg-white text-black rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-white/50 hover:bg-white/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Finding Your Matches...
              </>
            ) : (
              <>
                View Recommendations <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Key Preferences Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 hover:border-white/30 transition-all duration-300"
          >
            <motion.div 
              className="flex items-center gap-3 mb-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <motion.div 
                className="p-3 bg-white/10 border border-white/20 rounded-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Car className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-lg font-bold text-white">Vehicle Personality</h3>
            </motion.div>
            <motion.p 
              className="text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            >
              {answers.vehicleType || "Not Specified"}
            </motion.p>
            <p className="text-sm text-white/60">
              Your primary vehicle preference suggests you value versatility and practicality.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 hover:border-white/30 transition-all duration-300"
          >
            <motion.div 
              className="flex items-center gap-3 mb-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
            >
              <motion.div 
                className="p-3 bg-white/10 border border-white/20 rounded-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Users className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-lg font-bold text-white">Passenger Capacity</h3>
            </motion.div>
            <motion.p 
              className="text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
            >
              {answers.passengerSize?.split(" ")[0] || "Not Specified"}
            </motion.p>
            <p className="text-sm text-white/60">
              Perfect for family trips and social occasions.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 hover:border-white/30 transition-all duration-300"
          >
            <motion.div 
              className="flex items-center gap-3 mb-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              <motion.div 
                className="p-3 bg-white/10 border border-white/20 rounded-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <CreditCard className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-lg font-bold text-white">Investment Approach</h3>
            </motion.div>
            <motion.p 
              className="text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
            >
              {answers.paymentPlan === "Finance"
                ? "Long-term"
                : answers.paymentPlan === "Lease"
                ? "Short-term"
                : answers.paymentPlan || "Flexible"}
            </motion.p>
            <p className="text-sm text-white/60">
              Your financing choice reflects your ownership goals.
            </p>
          </motion.div>
        </div>

        {/* Driving Style Section - Mosaic Wheel */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
          whileHover={{ scale: 1.01 }}
          className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8 mb-8 transition-all duration-300"
        >
          <motion.h3 
            className="text-2xl font-bold text-white mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            Your Driving Style
          </motion.h3>
          <motion.p 
            className="text-sm text-white/60 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Based on your feature preferences
          </motion.p>
          
          {/* Compact Circular Progress Indicators */}
          <div className="flex items-center justify-center">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-6 md:gap-8 w-full max-w-2xl">
              {drivingStyleData.map((item, idx) => {
                const Icon = attributeIcons[item.attribute] || Gauge;
                const radius = 35;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference - (item.value / 100) * circumference;
                
                return (
                  <motion.div
                    key={item.attribute}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 + idx * 0.1, type: "spring", stiffness: 200 }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative mb-3">
                      <svg
                        width="90"
                        height="90"
                        className="transform -rotate-90"
                      >
                        {/* Background circle */}
                        <circle
                          cx="45"
                          cy="45"
                          r={radius}
                          fill="none"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="4"
                        />
                        {/* Progress circle */}
                        <motion.circle
                          cx="45"
                          cy="45"
                          r={radius}
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.8)"
                          strokeWidth="4"
                          strokeDasharray={circumference}
                          strokeDashoffset={circumference}
                          strokeLinecap="round"
                          initial={{ strokeDashoffset: circumference }}
                          animate={{ strokeDashoffset: offset }}
                          transition={{ duration: 1, delay: 0.6 + idx * 0.1, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="p-2 bg-white/10 border border-white/20 rounded-lg">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-white mb-1 text-center">{item.attribute}</p>
                    <p className="text-lg font-bold text-white">{item.value}%</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Priority Distribution - Animated Bars */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.7, ease: "easeOut" }}
          whileHover={{ scale: 1.01 }}
          className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8 transition-all duration-300"
        >
          <motion.h3 
            className="text-2xl font-bold text-white mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
          >
            Priority Distribution
          </motion.h3>
          <motion.p 
            className="text-sm text-white/60 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            What matters most to you
          </motion.p>
          <div className="space-y-6">
            {priorityData.map((item, idx) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.7 + idx * 0.1, duration: 0.5, ease: "easeOut" }}
                whileHover={{ x: 5 }}
                className="space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-white/90 font-medium">{item.name}</span>
                  <span className="text-white/60 text-sm">{item.value}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: `${item.value}%`, opacity: 1 }}
                    transition={{ duration: 1.2, delay: 0.8 + idx * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="h-full bg-gradient-to-r from-white/80 to-white/60 rounded-full shadow-lg shadow-white/20"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-lg">Loading analysis...</div>
      </div>
    }>
      <AnalysisPageContent />
    </Suspense>
  );
}

