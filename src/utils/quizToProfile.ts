// Convert quiz answers to UserProfile format for compatibility scoring

import { UserProfile } from "./userProfile";

export interface QuizAnswers {
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

export function quizAnswersToProfile(answers: QuizAnswers): Partial<UserProfile> {
  const profile: Partial<UserProfile> = {};

  // Map vehicle type to body_type_preference
  if (answers.vehicleType) {
    const bodyTypeMap: { [key: string]: string } = {
      Sedan: "sedan",
      SUV: "suv",
      Truck: "truck",
      Minivan: "minivan",
      Coupe: "coupe",
      Hatchback: "hatchback", // Keep hatchback as separate type
    };
    profile.body_type_preference = bodyTypeMap[answers.vehicleType] || answers.vehicleType.toLowerCase();
  }

  // Map fuel preference
  if (answers.fuelPreference && answers.fuelPreference !== "No Preference") {
    const fuelMap: { [key: string]: string } = {
      Gas: "gas",
      Hybrid: "hybrid",
      "Plug-in Hybrid": "plug_in_hybrid",
      Electric: "ev",
    };
    profile.fuel_preference = fuelMap[answers.fuelPreference] || answers.fuelPreference.toLowerCase();
  }

  // Map budget
  if (answers.budget) {
    const budgetMap: { [key: string]: string } = {
      "Under $25,000": "under_25k",
      "$25,000 - $35,000": "25k_35k",
      "$35,000 - $45,000": "35k_45k",
      "$45,000 - $60,000": "45k_60k",
      "Over $60,000": "over_60k",
    };
    profile.budget_range = budgetMap[answers.budget];
  }

  // Map passenger size to passengers (used by compatibility scoring)
  if (answers.passengerSize) {
    const passengerMap: { [key: string]: string } = {
      "1-2 People": "1-2",
      "3-4 People": "3-4",
      "5-6 People": "5-6",
      "7+ People": "7+",
    };
    profile.passengers = passengerMap[answers.passengerSize] || answers.passengerSize;
    profile.familySize = passengerMap[answers.passengerSize] || answers.passengerSize;
  }

  // Map top priorities to priority
  if (answers.topPriorities && answers.topPriorities.length > 0) {
    const priorityMap: { [key: string]: string } = {
      "Fuel Efficiency": "fuel_efficiency",
      Safety: "safety",
      Technology: "technology",
      Comfort: "comfort",
      Performance: "power",
      "Cargo Space": "cargo_space",
      "Eco-Friendly": "fuel_efficiency",
    };
    // Use the first priority
    profile.priority = priorityMap[answers.topPriorities[0]] || "comfort";
  }

  // Map driving style to daily drive and drive environment
  if (answers.drivingStyle) {
    if (answers.drivingStyle.includes("City")) {
      profile.drive_environment = "city";
      profile.daily_drive = "short";
    } else if (answers.drivingStyle.includes("Highway")) {
      profile.drive_environment = "highway";
      profile.daily_drive = "long";
    } else if (answers.drivingStyle.includes("Mixed")) {
      profile.drive_environment = "mixed";
      profile.daily_drive = "medium";
    } else if (answers.drivingStyle.includes("Off-Road")) {
      profile.drive_environment = "off_road";
      profile.daily_drive = "medium";
    }
  }

  // Map vehicle usage to drive environment if not set
  if (!profile.drive_environment && answers.vehicleUsage) {
    if (answers.vehicleUsage.includes("Commute")) {
      profile.drive_environment = "city";
      profile.daily_drive = "short";
    } else if (answers.vehicleUsage.includes("Adventure") || answers.vehicleUsage.includes("Off-Road")) {
      profile.drive_environment = "off_road";
      profile.daily_drive = "medium";
    } else {
      profile.drive_environment = "mixed";
      profile.daily_drive = "medium";
    }
  }

  // Store selected features for feature matching
  if (answers.features && answers.features.length > 0) {
    (profile as any).selectedFeatures = answers.features;
  }
  if (answers.mustHaveFeatures && answers.mustHaveFeatures.length > 0) {
    (profile as any).mustHaveFeatures = answers.mustHaveFeatures;
    // Also add to selectedFeatures
    if (!(profile as any).selectedFeatures) {
      (profile as any).selectedFeatures = [];
    }
    (profile as any).selectedFeatures.push(...answers.mustHaveFeatures);
  }

  return profile;
}

