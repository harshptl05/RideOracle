// Compatibility scoring system

import { UserProfile } from "./userProfile";

export interface Vehicle {
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

export interface CompatibilityResult {
  vehicle: Vehicle;
  score: number;
  explanation: string;
}

// Calculate compatibility score between user profile and vehicle
export function calculateCompatibility(
  userProfile: UserProfile,
  vehicle: Vehicle
): { score: number; explanation: string } {
  // Start with a base score that varies slightly based on vehicle quality
  // This ensures scores are varied and not clustered
  // Add small variations based on multiple factors for more realistic distribution
  const priceBonus = vehicle.price > 40000 ? 5 : vehicle.price > 30000 ? 2.5 : 0;
  const fuelBonus = vehicle.fuelType?.includes("Hybrid") ? 3 : vehicle.fuelType === "EV" ? 4 : 0;
  const trimBonus = vehicle.trim.includes("Limited") || vehicle.trim.includes("Platinum") ? 1.5 : 
                    vehicle.trim.includes("XLE") || vehicle.trim.includes("XSE") ? 0.8 : 0;
  // Add small variation based on year (newer = slightly better)
  const yearBonus = vehicle.year >= 2025 ? 0.3 : vehicle.year >= 2024 ? 0.1 : 0;
  // Add variation based on number of features (more features = slightly better base)
  const featureBonus = Math.min(vehicle.features.length * 0.05, 1.2);
  // Reduced base score to prevent all vehicles from maxing out
  const baseScore = 38 + priceBonus + fuelBonus + trimBonus + yearBonus + featureBonus;
  let score = baseScore;
  const factors: string[] = [];

  // Financial affordability scoring (more granular, varied scores)
  if (userProfile.annual_income && userProfile.down_payment) {
    const incomeMap: { [key: string]: number } = {
      "under_30k": 30000,
      "30k_50k": 40000,
      "50k_75k": 62500,
      "75k_100k": 87500,
      "100k_150k": 125000,
      "over_150k": 175000,
    };
    const annualIncome = incomeMap[userProfile.annual_income] || 50000;
    const monthlyIncome = annualIncome / 12;
    const downPayment = parseFloat((userProfile.down_payment || "0").replace(/[^0-9.]/g, "")) || 0;
    const loanAmount = vehicle.price - downPayment;
    
    // Calculate affordable monthly payment (typically 10-15% of monthly income)
    const maxMonthlyPayment = monthlyIncome * 0.12; // 12% of monthly income
    const loanTerm = parseInt(userProfile.loan_term_preference || "60");
    const monthlyRate = 0.045 / 12; // 4.5% APR
    const monthlyPayment = loanAmount > 0 ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) / (Math.pow(1 + monthlyRate, loanTerm) - 1) : 0;
    
    // Calculate max affordable price
    const maxAffordablePrice = (maxMonthlyPayment * loanTerm) / (1 + 0.045 * loanTerm / 12) + downPayment;
    
    // More granular scoring based on how close to budget (deterministic)
    const priceRatio = vehicle.price / maxAffordablePrice;
    if (priceRatio <= 0.85) {
      // Well within budget - high score with variation based on price
      const discountFactor = (1 - priceRatio) * 3; // 0-4.5 points based on discount
      score += 20 + discountFactor; // Reduced to 20-24.5 points
      factors.push(`Affordable within your budget`);
    } else if (priceRatio <= 0.95) {
      // Just within budget
      score += 17 + (1 - priceRatio) * 3; // 17-20 points
      factors.push(`Within your budget`);
    } else if (priceRatio <= 1.0) {
      // At budget limit
      score += 14 + (1 - priceRatio) * 3; // 14-17 points
      factors.push(`At your budget limit`);
    } else if (priceRatio <= 1.1) {
      // Slightly over - moderate score
      score += 16 - (priceRatio - 1.0) * 20; // 16-14 points
      factors.push(`Slightly above ideal budget`);
    } else if (priceRatio <= 1.2) {
      // Over budget - lower score
      score += 10 - (priceRatio - 1.1) * 20; // 10-8 points
      factors.push(`Above comfortable budget`);
    } else if (priceRatio <= 1.3) {
      // Significantly over - penalty
      score += 3 - (priceRatio - 1.2) * 15; // 3-0 points
      factors.push(`May exceed comfortable budget`);
    } else {
      // Way over budget - larger penalty
      score -= 5 + (priceRatio - 1.3) * 10; // -5 to -15 points
      factors.push(`Significantly exceeds budget`);
    }
  }

