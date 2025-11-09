"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Sparkles, ArrowRight, Car, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import vehicleData from "@/data/toyota-vehicles.json";
import {
  loadUserProfile,
  getCurrentUserId,
  saveUserProfile,
  UserProfile as UserProfileType,
} from "@/utils/userProfile";
import {
  getMatchingVehicles,
  CompatibilityResult,
} from "@/utils/compatibility";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: number;
}

interface UserPreferences {
  familySize?: string;
  location?: string;
  drivingType?: string;
  bodyType?: string;
  priority?: string;
  maxBudget?: number;
  paymentType?: string;
  features?: string;
  fuelType?: string[];
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
}

const OPENROUTER_API_KEY =
  "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";

const getInitialQuestions = (firstQuestion: string) => [
  "Hi! I'm here to help you find your perfect Toyota. Let's start with a few questions.",
  firstQuestion,
];

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const questionSets: Array<
  Array<{
    key: string;
    question: string;
    options?: string[];
    type?: string;
    multiple?: boolean;
  }>
> = [
  [
    {
      key: "familySize",
      question: "How many kids or family members do you typically transport?",
      options: ["Just me", "2-3 people", "4-5 people", "6+ people"],
    },
    {
      key: "location",
      question: "Do you live in a city, suburbs, or rural area?",
      options: ["City", "Suburbs", "Rural"],
    },
    {
      key: "drivingType",
      question: "What kind of driving do you do most?",
      options: ["Commuting", "Road trips", "Off-road", "Mixed"],
    },
    {
      key: "bodyType",
      question: "What size vehicle do you prefer?",
      options: ["Compact", "Sedan", "SUV", "Truck", "Van"],
    },
    {
      key: "priority",
      question:
        "Are fuel efficiency or environmental considerations important to you?",
      options: ["Very important", "Somewhat important", "Not important"],
    },
    {
      key: "maxBudget",
      question:
        "What is your intended budget or financing preference? (Enter monthly amount like 500, 1000, 1500)",
      type: "number",
    },
    {
      key: "paymentType",
      question: "How would you like to pay?",
      options: ["Buy", "Lease", "Finance"],
    },
    {
      key: "features",
      question:
        "Any must-have features or tech preferences? (e.g., AWD, safety features, infotainment)",
      type: "text",
    },
  ],
  [
    {
      key: "familySize",
      question:
        "Tell me about your family. How many people need to fit comfortably in your vehicle?",
      options: ["Just me", "2-3 people", "4-5 people", "6+ people"],
    },
    {
      key: "location",
      question: "What's your living environment like?",
      options: ["Urban city", "Suburban area", "Rural countryside"],
    },
    {
      key: "drivingType",
      question: "What's your primary use for this vehicle?",
      options: [
        "Daily commuting",
        "Long road trips",
        "Off-road adventures",
        "Mix of everything",
      ],
    },
    {
      key: "bodyType",
      question: "What vehicle size fits your lifestyle?",
      options: ["Compact car", "Sedan", "SUV", "Pickup truck", "Minivan"],
    },
    {
      key: "priority",
      question:
        "How important is fuel efficiency and being eco-friendly to you?",
      options: ["Top priority", "Important but not critical", "Not a concern"],
    },
    {
      key: "maxBudget",
      question:
        "What monthly payment are you comfortable with? (Enter a number)",
      type: "number",
    },
    {
      key: "paymentType",
      question: "What's your payment preference?",
      options: ["Buy outright", "Lease", "Finance over time"],
    },
    {
      key: "features",
      question:
        "What features are essential for you? (e.g., all-wheel drive, advanced safety, premium audio)",
      type: "text",
    },
  ],
  [
    {
      key: "familySize",
      question: "How many passengers do you need to accommodate regularly?",
      options: ["Just me", "2-3 people", "4-5 people", "6+ people"],
    },
    {
      key: "location",
      question: "Where do you primarily live and drive?",
      options: ["City", "Suburbs", "Rural"],
    },
    {
      key: "drivingType",
      question: "Describe your typical driving patterns.",
      options: [
        "Mostly commuting",
        "Frequent road trips",
        "Off-road/outdoor activities",
        "Varied driving",
      ],
    },
    {
      key: "bodyType",
      question: "Which vehicle category appeals to you?",
      options: ["Compact", "Sedan", "SUV", "Truck", "Van"],
    },
    {
      key: "priority",
      question:
        "Rate the importance of fuel efficiency and environmental impact.",
      options: ["Very important", "Moderately important", "Not a priority"],
    },
    {
      key: "maxBudget",
      question:
        "What's your monthly budget for a vehicle payment? (Enter amount)",
      type: "number",
    },
    {
      key: "paymentType",
      question: "What payment option works best for you?",
      options: ["Cash purchase", "Leasing", "Financing"],
    },
    {
      key: "features",
      question: "What technology or features can't you live without?",
      type: "text",
    },
  ],
];

