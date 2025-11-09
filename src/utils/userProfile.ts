// User profile utilities for CSV read/write

export interface UserProfile {
  user_id: string;
  // Personal Information (stored in CSV)
  name?: string;
  email?: string;
  phone?: string;
  // Financial Information (stored in CSV)
  ssn_placeholder?: string; // Placeholder for credit score lookup (privacy compliant)
  annual_income?: string;
  employment_status?: string; // full-time, part-time, self-employed, unemployed
  down_payment?: string;
  loan_term_preference?: string; // 36, 48, 60 months
  // Lifestyle Preferences (collected by chatbot, stored separately in localStorage)
  drive_environment?: string;
  weather?: string;
  daily_drive?: string;
  priority?: string;
  passengers?: string;
  budget_range?: string;
  fuel_preference?: string;
  body_type_preference?: string;
}

// Save user profile to CSV via API (only personal + financial info)
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  console.log("Saving profile:", profile);
  
  // Separate personal/financial info (for CSV) from lifestyle preferences (for localStorage)
  const csvProfile = {
    user_id: profile.user_id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    ssn_placeholder: profile.ssn_placeholder,
    annual_income: profile.annual_income,
    employment_status: profile.employment_status,
    down_payment: profile.down_payment,
    loan_term_preference: profile.loan_term_preference,
  };
  
  try {
    const response = await fetch("/api/profiles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(csvProfile),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API response error:", response.status, errorData);
      throw new Error("Failed to save profile");
    }
    
    const result = await response.json();
    console.log("Profile saved successfully to API:", result);
    
    // Store full profile (including lifestyle preferences) in localStorage
    const profiles = loadAllProfiles();
    const existingIndex = profiles.findIndex((p) => p.user_id === profile.user_id);
    
    if (existingIndex >= 0) {
      profiles[existingIndex] = profile; // Store full profile with lifestyle prefs
    } else {
      profiles.push(profile);
    }
    
    localStorage.setItem("user_profiles", JSON.stringify(profiles));
    console.log("Full profile (including lifestyle prefs) saved to localStorage");
  } catch (error) {
    console.error("Error saving user profile to API:", error);
    // Fallback to localStorage
    const profiles = loadAllProfiles();
    const existingIndex = profiles.findIndex((p) => p.user_id === profile.user_id);
    
    if (existingIndex >= 0) {
      profiles[existingIndex] = profile;
    } else {
      profiles.push(profile);
    }
    
    localStorage.setItem("user_profiles", JSON.stringify(profiles));
    console.log("Profile saved to localStorage as fallback");
  }
}

// Load user profile by ID from CSV via API
export async function loadUserProfile(user_id: string): Promise<UserProfile | null> {
  console.log("Loading profile for user_id:", user_id);
  
  try {
    const response = await fetch(`/api/profiles?user_id=${encodeURIComponent(user_id)}`);
    
    if (!response.ok) {
      console.error("API response not OK:", response.status, response.statusText);
      throw new Error("Failed to load profile");
    }
    
    const csvProfileData = await response.json();
    console.log("Profile loaded from API (CSV data):", csvProfileData);
    
    // Load lifestyle preferences from localStorage
    const localStorageProfiles = loadAllProfiles();
    const localStorageProfileData = localStorageProfiles.find((p) => p.user_id === user_id);
    console.log("Profile loaded from localStorage (lifestyle data):", localStorageProfileData);
    
    // Merge CSV data with localStorage data
    const mergedProfile: UserProfile = {
      user_id: user_id,
      ...csvProfileData,
      ...localStorageProfileData,
    };
    
    // Return profile if it exists (even if incomplete)
    if (mergedProfile && Object.keys(mergedProfile).length > 1) { // Check if it contains more than just user_id
      return mergedProfile;
    }
    
    return null;
  } catch (error) {
    console.error("Error loading user profile from API:", error);
    // Fallback to localStorage only if API fails completely
    try {
      const profiles = loadAllProfiles();
      const profile = profiles.find((p) => p.user_id === user_id);
      console.log("Profile loaded from localStorage as fallback:", profile);
      return profile || null;
    } catch (e) {
      console.error("Error loading from localStorage:", e);
      return null;
    }
  }
}

// Load all profiles (for fallback)
function loadAllProfiles(): UserProfile[] {
  try {
    const stored = localStorage.getItem("user_profiles");
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error loading profiles:", error);
    return [];
  }
}

// Get current user ID (from localStorage or generate new)
export function getCurrentUserId(): string {
  let userId = localStorage.getItem("current_user_id");
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("current_user_id", userId);
  }
  return userId;
}