  // MPG scoring based on daily drive and priority (more granular)
  if (vehicle.mpgCity && vehicle.mpgHighway) {
    const avgMpg = (vehicle.mpgCity + vehicle.mpgHighway) / 2;
    const cityMpg = vehicle.mpgCity;
    const highwayMpg = vehicle.mpgHighway;
    
    if (userProfile.priority === "fuel_efficiency") {
      // Fuel efficiency is top priority - score based on actual MPG (deterministic)
      const mpgRatio = Math.min(1, avgMpg / 60); // Cap at 60 MPG for scoring
      const baseMpgScore = mpgRatio * 20; // Reduced to 20 max
      // Add small variation based on city/highway balance
      const mpgBalance = Math.abs(cityMpg - highwayMpg) / avgMpg; // 0-1, lower is better
      const balanceBonus = (1 - mpgBalance) * 1.2; // Up to 1.2 points for balanced MPG
      score += baseMpgScore + balanceBonus;
      if (avgMpg >= 50) {
        factors.push(`Excellent fuel economy (${Math.round(avgMpg)} MPG)`);
      } else if (avgMpg >= 35) {
        factors.push(`Good fuel economy (${Math.round(avgMpg)} MPG)`);
      } else {
        factors.push(`Moderate fuel economy (${Math.round(avgMpg)} MPG)`);
      }
    } else if (userProfile.daily_drive === "long" || userProfile.drive_environment === "highway") {
      // Long drives - prioritize highway MPG (deterministic)
      const highwayRatio = Math.min(1, highwayMpg / 40);
      const baseMpgScore = highwayRatio * 18;
      // Bonus for high highway MPG relative to city
      const highwayBonus = highwayMpg > cityMpg ? (highwayMpg - cityMpg) / 10 : 0;
      score += baseMpgScore + Math.min(highwayBonus, 2);
      factors.push(`Good highway efficiency (${highwayMpg} MPG)`);
    } else if (userProfile.drive_environment === "city") {
      // City driving - prioritize city MPG (deterministic)
      const cityRatio = Math.min(1, cityMpg / 35);
      const baseMpgScore = cityRatio * 15;
      // Bonus for high city MPG relative to highway
      const cityBonus = cityMpg > highwayMpg ? (cityMpg - highwayMpg) / 10 : 0;
      score += baseMpgScore + Math.min(cityBonus, 2);
      factors.push(`Efficient for city driving (${cityMpg} MPG city)`);
    } else {
      // Mixed driving - average MPG (deterministic)
      const mpgRatio = Math.min(1, avgMpg / 40);
      const baseMpgScore = mpgRatio * 12;
      // Small bonus for balanced city/highway MPG
      const balance = 1 - (Math.abs(cityMpg - highwayMpg) / avgMpg);
      score += baseMpgScore + balance * 1.5;
    }
  }

  // Passenger capacity matching (granular scoring)
  if (userProfile.passengers) {
    const passengerCount = parseInt(userProfile.passengers.split("-")[0]) || parseInt(userProfile.passengers.split("+")[0]) || 1;
    const vehicleSeats = vehicle.seats || 5;
    const seatDifference = vehicleSeats - passengerCount;
    
    if (userProfile.passengers.includes("7+") && vehicleSeats >= 7) {
      // Perfect match for large families (deterministic)
            const baseScore = 16; // Reduced from 20
            // Bonus for extra seats beyond 7
            const extraSeatBonus = Math.min((vehicleSeats - 7) * 0.4, 1.5);
            score += baseScore + extraSeatBonus;
      factors.push(`Perfect for ${userProfile.passengers} passengers`);
    } else if (userProfile.passengers.includes("5-6") && vehicleSeats >= 5) {
      // Good match for medium families (deterministic)
            const baseScore = 14; // Reduced from 17
            // Bonus if exactly matches or exceeds
            const matchBonus = vehicleSeats >= 6 ? 1.2 : 0.4;
            score += baseScore + matchBonus;
      if (vehicleSeats >= 6) {
        factors.push(`Comfortable seating for ${userProfile.passengers}`);
      } else {
        factors.push(`Adequate seating for ${userProfile.passengers}`);
      }
    } else if (passengerCount <= 4 && vehicleSeats >= passengerCount) {
      // Good match for small families (deterministic)
            const baseScore = 12; // Reduced from 14
            // Bonus if vehicle has extra seats
            const extraSeatBonus = Math.min(seatDifference * 0.6, 2.5);
            score += baseScore + extraSeatBonus;
      if (seatDifference >= 2) {
        factors.push(`Spacious with extra seating capacity`);
      } else {
        factors.push(`Adequate seating capacity`);
      }
    } else if (vehicleSeats < passengerCount) {
      // Not enough seats - penalty based on how short (deterministic)
      const shortage = passengerCount - vehicleSeats;
      const penalty = shortage * 5; // 5 points per missing seat
      score -= penalty;
      factors.push(`May not accommodate all ${passengerCount} passengers`);
    } else {
      // More seats than needed - small bonus (deterministic)
      const extraSeats = vehicleSeats - passengerCount;
      score += 3 + Math.min(extraSeats * 0.5, 2); // 3-5 points
    }
  }