export function QuizModal({ isOpen, onClose }: QuizModalProps) {
  const router = useRouter();
  const [questionSetIndex] = useState(() =>
    Math.floor(Math.random() * questionSets.length)
  );
  const questions = questionSets[questionSetIndex];
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [conversationStep, setConversationStep] = useState(0);
  const [matchingVehicles, setMatchingVehicles] = useState<
    CompatibilityResult[]
  >([]);
  const [showMatches, setShowMatches] = useState(false);
  const [topMatches, setTopMatches] = useState<CompatibilityResult[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const vehicles = vehicleData as Vehicle[];

  // Load user profile whenever modal opens or refreshes
  useEffect(() => {
    if (isOpen) {
      const userId = getCurrentUserId();
      loadUserProfile(userId).then((profile) => {
        console.log("Loaded profile:", profile); // Debug log
        setUserProfile(profile);

        // Reset messages and state when modal opens
        const newInitialQuestions = getInitialQuestions(questions[0].question);

        // Check what info we actually have
        const hasPersonalInfo =
          profile && profile.name && profile.email && profile.phone;
        const hasFinancialInfo =
          profile &&
          profile.annual_income &&
          profile.employment_status &&
          profile.down_payment &&
          profile.loan_term_preference;
        const hasLifestyleInfo =
          profile &&
          profile.drive_environment &&
          profile.priority &&
          profile.passengers;

        if (hasPersonalInfo && hasFinancialInfo && hasLifestyleInfo) {
          // Has everything - ask follow-up questions
          // Only show greeting, wait for user to respond before asking first question
          const nameGreeting = profile.name ? `Hi ${profile.name}! ` : "";
          setMessages([
            {
              id: 1,
              text: `${nameGreeting}I see you've already set up your profile. Based on your preferences (${profile.drive_environment} driving, ${profile.priority} priority, ${profile.passengers} passengers), I'm ready to help refine your perfect match. How can I assist you today?`,
              sender: "bot",
              timestamp: Date.now(),
            },
          ]);
        } else if (hasPersonalInfo && hasFinancialInfo && !hasLifestyleInfo) {
          // Has personal + financial, but needs lifestyle questions
          // Only show greeting with financial info, wait for user to respond before asking first question
          const nameGreeting = profile.name ? `Hi ${profile.name}! ` : "";
          setMessages([
            {
              id: 1,
              text: `${nameGreeting}Great! I have your financial information. Now let me ask you a few questions about your lifestyle and driving preferences to find your perfect Toyota match.`,
              sender: "bot",
              timestamp: Date.now(),
            },
          ]);
        } else if (hasPersonalInfo && !hasFinancialInfo) {
          // Has personal but missing financial
          setMessages([
            {
              id: 1,
              text: `Hi ${
                profile.name || "there"
              }! I see you've started your profile. Please complete your financial information in your profile first, then we can continue with lifestyle questions.`,
              sender: "bot",
              timestamp: Date.now(),
            },
          ]);
        } else {
          // No profile - use default greeting only, wait for user response
          setMessages([
            {
              id: 1,
              text: "Hi! I'm here to help you find your perfect Toyota. How's your day going?",
              sender: "bot",
              timestamp: Date.now(),
            },
          ]);
        }

        // Reset quiz state
        setMessageCount(0);
        setConversationStep(0);
        setCurrentQuestionIndex(0);
        setPreferences({});
        setIsComplete(false);
        setInput("");
        setShowMatches(false);
        setTopMatches([]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Messages will be initialized in useEffect when modal opens
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Filter vehicles based on current preferences
  const recommendedVehicles = useMemo(() => {
    let filtered = [...(vehicleData as Vehicle[])];

    // Filter by body type
    if (preferences.bodyType) {
      const bodyTypeMap: { [key: string]: string } = {
        Compact: "Sedan",
        "Compact car": "Sedan",
        Sedan: "Sedan",
        SUV: "SUV",
        Truck: "Truck",
        "Pickup truck": "Truck",
        Van: "Van",
        Minivan: "Van",
      };
      const mappedType =
        bodyTypeMap[preferences.bodyType] || preferences.bodyType;
      filtered = filtered.filter((v) => v.bodyType === mappedType);
    }

    // Filter by family size (seats)
    if (preferences.familySize) {
      if (preferences.familySize.includes("6+")) {
        filtered = filtered.filter((v) => (v.seats || 5) >= 7);
      } else if (preferences.familySize.includes("4-5")) {
        filtered = filtered.filter((v) => (v.seats || 5) >= 5);
      } else if (preferences.familySize.includes("2-3")) {
        filtered = filtered.filter((v) => (v.seats || 5) >= 3);
      }
    }

    // Filter by priority (fuel efficiency)
    if (
      preferences.priority &&
      (preferences.priority.includes("Very important") ||
        preferences.priority.includes("Top priority"))
    ) {
      filtered = filtered
        .filter(
          (v) =>
            v.fuelType === "Hybrid" ||
            v.fuelType === "Plug-in Hybrid" ||
            v.fuelType === "EV"
        )
        .sort((a, b) => {
          const aMpg = a.mpgCity || 0;
          const bMpg = b.mpgCity || 0;
          return bMpg - aMpg;
        });
    }

    // Filter by budget
    if (preferences.maxBudget) {
      const estimatedPrice = preferences.maxBudget * 60;
      filtered = filtered.filter((v) => v.price <= estimatedPrice);
    }

    // Filter by driving type
    if (
      preferences.drivingType === "commuting" ||
      preferences.location === "city"
    ) {
      filtered = filtered
        .filter(
          (v) =>
            v.fuelType === "Hybrid" ||
            v.fuelType === "Plug-in Hybrid" ||
            v.fuelType === "EV"
        )
        .sort((a, b) => {
          const aMpg = a.mpgCity || 0;
          const bMpg = b.mpgCity || 0;
          return bMpg - aMpg;
        });
    } else if (preferences.drivingType === "road trips") {
      filtered = filtered.sort((a, b) => {
        const aMpg = a.mpgHighway || 0;
        const bMpg = b.mpgHighway || 0;
        return bMpg - aMpg;
      });
    } else if (preferences.drivingType === "off-road") {
      filtered = filtered.filter(
        (v) =>
          v.name.includes("4Runner") ||
          v.name.includes("Tacoma") ||
          v.name.includes("Tundra") ||
          v.name.includes("Land Cruiser")
      );
    }

    return filtered.slice(0, 4);
  }, [preferences]);

  useEffect(() => {
    if (!isOpen) {
      const resetQuestions = getInitialQuestions(questions[0].question);
      setMessages([
        {
          id: 1,
          text: resetQuestions[0],
          sender: "bot",
          timestamp: Date.now(),
        },
        {
          id: 2,
          text: resetQuestions[1],
          sender: "bot",
          timestamp: Date.now() + 100,
        },
      ]);
      setInput("");
      setPreferences({});
      setCurrentQuestionIndex(0);
      setIsComplete(false);
    }
  }, [isOpen, questions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (text: string, sender: "user" | "bot") => {
    const newMessage: Message = {
      id: Date.now(),
      text,
      sender,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const callOpenRouter = async (
    userMessage: string,
    conversationHistory: Message[],
    currentStep: number = conversationStep
  ) => {
    try {
      // Extract unique features from vehicle database to inform questions
      const allFeatures = new Set<string>();
      const allTechFeatures = new Set<string>();
      vehicles.forEach((v) => {
        v.features?.forEach((f) => {
          allFeatures.add(f);
          // Extract tech-related features
          const fLower = f.toLowerCase();
          if (
            fLower.includes("safety") ||
            fLower.includes("carplay") ||
            fLower.includes("android") ||
            fLower.includes("screen") ||
            fLower.includes("infotainment") ||
            fLower.includes("audio") ||
            fLower.includes("wireless") ||
            fLower.includes("climate")
          ) {
            allTechFeatures.add(f);
          }
        });
        v.keyFeatures?.forEach((f) => {
          allFeatures.add(f);
          const fLower = f.toLowerCase();
          if (
            fLower.includes("safety") ||
            fLower.includes("carplay") ||
            fLower.includes("android") ||
            fLower.includes("screen") ||
            fLower.includes("infotainment") ||
            fLower.includes("audio") ||
            fLower.includes("wireless") ||
            fLower.includes("climate")
          ) {
            allTechFeatures.add(f);
          }
        });
      });

      const featureList = Array.from(allFeatures).slice(0, 25).join(", ");
      const techFeatureList = Array.from(allTechFeatures)
        .slice(0, 20)
        .join(", ");

      // Build system prompt with user profile
      let systemPrompt = `You are a friendly Toyota car finder assistant. 

You must ask the user **only one question at a time**, and wait for the user's response before asking the next question.

Never ask multiple questions in the same message.

Keep each question short, conversational, and natural.

Conversation Step: ${
        currentStep + 1
      }. Ask exactly one question for this step and wait for the user's response.

=== AVAILABLE TOYOTA VEHICLE FEATURES (Use these to ask relevant questions) ===
Available features in our inventory include: ${featureList}
Technology features available: ${techFeatureList}
Vehicle types: Sedan, SUV, Truck, Van, Coupe, Hatchback
Fuel types: Gas, Hybrid, Plug-in Hybrid, EV
Drivetrain options: FWD, AWD, 4WD
When asking questions, reference specific features from this list that might interest the user. For example, if they mention safety, ask about "Toyota Safety Sense" features. If they mention tech, ask about "Apple CarPlay", "Android Auto", or "infotainment screens".`;

      // Inject user profile if available
      const hasPersonalInfo =
        userProfile &&
        userProfile.name &&
        userProfile.email &&
        userProfile.phone;
      const hasFinancialInfo =
        userProfile &&
        userProfile.annual_income &&
        userProfile.employment_status &&
        userProfile.down_payment &&
        userProfile.loan_term_preference;
      const hasLifestyleInfo =
        userProfile &&
        userProfile.drive_environment &&
        userProfile.priority &&
        userProfile.passengers;

      // Calculate affordability threshold from financial info (if available)
      let maxAffordablePrice = 80000; // Default max
      let maxMonthlyPayment = 1000; // Default max
      if (userProfile && hasFinancialInfo) {
        const incomeMap: { [key: string]: number } = {
          under_30k: 30000,
          "30k_50k": 40000,
          "50k_75k": 62500,
          "75k_100k": 87500,
          "100k_150k": 125000,
          over_150k: 175000,
        };
        const annualIncome =
          incomeMap[userProfile.annual_income || ""] || 50000;
        const monthlyIncome = annualIncome / 12;
        const downPayment =
          parseFloat(
            (userProfile.down_payment || "0").replace(/[^0-9.]/g, "")
          ) || 0;
        const loanTerm = parseInt(userProfile.loan_term_preference || "60");
        maxMonthlyPayment = monthlyIncome * 0.12; // 12% of monthly income
        const monthlyRate = 0.045 / 12; // 4.5% APR
        // Calculate max affordable price: (maxMonthlyPayment * loanTerm) / (1 + APR * loanTerm/12) + downPayment
        maxAffordablePrice =
          (maxMonthlyPayment * loanTerm) / (1 + (0.045 * loanTerm) / 12) +
          downPayment;
      }

      if (userProfile && hasPersonalInfo && hasFinancialInfo) {
        console.log("Injecting profile into system prompt:", userProfile);

        // Calculate annual income for display
        const incomeMap: { [key: string]: number } = {
          under_30k: 30000,
          "30k_50k": 40000,
          "50k_75k": 62500,
          "75k_100k": 87500,
          "100k_150k": 125000,
          over_150k: 175000,
        };
        const annualIncomeValue =
          incomeMap[userProfile.annual_income || ""] || 50000;
        const downPaymentValue = parseFloat(
          (userProfile.down_payment || "0").replace(/[^0-9.]/g, "") || "0"
        );

        // Financial information section
        systemPrompt += `\n\n=== USER FINANCIAL PROFILE (ALREADY COLLECTED - DO NOT ASK ABOUT THESE) ===
- Name: ${userProfile.name || "Not provided"}
- Annual Income: $${annualIncomeValue.toLocaleString()} (${
          userProfile.annual_income || "Not provided"
        })
- Employment Status: ${userProfile.employment_status || "Not provided"}
- Down Payment: $${downPaymentValue.toLocaleString()}
- Loan Term Preference: ${
          userProfile.loan_term_preference || "Not provided"
        } months
- Maximum Affordable Monthly Payment: ~$${Math.round(
          maxMonthlyPayment
        ).toLocaleString()}
- Maximum Affordable Vehicle Price: ~$${Math.round(
          maxAffordablePrice
        ).toLocaleString()}`;

        // Lifestyle preferences section (if collected)
        if (hasLifestyleInfo) {
          systemPrompt += `\n\n=== USER LIFESTYLE PREFERENCES (ALREADY COLLECTED - DO NOT ASK ABOUT THESE) ===
- Drive environment: ${userProfile.drive_environment}
- Weather conditions: ${userProfile.weather || "varied"}
- Daily drive distance: ${userProfile.daily_drive || "medium"}
- Priority: ${userProfile.priority}
- Number of passengers: ${userProfile.passengers}
${userProfile.budget_range ? `- Budget range: ${userProfile.budget_range}` : ""}
${
  userProfile.fuel_preference
    ? `- Fuel preference: ${userProfile.fuel_preference}`
    : ""
}
${
  userProfile.body_type_preference
    ? `- Body type preference: ${userProfile.body_type_preference}`
    : ""
}`;
        }

        systemPrompt += `\n\nCRITICAL INSTRUCTIONS:
1. The user's name is ${
          userProfile.name || "not provided"
        }. If provided, use their name naturally in conversation.
2. DO NOT ask questions about financial information (income, employment, down payment, loan term) - it's already collected.
3. FINANCIAL AFFORDABILITY (CRITICAL - ALWAYS CHECK):
   - User's maximum affordable vehicle price: ~$${Math.round(
     maxAffordablePrice
   ).toLocaleString()}
   - When discussing or recommending vehicles, ALWAYS check if the price fits within $${Math.round(
     maxAffordablePrice
   ).toLocaleString()}
   - If a vehicle exceeds this budget, explicitly inform the user: "This vehicle may be above your comfortable budget range. Based on your income and down payment, I'd recommend vehicles under $${Math.round(
     maxAffordablePrice
   ).toLocaleString()}."
   - Only recommend vehicles that are affordable based on their financial situation
   - If the user asks about expensive vehicles, politely redirect them to more affordable options
4. ${
          hasLifestyleInfo
            ? "DO NOT ask about lifestyle preferences (drive environment, weather, daily drive, priority, passengers, budget, fuel preference, body type) - they're already collected."
            : "ASK about lifestyle preferences (drive environment, weather, daily drive, priority, passengers) - these need to be collected through conversation."
        }
5. ${
          hasLifestyleInfo
            ? "Ask NEW questions that help refine the recommendation, such as:"
            : "Ask questions about:"
        }
   ${
     hasLifestyleInfo
       ? "   - Specific features they want (safety tech, entertainment, towing capacity, etc.)\n   - Lifestyle questions (hobbies, weekend activities, cargo needs)\n   - Trade-offs between options\n   - Timeline for purchase"
       : "   - Drive environment (city, suburbs, rural, mixed)\n   - Weather conditions (sunny, rainy, snowy, varied)\n   - Daily drive distance (short, medium, long)\n   - Priority (fuel efficiency, cargo space, technology, comfort, power)\n   - Number of passengers (1-2, 3-4, 5-6, 7+)"
   }
6. After ${
          hasLifestyleInfo ? "6-8 follow-up" : "8-10"
        } questions, say: "I think I have enough to recommend some vehicles. Let me calculate your Road Harmony Index and show your matches."
7. REMEMBER: You are on step ${
          currentStep + 1
        }. Ask EXACTLY ONE question. Never ask multiple questions in a single message.`;
      } else {
        console.log("No valid profile found, using default prompt");
        systemPrompt += `\n\nCollect the following attributes from the user:
1) Drive environment (city, suburbs, rural, mixed)
2) Weather conditions (sunny, rainy, snowy, varied)
3) Daily drive distance (short, medium, long)
4) Priority (fuel efficiency, cargo space, technology, comfort, power)
5) Number of passengers (1-2, 3-4, 5-6, 7+)
6) Budget range or fuel preference (optional)

After 8-10 questions total, you should have enough information. Say: "I think I have enough to recommend some vehicles. Let me calculate your Road Harmony Index and show your matches."`;
      }

      systemPrompt += `\n\nCRITICAL RULES FOR YOUR RESPONSE:
- You are on conversation step ${currentStep + 1}
- Ask EXACTLY ONE question per message
- Never ask multiple questions in a single message
- If you find yourself about to ask two questions, choose only the most important one
- Your response must contain exactly ONE question mark (?)
- Keep tone warm, helpful, and concise (1–2 sentences per message)
- Do NOT include multiple questions separated by line breaks or periods`;

      systemPrompt += `\n\nFORMAT REQUIREMENTS:
- Your response must be 1-2 sentences maximum
- Your response must contain EXACTLY ONE question
- Do not use multiple question marks
- Do not use line breaks within your response`;

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              ...conversationHistory.map((msg) => ({
                role: msg.sender === "user" ? "user" : "assistant",
                content: msg.text,
              })),
              {
                role: "user",
                content: userMessage,
              },
            ],
            temperature: 0.3,
            max_tokens: 200,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();
      let responseText =
        data.choices[0]?.message?.content || "I understand. Let me continue...";

      // Post-process to ensure only one question
      // Split by question marks and take only the first question if multiple exist
      const questionMatches = responseText.match(/[^.!?]*\?/g);
      if (questionMatches && questionMatches.length > 1) {
        // Multiple questions detected - take only the first one
        const firstQuestion = questionMatches[0].trim();
        responseText = firstQuestion;
        console.log(
          "Multiple questions detected, using only first:",
          firstQuestion
        );
      }

      return responseText;
    } catch (error) {
      console.error("OpenRouter API error:", error);
      return "I understand. Let's continue...";
    }
  };

  const extractPreference = (text: string, question: (typeof questions)[0]) => {
    const lowerText = text.toLowerCase();

    if (question.key === "familySize" && question.options) {
      for (const opt of question.options) {
        if (lowerText.includes(opt.toLowerCase().split(" ")[0])) return opt;
      }
    }

    if (question.key === "location") {
      if (lowerText.includes("city") || lowerText.includes("urban"))
        return "city";
      if (lowerText.includes("suburb")) return "suburbs";
      if (lowerText.includes("rural") || lowerText.includes("countryside"))
        return "rural";
    }

    if (question.key === "drivingType") {
      if (lowerText.includes("commut")) return "commuting";
      if (lowerText.includes("road trip") || lowerText.includes("highway"))
        return "road trips";
      if (lowerText.includes("off-road") || lowerText.includes("offroad"))
        return "off-road";
      if (
        lowerText.includes("mixed") ||
        lowerText.includes("mix") ||
        lowerText.includes("varied")
      )
        return "mixed";
    }

    if (question.key === "bodyType" && question.options) {
      for (const opt of question.options) {
        const optLower = opt.toLowerCase();
        if (
          lowerText.includes(optLower) ||
          (optLower.includes("compact") && lowerText.includes("compact")) ||
          (optLower.includes("sedan") && lowerText.includes("sedan")) ||
          (optLower.includes("suv") && lowerText.includes("suv")) ||
          (optLower.includes("truck") && lowerText.includes("truck")) ||
          (optLower.includes("van") && lowerText.includes("van"))
        ) {
          return opt;
        }
      }
    }

    if (question.key === "priority") {
      if (
        lowerText.includes("very") ||
        lowerText.includes("top priority") ||
        lowerText.includes("important")
      ) {
        return lowerText.includes("not") ? "Not important" : "Very important";
      }
      if (lowerText.includes("somewhat") || lowerText.includes("moderately"))
        return "Somewhat important";
      if (lowerText.includes("not")) return "Not important";
    }

    if (question.key === "maxBudget") {
      const match = text.match(/\d+/);
      if (match) return parseInt(match[0]);
    }

    if (question.key === "paymentType") {
      if (
        lowerText.includes("buy") ||
        lowerText.includes("cash") ||
        lowerText.includes("outright") ||
        lowerText.includes("purchase")
      )
        return "buy";
      if (lowerText.includes("lease")) return "lease";
      if (lowerText.includes("finance")) return "finance";
    }

    if (question.key === "features") {
      return text; // Return the full text for features
    }

    return undefined;
  };

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    addMessage(text, "user");
    setInput("");
    setIsLoading(true);

    const currentQuestion = questions[currentQuestionIndex];
    const extractedValue = extractPreference(text, currentQuestion);

    if (extractedValue !== undefined) {
      setPreferences((prev) => ({
        ...prev,
        [currentQuestion.key]: extractedValue,
      }));
    }

    // Extract preferences from user's text (even if not in structured questions)
    const lowerText = text.toLowerCase();

    // Extract priority
    if (
      lowerText.includes("comfort") ||
      lowerText.includes("luxury") ||
      lowerText.includes("premium")
    ) {
      setPreferences((prev) => ({ ...prev, priority: "comfort" }));
      // Also save to profile immediately
      const userId = getCurrentUserId();
      loadUserProfile(userId).then((profile) => {
        if (profile) {
          saveUserProfile({ ...profile, priority: "comfort" });
        }
      });
    } else if (
      lowerText.includes("fuel") ||
      lowerText.includes("efficiency") ||
      lowerText.includes("mpg") ||
      lowerText.includes("economy")
    ) {
      setPreferences((prev) => ({ ...prev, priority: "fuel_efficiency" }));
      const userId = getCurrentUserId();
      loadUserProfile(userId).then((profile) => {
        if (profile) {
          saveUserProfile({ ...profile, priority: "fuel_efficiency" });
        }
      });
    } else if (
      lowerText.includes("cargo") ||
      lowerText.includes("space") ||
      lowerText.includes("storage")
    ) {
      setPreferences((prev) => ({ ...prev, priority: "cargo_space" }));
      const userId = getCurrentUserId();
      loadUserProfile(userId).then((profile) => {
        if (profile) {
          saveUserProfile({ ...profile, priority: "cargo_space" });
        }
      });
    } else if (
      lowerText.includes("tech") ||
      lowerText.includes("technology") ||
      lowerText.includes("features")
    ) {
      setPreferences((prev) => ({ ...prev, priority: "technology" }));
      const userId = getCurrentUserId();
      loadUserProfile(userId).then((profile) => {
        if (profile) {
          saveUserProfile({ ...profile, priority: "technology" });
        }
      });
    } else if (
      lowerText.includes("power") ||
      lowerText.includes("performance") ||
      lowerText.includes("speed")
    ) {
      setPreferences((prev) => ({ ...prev, priority: "power" }));
      const userId = getCurrentUserId();
      loadUserProfile(userId).then((profile) => {
        if (profile) {
          saveUserProfile({ ...profile, priority: "power" });
        }
      });
    }

    // Extract passengers
    if (
      lowerText.includes("just me") ||
      lowerText.includes("1-2") ||
      (lowerText.includes("1") &&
        !lowerText.includes("3") &&
        !lowerText.includes("4"))
    ) {
      setPreferences((prev) => ({ ...prev, familySize: "Just me" }));
      const userId = getCurrentUserId();
      loadUserProfile(userId).then((profile) => {
        if (profile) {
          saveUserProfile({ ...profile, passengers: "1-2" });
        }
      });
    } else if (
      lowerText.includes("3-4") ||
      ((lowerText.includes("3") || lowerText.includes("4")) &&
        !lowerText.includes("5"))
    ) {
      setPreferences((prev) => ({ ...prev, familySize: "2-3 people" }));
      const userId = getCurrentUserId();
      loadUserProfile(userId).then((profile) => {
        if (profile) {
          saveUserProfile({ ...profile, passengers: "3-4" });
        }
      });
    } else if (
      lowerText.includes("5-6") ||
      (lowerText.includes("5") && !lowerText.includes("7"))
    ) {
      setPreferences((prev) => ({ ...prev, familySize: "4-5 people" }));
      const userId = getCurrentUserId();
      loadUserProfile(userId).then((profile) => {
        if (profile) {
          saveUserProfile({ ...profile, passengers: "5-6" });
        }
      });
    } else if (
      lowerText.includes("7") ||
      lowerText.includes("8") ||
      lowerText.includes("large family")
    ) {
      setPreferences((prev) => ({ ...prev, familySize: "6+ people" }));
      const userId = getCurrentUserId();
      loadUserProfile(userId).then((profile) => {
        if (profile) {
          saveUserProfile({ ...profile, passengers: "7+" });
        }
      });
    }

    // Get AI response (pass current conversationStep)
    const botResponse = await callOpenRouter(text, messages, conversationStep);
    addMessage(botResponse, "bot");
    setMessageCount((prev) => prev + 1);
    // Increment step after bot responds
    setConversationStep((prev) => prev + 1);
    // Refocus input after bot responds
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    // Check if bot mentioned calculating Road Harmony Index or if we've had enough messages
    // After 8-10 questions, we should have enough info to make recommendations
    const currentStep = conversationStep + 1; // Use the step that will be after this response
    const shouldShowMatches =
      botResponse.toLowerCase().includes("road harmony") ||
      botResponse.toLowerCase().includes("calculate") ||
      botResponse.toLowerCase().includes("show your matches") ||
      botResponse.toLowerCase().includes("i think i have enough") ||
      (currentStep >= 8 && currentStep <= 10);

    if (shouldShowMatches) {
      // Calculate compatibility and show top 3
      setTimeout(async () => {
        const userId = getCurrentUserId();
        const existingProfile = await loadUserProfile(userId);

        // Map preferences to profile format
        const lifestyleData: Partial<UserProfileType> = {
          drive_environment:
            preferences.location ||
            existingProfile?.drive_environment ||
            "mixed",
          weather: existingProfile?.weather || "varied",
          daily_drive:
            preferences.drivingType === "commuting"
              ? "short"
              : preferences.drivingType === "road trips"
              ? "long"
              : existingProfile?.daily_drive || "medium",
          priority:
            preferences.priority || existingProfile?.priority || "comfort",
          passengers: preferences.familySize
            ? preferences.familySize === "Just me"
              ? "1-2"
              : preferences.familySize === "2-3 people"
              ? "3-4"
              : preferences.familySize === "4-5 people"
              ? "5-6"
              : "7+"
            : existingProfile?.passengers || "1-2",
          budget_range: preferences.maxBudget
            ? preferences.maxBudget < 500
              ? "under_25k"
              : preferences.maxBudget < 1000
              ? "25k_35k"
              : "35k_45k"
            : existingProfile?.budget_range,
          fuel_preference:
            preferences.fuelType?.[0]?.toLowerCase().replace(" ", "_") ||
            existingProfile?.fuel_preference,
          body_type_preference:
            preferences.bodyType?.toLowerCase() ||
            existingProfile?.body_type_preference,
        };

        // Merge with existing profile
        const profile: UserProfileType = {
          ...existingProfile,
          ...lifestyleData,
          user_id: userId,
        } as UserProfileType;

        // Save updated profile with lifestyle preferences
        // Always save, even if existingProfile is null (shouldn't happen but safety check)
        await saveUserProfile(profile);

        // Wait a bit to ensure profile is saved to localStorage
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Reload profile to ensure we have the latest data
        const updatedProfile = await loadUserProfile(userId);
        if (!updatedProfile) {
          console.error("Failed to load updated profile");
          setIsLoading(false);
          return;
        }

        const matches = getMatchingVehicles(updatedProfile);
        setMatchingVehicles(matches);
        const top3 = matches.slice(0, 3);
        setTopMatches(top3);

        // Show top 3 vehicles with detailed reasoning
        addMessage(
          `I've calculated your Road Harmony Index! Here are your top 3 matches:`,
          "bot"
        );

        setTimeout(() => {
          top3.forEach((match, idx) => {
            setTimeout(() => {
              addMessage(
                `\n**${idx + 1}. ${match.vehicle.year} ${match.vehicle.name} ${
                  match.vehicle.trim
                }**\n🎯 ${
                  match.score
                }% Road Harmony Match\n💰 $${match.vehicle.price.toLocaleString()}\n\n**Why it's a great fit:**\n${
                  match.explanation
                }`,
                "bot"
              );
            }, idx * 800);
          });

          setTimeout(() => {
            setShowMatches(true);
            addMessage(
              "Ready to explore the full inventory? Click the button below to see all vehicles sorted by your compatibility score!",
              "bot"
            );
          }, top3.length * 800 + 500);
        }, 1000);
      }, 1000);
      setIsLoading(false);
      return;
    }

    // Don't automatically ask next question - let OpenRouter handle the conversation flow
    // The AI will decide when to ask the next question or show matches

    setIsLoading(false);
  };

  const calculateMonthlyPayment = (vehicle: Vehicle) => {
    const principal = vehicle.price - 5000;
    const monthlyRate = 4.5 / 100 / 12;
    if (monthlyRate === 0) return Math.round(principal / 60);
    const monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, 60)) /
      (Math.pow(1 + monthlyRate, 60) - 1);
    return Math.round(monthlyPayment);
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Listen for profile save events to refresh profile data
  useEffect(() => {
    const handleProfileSaved = () => {
      if (isOpen) {
        // Reload profile when it's saved
        const userId = getCurrentUserId();
        loadUserProfile(userId).then((profile) => {
          console.log("Profile refreshed after save:", profile);
          setUserProfile(profile);

          // Update messages if profile was just saved
          if (profile) {
            const newInitialQuestions = getInitialQuestions(
              questions[0].question
            );
            if (profile.name) {
              setMessages([
                {
                  id: 1,
                  text: `Hi ${profile.name}! I see you've updated your profile. Based on your preferences (${profile.drive_environment} driving, ${profile.priority} priority, ${profile.passengers} passengers), let me ask a few follow-up questions.`,
                  sender: "bot",
                  timestamp: Date.now(),
                },
                {
                  id: 2,
                  text: "What's most important to you in your next vehicle - something we haven't covered yet?",
                  sender: "bot",
                  timestamp: Date.now() + 100,
                },
              ]);
            }
          }
        });
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("profileSaved", handleProfileSaved);
      return () => {
        window.removeEventListener("profileSaved", handleProfileSaved);
      };
    }
  }, [isOpen, questions]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl h-[85vh] max-h-[750px] flex flex-col rounded-2xl overflow-hidden pointer-events-auto bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-white/10 shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-semibold text-white">
                        Find Your Perfect Toyota
                      </h1>
                      <p className="text-sm text-white/60">
                        AI-powered car finder
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/70" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex">
                {/* Messages Section */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-black/50 to-black custom-scrollbar">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${
                          message.sender === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                            message.sender === "user"
                              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                              : "bg-white/10 text-white border border-white/20 backdrop-blur-sm"
                          }`}
                        >
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.text.split("\n").map((line, idx) => {
                              // Handle markdown-like formatting
                              if (
                                line.startsWith("**") &&
                                line.endsWith("**")
                              ) {
                                return (
                                  <strong
                                    key={idx}
                                    className="text-base font-bold"
                                  >
                                    {line.replace(/\*\*/g, "")}
                                  </strong>
                                );
                              }
                              return <p key={idx}>{line}</p>;
                            })}
                          </div>
                          {showMatches &&
                            message.text.includes("Ready to explore") && (
                              <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  const userId = getCurrentUserId();
                                  const params = new URLSearchParams();
                                  params.append("sortBy", "compatibility");
                                  params.append("userId", userId);
                                  onClose();
                                  setTimeout(() => {
                                    router.push(
                                      `/inventory?${params.toString()}`
                                    );
                                  }, 300);
                                }}
                                className="mt-4 w-full px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                              >
                                <span>View Full Inventory</span>
                                <ExternalLink className="w-4 h-4" />
                              </motion.button>
                            )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-2 p-3"
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            delay: i * 0.1,
                            repeat: Infinity,
                            duration: 0.6,
                          }}
                          className="w-2 h-2 rounded-full bg-blue-500"
                        />
                      ))}
                    </motion.div>
                  )}

                  {isComplete && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 text-white/60 text-sm"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Redirecting to inventory...</span>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Car Recommendations Sidebar */}
                {recommendedVehicles.length > 0 &&
                  Object.keys(preferences).length >= 1 && (
                    <motion.div
                      initial={{ x: 300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="w-80 border-l border-white/10 bg-gradient-to-b from-gray-900/50 to-black/50 p-4 overflow-y-auto custom-scrollbar"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Car className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-bold text-white">
                          Recommended for You
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {recommendedVehicles.map((vehicle) => (
                          <motion.div
                            key={vehicle.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 hover:bg-white/20 transition-colors cursor-pointer"
                            onClick={() => {
                              onClose();
                              router.push(`/inventory?id=${vehicle.id}`);
                            }}
                          >
                            <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-lg mb-2 overflow-hidden">
                              <img
                                src={vehicle.image}
                                alt={vehicle.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "/CarImages/1.png";
                                }}
                              />
                            </div>
                            <h4 className="text-sm font-bold text-white mb-1">
                              {vehicle.year} {vehicle.name} {vehicle.trim}
                            </h4>
                            <p className="text-lg font-bold text-blue-400 mb-1">
                              ${vehicle.price.toLocaleString()}
                            </p>
                            <p className="text-xs text-white/60 mb-2">
                              {vehicle.mpg}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/80">
                                Est. ${calculateMonthlyPayment(vehicle)}/mo
                              </span>
                              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                                {vehicle.fuelType}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
              </div>

              {/* Input */}
              <div className="p-6 border-t border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-3"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your answer..."
                    className="flex-1 px-4 py-3 rounded-lg text-sm outline-none bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-blue-500/50 transition-colors"
                    disabled={isLoading || isComplete}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!input.trim() || isLoading || isComplete}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 150, 255, 0.4);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 150, 255, 0.6);
        }
      `}</style>
    </AnimatePresence>
  );
}
