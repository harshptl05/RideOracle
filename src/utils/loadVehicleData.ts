// Utility to load and convert new vehicle data files to Vehicle format

interface NewVehicleData {
  model_year: number;
  make: string;
  model: string;
  body_style: string;
  fuel_type?: string;
  fuel_types?: string[];
  drivetrain_options?: string[];
  seating_capacity: number;
  performance_overview?: any;
  performance?: any;
  color_options?: string[]; // Add color options
  finance: {
    starting_msrp_usd: number | { [key: string]: number };
  };
  trims: Array<{
    trim_name: string;
    price_usd: number;
    fuel_type?: string;
    powertrain?: string;
    powertrain_type?: string;
    safety_and_driver_assistance?: {
      safety_suite_name?: string;
      active_safety?: string[];
      driver_assist?: string[];
    };
    infotainment_and_tech?: {
      display?: string;
      smartphone_integration?: string[];
    };
    comfort_and_convenience?: {
      features?: string[];
    };
    [key: string]: any;
  }>;
  image_and_media?: {
    gallery_url?: string;
  };
}

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

// Map body styles to standard types
function mapBodyType(bodyStyle: string): string {
  const lower = bodyStyle.toLowerCase();
  if (lower.includes("hatchback")) return "Hatchback";
  if (lower.includes("sedan")) return "Sedan";
  if (lower.includes("suv") || lower.includes("crossover")) return "SUV";
  if (lower.includes("truck") || lower.includes("pickup")) return "Truck";
  if (lower.includes("van") || lower.includes("minivan")) return "Minivan";
  if (lower.includes("coupe")) return "Coupe";
  return "Sedan"; // default
}

// Map fuel types
function mapFuelType(fuelType: string | string[] | undefined, trimFuelType?: string): string {
  const type = trimFuelType || (Array.isArray(fuelType) ? fuelType[0] : fuelType) || "";
  const lower = type.toLowerCase();
  if (lower.includes("plug-in") || lower.includes("phev")) return "Plug-in Hybrid";
  if (lower.includes("hybrid")) return "Hybrid";
  if (lower.includes("electric") || lower.includes("ev")) return "EV";
  if (lower.includes("gas") || lower.includes("gasoline")) return "Gas";
  return "Gas";
}

// Map drivetrain
function mapDrivetrain(drivetrainOptions?: string[], trimDrivetrain?: string): string {
  const drivetrain = trimDrivetrain || drivetrainOptions?.[0] || "";
  const lower = drivetrain.toLowerCase();
  if (lower.includes("4wd") || lower.includes("4-wheel")) return "4WD";
  if (lower.includes("awd") || lower.includes("all-wheel")) return "AWD";
  if (lower.includes("rwd") || lower.includes("rear-wheel")) return "RWD";
  if (lower.includes("fwd") || lower.includes("front-wheel")) return "FWD";
  return "FWD";
}

// Extract MPG from performance data
function extractMPG(performance: any, fuelType: string): { city?: number; highway?: number } {
  if (!performance) return {};
  
  // Try different structures
  if (performance.mpg_city && performance.mpg_highway) {
    return { city: performance.mpg_city, highway: performance.mpg_highway };
  }
  
  if (performance.gas_engine?.mpg_city) {
    return { 
      city: performance.gas_engine.mpg_city, 
      highway: performance.gas_engine.mpg_highway 
    };
  }
  
  if (performance.hybrid_system?.mpg_city) {
    return { 
      city: performance.hybrid_system.mpg_city, 
      highway: performance.hybrid_system.mpg_highway 
    };
  }
  
  if (performance.standard_hybrid?.mpg_estimates?.combined_mpg) {
    const combined = performance.standard_hybrid.mpg_estimates.combined_mpg;
    return { city: combined, highway: combined };
  }
  
  return {};
}