  // Drive environment matching
  if (userProfile.drive_environment === "city" || userProfile.drive_environment === "suburbs") {
    if (vehicle.fuelType === "Hybrid" || vehicle.fuelType === "Plug-in Hybrid" || vehicle.fuelType === "EV") {
      score += 12; // Reduced from 15
      factors.push(`Ideal for city/suburban driving`);
    }
    if (vehicle.drivetrain === "FWD") {
      score += 4; // Reduced from 5
    }
  } else if (userProfile.drive_environment === "rural") {
    if (vehicle.drivetrain === "AWD" || vehicle.drivetrain === "4WD") {
      score += 12; // Reduced from 15
      factors.push(`AWD/4WD for rural conditions`);
    }
  }

  // Weather conditions
  if (userProfile.weather === "snowy" || userProfile.weather === "rainy") {
    if (vehicle.drivetrain === "AWD" || vehicle.drivetrain === "4WD") {
      score += 12; // Reduced from 15
      factors.push(`AWD for ${userProfile.weather} weather`);
    }
  }

  // Priority matching (granular scoring, deterministic)
  if (userProfile.priority === "fuel_efficiency") {
    if (vehicle.fuelType === "Hybrid" || vehicle.fuelType === "Plug-in Hybrid" || vehicle.fuelType === "EV") {
      let baseScore = 14; // Reduced to 14
      // Bonus based on fuel type
      if (vehicle.fuelType === "EV") baseScore += 1.5;
      else if (vehicle.fuelType === "Plug-in Hybrid") baseScore += 1.2;
      score += baseScore;
      if (vehicle.fuelType === "EV") {
        factors.push(`Fully electric powertrain`);
      } else if (vehicle.fuelType === "Plug-in Hybrid") {
        factors.push(`Plug-in hybrid efficiency`);
      } else {
        factors.push(`Eco-friendly hybrid powertrain`);
      }
    } else {
      score += 5; // Still give some points
    }
  } else if (userProfile.priority === "cargo_space") {
    const cargoMatch = vehicle.cargoSpace.match(/\d+\.?\d*/);
    if (cargoMatch) {
      const cargo = parseFloat(cargoMatch[0]);
      if (cargo > 40) {
        score += 15 + (cargo - 40) * 0.1; // 15-17+ based on cargo size
        factors.push(`Very spacious cargo area (${cargo} cu ft)`);
      } else if (cargo > 30) {
        score += 14 + (cargo - 30) * 0.25; // 14-17
        factors.push(`Spacious cargo area (${cargo} cu ft)`);
      } else if (cargo > 20) {
        score += 11 + (cargo - 20) * 0.25; // 11-13.5
        factors.push(`Good cargo space (${cargo} cu ft)`);
      } else if (cargo > 15) {
        score += 7 + (cargo - 15) * 0.15; // 7-7.75
        factors.push(`Moderate cargo space (${cargo} cu ft)`);
      } else {
        score += 4 + (cargo / 15) * 1; // 4-5
      }
    }
  } else if (userProfile.priority === "technology") {
    const techFeatures = vehicle.features.filter((f) => {
      const lower = f.toLowerCase();
      return lower.includes("safety") ||
        lower.includes("carplay") ||
        lower.includes("android") ||
        lower.includes("screen") ||
        lower.includes("infotainment") ||
        lower.includes("wireless") ||
        lower.includes("camera") ||
        lower.includes("assist") ||
        lower.includes("display") ||
        lower.includes("audio") ||
        lower.includes("multimedia") ||
        lower.includes("smartphone") ||
        lower.includes("bluetooth") ||
        lower.includes("navigation") ||
        lower.includes("touchscreen");
    });
    const techCount = techFeatures.length;
    if (techCount >= 8) {
      score += 15 + Math.min((techCount - 8) * 0.25, 1.5); // 15-16.5
      factors.push(`Advanced technology suite`);
    } else if (techCount >= 5) {
      score += 13 + (techCount - 5) * 0.4; // 13-14.6
      factors.push(`Comprehensive technology features`);
    } else if (techCount >= 3) {
      score += 11 + (techCount - 3) * 0.8; // 11-12.6
      factors.push(`Good technology features`);
    } else if (techCount > 0) {
      score += 8 + (techCount - 1) * 0.4; // 8-8.8
      factors.push(`Standard technology features`);
    } else {
      score += 3;
    }
  } else if (userProfile.priority === "comfort") {
    const isPremium = vehicle.trim.includes("XLE") || vehicle.trim.includes("Platinum") || 
                      vehicle.trim.includes("Limited") || vehicle.trim.includes("Premium") ||
                      vehicle.trim.includes("LE");
    const hasComfortFeatures = vehicle.features.some(f => {
      const lower = f.toLowerCase();
      return lower.includes("leather") || 
        lower.includes("heated") || 
        lower.includes("ventilated") ||
        lower.includes("climate") ||
        lower.includes("seat") ||
        lower.includes("power") ||
        lower.includes("memory") ||
        lower.includes("lumbar") ||
        lower.includes("adjustable");
    });
    const comfortFeatureCount = vehicle.features.filter(f => {
      const lower = f.toLowerCase();
      return lower.includes("leather") || 
        lower.includes("heated") || 
        lower.includes("ventilated") ||
        lower.includes("climate") ||
        lower.includes("seat") ||
        lower.includes("power") ||
        lower.includes("memory") ||
        lower.includes("lumbar") ||
        lower.includes("adjustable") ||
        lower.includes("alcantara") ||
        lower.includes("steering");
    }).length;
    
    if (isPremium && hasComfortFeatures) {
      score += 15 + Math.min(comfortFeatureCount * 0.4, 1.5); // 15-16.5
      factors.push(`Premium comfort features`);
    } else if (isPremium || hasComfortFeatures) {
      score += 12 + Math.min(comfortFeatureCount * 0.25, 1.5); // 12-13.5
      factors.push(`Enhanced comfort features`);
    } else {
      score += 7; // Reduced from 9
      factors.push(`Standard comfort features`);
    }
  } else if (userProfile.priority === "power" || userProfile.priority === "performance") {
    const isPerformance = vehicle.name.includes("GR") || vehicle.name.includes("TRD") || 
                          vehicle.name.includes("Prime") || vehicle.trim.includes("Sport") ||
                          vehicle.name.includes("Supra") || vehicle.name.includes("86");
    const hasPerformanceFeatures = vehicle.features.some(f => {
      const lower = f.toLowerCase();
      return lower.includes("hp") ||
        lower.includes("torque") ||
        lower.includes("turbo") ||
        lower.includes("sport") ||
        lower.includes("performance") ||
        lower.includes("track") ||
        lower.includes("launch") ||
        lower.includes("paddle") ||
        lower.includes("manual");
    });
    if (isPerformance || hasPerformanceFeatures) {
      let perfScore = 14; // Reduced to 14
      // Bonus for specific performance models
      if (vehicle.name.includes("GR Supra") || vehicle.name.includes("Supra")) perfScore += 2;
      else if (vehicle.name.includes("GR86") || vehicle.name.includes("86")) perfScore += 1.8;
      else if (vehicle.name.includes("GR")) perfScore += 1.5;
      else if (vehicle.name.includes("TRD")) perfScore += 1.2;
      if (hasPerformanceFeatures) perfScore += 1;
      score += perfScore;
      factors.push(`Performance-oriented model`);
    } else {
      score += 6;
    }
  } else if (userProfile.priority === "safety") {
    const safetyFeatures = vehicle.features.filter(f => {
      const lower = f.toLowerCase();
      return lower.includes("safety") ||
        lower.includes("sense") ||
        lower.includes("assist") ||
        lower.includes("brake") ||
        lower.includes("blind") ||
        lower.includes("collision") ||
        lower.includes("pedestrian") ||
        lower.includes("lane") ||
        lower.includes("adaptive") ||
        lower.includes("cruise") ||
        lower.includes("airbag") ||
        lower.includes("stability");
    });
    const safetyCount = safetyFeatures.length;
    if (safetyCount >= 6) {
      score += 15 + Math.min((safetyCount - 6) * 0.25, 1.5); // 15-16.5
      factors.push(`Comprehensive safety features`);
    } else if (safetyCount >= 4) {
      score += 13 + (safetyCount - 4) * 0.4; // 13-13.8
      factors.push(`Advanced safety features`);
    } else if (safetyCount >= 2) {
      score += 11 + (safetyCount - 2) * 0.8; // 11-12.6
      factors.push(`Good safety features`);
    } else {
      score += 9;
    }
  }

  // Fuel preference matching (granular)
  if (userProfile.fuel_preference) {
    const fuelMap: { [key: string]: string } = {
      gas: "Gas",
      hybrid: "Hybrid",
      plug_in_hybrid: "Plug-in Hybrid",
      ev: "EV",
    };
    if (vehicle.fuelType === fuelMap[userProfile.fuel_preference]) {
      score += 10; // Exact match (reduced to 10)
      factors.push(`Matches your fuel preference`);
    } else if (vehicle.fuelType?.includes("Hybrid") && userProfile.fuel_preference === "ev") {
      // Partial match for EV preference
      score += 7;
    }
  }

  // Body type preference (deterministic)
  if (userProfile.body_type_preference) {
    const bodyTypeMap: { [key: string]: string } = {
      sedan: "Sedan",
      suv: "SUV",
      truck: "Truck",
      van: "Minivan", // Map van to Minivan
      minivan: "Minivan",
      coupe: "Coupe",
      hatchback: "Hatchback",
    };
    const preferredType = bodyTypeMap[userProfile.body_type_preference];
    if (vehicle.bodyType === preferredType) {
      score += 10; // Exact match (reduced to 10)
      factors.push(`Your preferred ${preferredType} body type`);
    } else if (preferredType === "Minivan" && vehicle.bodyType === "Minivan") {
      // Match van to minivan
      score += 13;
      factors.push(`Minivan matches your preference`);
    } else if (preferredType === "Hatchback" && vehicle.bodyType === "Hatchback") {
      score += 14;
      factors.push(`Hatchback matches your preference`);
    }
  }