// Extract features from trim data (handles both old and new JSON structures)
function extractFeatures(trim: any): string[] {
  const features: string[] = [];
  
  // New structure: mechanical_performance features
  if (trim.mechanical_performance?.features) {
    features.push(...trim.mechanical_performance.features);
  }
  
  // New structure: exterior features
  if (trim.exterior_features) {
    features.push(...trim.exterior_features);
  }
  
  // New structure: interior features
  if (trim.interior_features) {
    features.push(...trim.interior_features);
  }
  
  // New structure: audio/multimedia features
  if (trim.audio_multimedia?.features) {
    features.push(...trim.audio_multimedia.features);
  }
  if (trim.audio_multimedia?.system_name) {
    features.push(trim.audio_multimedia.system_name);
  }
  if (trim.audio_multimedia?.display) {
    features.push(trim.audio_multimedia.display);
  }
  
  // Old structure: safety_and_driver_assistance
  if (trim.safety_and_driver_assistance) {
    const safety = trim.safety_and_driver_assistance;
    if (safety.safety_suite_name) {
      features.push(safety.safety_suite_name);
    }
    if (safety.active_safety) {
      features.push(...safety.active_safety);
    }
    if (safety.driver_assist) {
      features.push(...safety.driver_assist);
    }
  }
  
  // Old structure: infotainment_and_tech
  if (trim.infotainment_and_tech) {
    const tech = trim.infotainment_and_tech;
    if (tech.display) {
      features.push(tech.display);
    }
    if (tech.smartphone_integration) {
      features.push(...tech.smartphone_integration);
    }
  }
  
  // Old structure: comfort_and_convenience
  if (trim.comfort_and_convenience?.features) {
    features.push(...trim.comfort_and_convenience.features);
  }
  
  // Remove duplicates and return
  return [...new Set(features)];
}