  // Budget matching (granular)
  if (userProfile.budget_range) {
    const budgetMap: { [key: string]: [number, number] } = {
      under_25k: [0, 25000],
      "25k_35k": [25000, 35000],
      "35k_45k": [35000, 45000],
      "45k_60k": [45000, 60000],
      over_60k: [60000, 100000],
    };
    const range = budgetMap[userProfile.budget_range];
    if (range) {
      const priceRatio = (vehicle.price - range[0]) / (range[1] - range[0]);
      if (vehicle.price >= range[0] && vehicle.price <= range[1]) {
        // Within range - score based on position in range (middle is best, deterministic)
        const distanceFromMiddle = Math.abs(priceRatio - 0.5);
        const baseScore = 12 - (distanceFromMiddle * 3.5); // 10.25-12 points (reduced)
        score += baseScore;
        factors.push(`Within your budget range`);
      } else if (vehicle.price < range[0]) {
        // Below budget - good but not perfect (deterministic)
        const discountRatio = vehicle.price / range[0];
        score += 9 + discountRatio * 4; // 9-13 points
        factors.push(`Below your budget`);
      } else {
        // Above budget - penalty based on how much over (deterministic)
        const overRatio = (vehicle.price - range[1]) / range[1];
        if (overRatio <= 0.1) {
          score += 4 - overRatio * 10; // 4-3 points
        } else if (overRatio <= 0.2) {
          score -= (overRatio - 0.1) * 20; // 0 to -2 points
        } else {
          score -= 2 + (overRatio - 0.2) * 15; // -2 to -17 points
        }
        factors.push(`Above your budget`);
      }
    }
  }

  // Feature matching (if user selected specific features in quiz)
  if ((userProfile as any).selectedFeatures && Array.isArray((userProfile as any).selectedFeatures)) {
    const selectedFeatures = (userProfile as any).selectedFeatures as string[];
    const vehicleFeaturesLower = vehicle.features.map(f => f.toLowerCase());
    
    let matchedFeatures = 0;
    selectedFeatures.forEach(selectedFeature => {
      const lower = selectedFeature.toLowerCase();
      // Map quiz feature names to vehicle feature keywords
      if (lower.includes("carplay") || lower.includes("android")) {
        if (vehicleFeaturesLower.some(vf => vf.includes("carplay") || vf.includes("android") || vf.includes("smartphone"))) {
          matchedFeatures++;
        }
      } else if (lower.includes("safety")) {
        if (vehicleFeaturesLower.some(vf => vf.includes("safety") || vf.includes("sense") || vf.includes("assist"))) {
          matchedFeatures++;
        }
      } else if (lower.includes("audio") || lower.includes("premium")) {
        if (vehicleFeaturesLower.some(vf => vf.includes("audio") || vf.includes("hifi") || vf.includes("sound"))) {
          matchedFeatures++;
        }
      } else if (lower.includes("leather")) {
        if (vehicleFeaturesLower.some(vf => vf.includes("leather") || vf.includes("alcantara"))) {
          matchedFeatures++;
        }
      } else if (lower.includes("heated") || lower.includes("ventilated")) {
        if (vehicleFeaturesLower.some(vf => vf.includes("heated") || vf.includes("ventilated"))) {
          matchedFeatures++;
        }
      } else if (lower.includes("sunroof") || lower.includes("moonroof")) {
        if (vehicleFeaturesLower.some(vf => vf.includes("sunroof") || vf.includes("moonroof"))) {
          matchedFeatures++;
        }
      } else if (lower.includes("wheel drive") || lower.includes("awd")) {
        if (vehicle.drivetrain.includes("AWD") || vehicle.drivetrain.includes("4WD")) {
          matchedFeatures++;
        }
      } else if (lower.includes("wireless")) {
        if (vehicleFeaturesLower.some(vf => vf.includes("wireless") || vf.includes("qi"))) {
          matchedFeatures++;
        }
      } else if (lower.includes("touchscreen") || lower.includes("display")) {
        if (vehicleFeaturesLower.some(vf => vf.includes("display") || vf.includes("screen") || vf.includes("touchscreen"))) {
          matchedFeatures++;
        }
      } else if (lower.includes("performance")) {
        if (vehicleFeaturesLower.some(vf => vf.includes("hp") || vf.includes("torque") || vf.includes("sport") || vf.includes("turbo"))) {
          matchedFeatures++;
        }
      } else if (lower.includes("smart key")) {
        if (vehicleFeaturesLower.some(vf => vf.includes("smart key") || vf.includes("keyless"))) {
          matchedFeatures++;
        }
      } else {
        // Generic match - check if any vehicle feature contains the selected feature
        if (vehicleFeaturesLower.some(vf => vf.includes(lower))) {
          matchedFeatures++;
        }
      }
    });
    
    if (selectedFeatures.length > 0) {
      const featureMatchRatio = matchedFeatures / selectedFeatures.length;
      const featureScore = featureMatchRatio * 12; // Up to 12 points for feature matching
      score += featureScore;
      if (matchedFeatures > 0) {
        factors.push(`${matchedFeatures} of ${selectedFeatures.length} desired features`);
      }
    }
  }

  // Add unique variations based on vehicle properties to ensure each score is noticeably different
  // This creates deterministic but varied scores (no two vehicles will have exactly the same score)
  // Use multiple vehicle properties to create a unique hash
  const vehicleHash = (
    vehicle.id * 7 + 
    vehicle.name.length * 3 + 
    vehicle.trim.length * 5 + 
    vehicle.price % 100 +
    (vehicle.seats || 5) * 2 +
    vehicle.year % 10
  ) % 100;
  // Create variation between -2.5 to +2.5 points (more noticeable difference)
  const uniqueVariation = (vehicleHash / 100) * 5 - 2.5;
  score += uniqueVariation;
  
  // Normalize to 65-92 (cap at 92 max, minimum 65)
  // This ensures scores gradually decrease and no vehicle goes below 65
  score = Math.max(65, Math.min(92, score));
  // Round to 1 decimal place for realistic scores like 91.5, 87.2, 76.8, etc.
  score = Math.round(score * 10) / 10;

  // Generate explanation
  const explanation =
    factors.length > 0
      ? factors.slice(0, 2).join(", ")
      : "Good overall match for your needs";

  return { score, explanation };
}

// Get matching vehicles sorted by compatibility
// Note: This function should be called with the vehicles array from the inventory page
export function getMatchingVehicles(
  userProfile: UserProfile,
  vehicles: Vehicle[] = []
): CompatibilityResult[] {
  if (vehicles.length === 0) {
    console.warn("No vehicles provided to getMatchingVehicles");
    return [];
  }
  
  const results: CompatibilityResult[] = vehicles.map((vehicle) => {
    const { score, explanation } = calculateCompatibility(userProfile, vehicle);
    return {
      vehicle,
      score,
      explanation,
    };
  });

  // Sort by score (highest first)
  results.sort((a, b) => b.score - a.score);

  return results;
}