// Convert new data format to Vehicle format
export function convertNewVehicleData(data: NewVehicleData): Vehicle[] {
  const vehicles: Vehicle[] = [];
  let idCounter = 1000; // Start from 1000 to avoid conflicts with existing IDs
  
  const basePrice = typeof data.finance.starting_msrp_usd === "number" 
    ? data.finance.starting_msrp_usd 
    : Object.values(data.finance.starting_msrp_usd)[0] as number;
  
  const bodyType = mapBodyType(data.body_style);
  const baseFuelType = mapFuelType(data.fuel_type || data.fuel_types);
  const baseDrivetrain = mapDrivetrain(data.drivetrain_options);
  const mpgData = extractMPG(data.performance_overview || data.performance, baseFuelType);
  
  data.trims.forEach((trim) => {
    // Handle new structure: mechanical_performance
    const mechanicalPerf = trim.mechanical_performance;
    const fuelType = mechanicalPerf 
      ? mapFuelType(baseFuelType, trim.fuel_type || mechanicalPerf.drivetrain)
      : mapFuelType(baseFuelType, trim.fuel_type || trim.powertrain_type);
    
    const drivetrain = mechanicalPerf
      ? mapDrivetrain(data.drivetrain_options, mechanicalPerf.drivetrain)
      : mapDrivetrain(data.drivetrain_options, trim.drivetrain);
    
    // Extract MPG from new structure (mechanical_performance.mpg_est) or old structure
    let trimMpg: { city?: number; highway?: number } = {};
    if (mechanicalPerf?.mpg_est) {
      trimMpg = {
        city: mechanicalPerf.mpg_est.city,
        highway: mechanicalPerf.mpg_est.highway
      };
    } else {
      trimMpg = extractMPG(data.performance_overview || data.performance, fuelType);
    }
    
    const features = extractFeatures(trim);
    const mpgCity = trimMpg.city || mpgData.city || 0;
    const mpgHighway = trimMpg.highway || mpgData.highway || 0;
    
    // Extract price from new structure (msrp) or old structure (price_usd)
    let price = basePrice;
    if (trim.msrp) {
      // Handle "$56,000" format
      const priceStr = typeof trim.msrp === "string" 
        ? trim.msrp.replace(/[^0-9]/g, "") 
        : String(trim.msrp);
      price = parseInt(priceStr) || basePrice;
    } else if (trim.price_usd) {
      price = trim.price_usd;
    }
    
    // Generate image path (fallback to model-based path)
    // Try to use gallery URL if available, otherwise use local path
    const modelName = data.model.toLowerCase().replace(/\s+/g, '').replace(/\//g, '');
    const trimName = trim.trim_name.toLowerCase().replace(/\s+/g, '').replace(/\//g, '');
    const imagePath = `/CarImages/${modelName}_${trimName}.png`;
    
    // Build key features list (prioritize important ones)
    const keyFeaturesList = features.slice(0, 8);
    
    // Extract detailed information (mechanicalPerf already declared above)
    const horsepower = mechanicalPerf?.net_combined_hp;
    const engine = mechanicalPerf?.engine;
    const transmission = mechanicalPerf?.transmission;
    
    // Extract safety features
    const safetyFeatures = trim.safety_convenience_features || [];
    
    // Extract packages
    const packages = trim.options_and_packages || [];
    
    // Extract connected services
    const connectedServices = trim.connected_services_trials || [];
    
    // Extract audio/multimedia details
    const audioMultimedia = trim.audio_multimedia ? {
      systemName: trim.audio_multimedia.system_name,
      display: trim.audio_multimedia.display,
      features: trim.audio_multimedia.features || []
    } : undefined;
    
    // Create vehicle object matching toyota-vehicles.json format exactly
    const vehicle: Vehicle = {
      id: idCounter++,
      name: data.model,
      trim: trim.trim_name,
      year: data.model_year,
      price: price,
      bodyType,
      fuelType,
      mpg: mpgCity && mpgHighway ? `${mpgCity} city / ${mpgHighway} highway` : `${mpgCity || mpgHighway || 0} combined`,
      mpgCity: mpgCity || undefined,
      mpgHighway: mpgHighway || undefined,
      features: features.length > 0 ? features : ["Standard Toyota features"],
      image: imagePath,
      drivetrain,
      cargoSpace: "N/A", // Will be filled from dimensions if available
      seats: data.seating_capacity,
      keyFeatures: keyFeaturesList,
    };
    
    // Add color options if available
    if (data.color_options && data.color_options.length > 0) {
      vehicle.colors = data.color_options;
    }
    
    // Add detailed features
    if (horsepower) vehicle.horsepower = horsepower;
    if (engine) vehicle.engine = engine;
    if (transmission) vehicle.transmission = transmission;
    if (safetyFeatures.length > 0) vehicle.safetyFeatures = safetyFeatures;
    if (trim.exterior_features && trim.exterior_features.length > 0) {
      vehicle.exteriorFeatures = trim.exterior_features;
    }
    if (trim.interior_features && trim.interior_features.length > 0) {
      vehicle.interiorFeatures = trim.interior_features;
    }
    if (audioMultimedia) vehicle.audioMultimedia = audioMultimedia;
    if (packages.length > 0) {
      vehicle.packages = packages.map((pkg: any) => ({
        packageName: pkg.package_name || pkg.name || "Package",
        contents: pkg.contents || pkg.features || []
      }));
    }
    if (connectedServices.length > 0) vehicle.connectedServices = connectedServices;
    
    // Add electric range if applicable
    if (fuelType === "EV" || fuelType === "Plug-in Hybrid") {
      // Try to extract electric range from features or performance data
      const rangeMatch = features.find(f => f.toLowerCase().includes("mile") || f.toLowerCase().includes("range"));
      if (rangeMatch) {
        const rangeNum = rangeMatch.match(/\d+/);
        if (rangeNum) {
          vehicle.electricRange = `${rangeNum[0]} miles`;
        }
      }
    }
    
    vehicles.push(vehicle);
  });
  
  return vehicles;
}

// Load all vehicle data files
export async function loadAllVehicleData(): Promise<Vehicle[]> {
  const vehicleFiles = [
    "2025_camry",
    "2025_corolla",
    "2025_corollahatchback",
    "2025_rav4",
    "2025_prius",
    "2025_highlander",
    "2025_4runner",
    "2025_tacoma",
    "2025_tundra",
    "2025_sienna",
    "2025_sequoia",
    "2025_landcruiser",
    "2025_toyotacrown",
    "2025_crownsignia",
    "2025_grsupra",
    "2025_gr86",
    "2025_bz",
    "2025_mirai",
  ];
  
  const allVehicles: Vehicle[] = [];
  
  // Import all JSON files dynamically
  const imports = await Promise.allSettled([
    import("@/data/2025_camry.json"),
    import("@/data/2025_corolla.json"),
    import("@/data/2025_corollahatchback.json"),
    import("@/data/2025_rav4.json"),
    import("@/data/2025_prius.json"),
    import("@/data/2025_highlander.json"),
    import("@/data/2025_4runner.json"),
    import("@/data/2025_tacoma.json"),
    import("@/data/2025_tundra.json"),
    import("@/data/2025_sienna.json"),
    import("@/data/2025_sequoia.json"),
    import("@/data/2025_landcruiser.json"),
    import("@/data/2025_toyotacrown.json"),
    import("@/data/2025_crownsignia.json"),
    import("@/data/2025_grsupra.json"),
    import("@/data/2025_gr86.json"),
    import("@/data/2025_bz.json"),
    import("@/data/2025_mirai.json"),
  ]);
  
  imports.forEach((result, index) => {
    if (result.status === "fulfilled") {
      try {
        const data = result.value.default || result.value;
        
        // Check if data is already in Vehicle format (array of vehicles)
        // This handles files like 2025_tacoma.json which are already in the final format
        if (Array.isArray(data) && data.length > 0 && data[0].id !== undefined && data[0].name !== undefined) {
          // Already in Vehicle format, enhance with detailed fields if missing
          const enhancedVehicles = (data as Vehicle[]).map(v => {
            // Try to extract horsepower from features if not present
            if (!v.horsepower && v.features) {
              const hpMatch = v.features.find(f => f.toLowerCase().includes("hp") || f.toLowerCase().includes("horsepower"));
              if (hpMatch) {
                const hpNum = hpMatch.match(/\d+/);
                if (hpNum) {
                  v.horsepower = parseInt(hpNum[0]);
                }
              }
            }
            // Try to extract engine info from features
            if (!v.engine && v.features) {
              const engineMatch = v.features.find(f => 
                f.toLowerCase().includes("liter") || 
                f.toLowerCase().includes("cylinder") ||
                f.toLowerCase().includes("engine") ||
                f.toLowerCase().includes("turbocharged") ||
                f.toLowerCase().includes("i-force")
              );
              if (engineMatch) {
                v.engine = engineMatch;
              }
            }
            // Try to extract transmission from features
            if (!v.transmission && v.features) {
              const transMatch = v.features.find(f => 
                f.toLowerCase().includes("transmission") ||
                f.toLowerCase().includes("automatic") ||
                f.toLowerCase().includes("manual") ||
                f.toLowerCase().includes("cvt")
              );
              if (transMatch) {
                v.transmission = transMatch;
              }
            }
            // Extract safety features
            if (!v.safetyFeatures && v.features) {
              v.safetyFeatures = v.features.filter(f => 
                f.toLowerCase().includes("safety") ||
                f.toLowerCase().includes("sense") ||
                f.toLowerCase().includes("assist") ||
                f.toLowerCase().includes("airbag")
              );
            }
            return v;
          });
          allVehicles.push(...enhancedVehicles);
        } else if (data.trims && Array.isArray(data.trims)) {
          // Structured format with trims array, convert it
          const vehicles = convertNewVehicleData(data as NewVehicleData);
          allVehicles.push(...vehicles);
        } else {
          console.warn(`Unknown data format for ${vehicleFiles[index]}`);
        }
      } catch (error) {
        console.warn(`Failed to convert data from ${vehicleFiles[index]}:`, error);
      }
    } else {
      console.warn(`Failed to load ${vehicleFiles[index]}:`, result.reason);
    }
  });
  
  return allVehicles;
}

