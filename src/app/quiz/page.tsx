"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Car, Users, Fuel, CreditCard, Target, Settings, MapPin } from "lucide-react";

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

const questions = [
  {
    id: 1,
    question: "What kind of vehicle are you looking for?",
    key: "vehicleType",
    type: "single",
    options: ["Sedan", "SUV", "Truck", "Minivan", "Coupe", "Hatchback"],
    icon: Car,
  },
  {
    id: 2,
    question: "What will the vehicle be used for?",
    key: "vehicleUsage",
    type: "single",
    options: ["Daily Commute", "Family Transportation", "Adventure & Off-Road", "Business", "Weekend Fun", "Mixed Use"],
    icon: MapPin,
  },
  {
    id: 3,
    question: "What are your top priorities? (Select up to 3)",
    key: "topPriorities",
    type: "multiple",
    options: ["Fuel Efficiency", "Safety", "Technology", "Comfort", "Performance", "Cargo Space", "Eco-Friendly"],
    icon: Target,
    maxSelections: 3,
  },
  {
    id: 4,
    question: "Which features matter most to you? (Select all that apply)",
    key: "features",
    type: "multiple",
    options: [
      "Apple CarPlay / Android Auto",
      "Advanced Safety Features",
      "Premium Audio System",
      "Leather Seats",
      "Heated/Ventilated Seats",
      "Sunroof / Moonroof",
      "All-Wheel Drive",
      "Towing Capability",
      "Wireless Charging",
      "Large Touchscreen Display",
      "Performance Features",
      "Smart Key System",
    ],
    icon: Settings,
  },
  {
    id: 5,
    question: "What's your fuel preference?",
    key: "fuelPreference",
    type: "single",
    options: ["Gas", "Hybrid", "Plug-in Hybrid", "Electric", "No Preference"],
    icon: Fuel,
  },
  {
    id: 6,
    question: "How many passengers do you typically need?",
    key: "passengerSize",
    type: "single",
    options: ["1-2 People", "3-4 People", "5-6 People", "7+ People"],
    icon: Users,
  },
  {
    id: 7,
    question: "What's your preferred payment plan?",
    key: "paymentPlan",
    type: "single",
    options: ["Finance", "Lease", "Cash Purchase", "Not Sure Yet"],
    icon: CreditCard,
  },
  {
    id: 8,
    question: "What's your budget range?",
    key: "budget",
    type: "single",
    options: ["Under $25,000", "$25,000 - $35,000", "$35,000 - $45,000", "$45,000 - $60,000", "Over $60,000"],
    icon: CreditCard,
  },
  {
    id: 9,
    question: "What's your driving style?",
    key: "drivingStyle",
    type: "single",
    options: ["City Driving", "Highway Cruising", "Mixed City & Highway", "Off-Road / Adventure"],
    icon: Car,
  },
  {
    id: 10,
    question: "Any must-have features? (Select all that apply)",
    key: "mustHaveFeatures",
    type: "multiple",
    options: [
      "Toyota Safety Sense",
      "Blind Spot Monitor",
      "360° Camera",
      "Adaptive Cruise Control",
      "Heated Seats",
      "Third Row Seating",
      "Panoramic Roof",
      "Premium Sound System",
    ],
    icon: Settings,
  },
];

export default function QuizPage() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const question = questions[currentQuestion];
  const Icon = question.icon;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleOptionClick = (option: string) => {
    if (question.type === "single") {
      setSelectedOptions([option]);
      setAnswers((prev) => ({
        ...prev,
        [question.key]: option,
      }));
    } else {
      const maxSelections = question.maxSelections || Infinity;
      if (selectedOptions.includes(option)) {
        setSelectedOptions(selectedOptions.filter((o) => o !== option));
      } else if (selectedOptions.length < maxSelections) {
        setSelectedOptions([...selectedOptions, option]);
      }
    }
  };

  const handleNext = () => {
    if (question.type === "multiple") {
      setAnswers((prev) => ({
        ...prev,
        [question.key]: selectedOptions,
      }));
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOptions(
        Array.isArray(answers[question.key as keyof QuizAnswers])
          ? (answers[question.key as keyof QuizAnswers] as string[])
          : []
      );
    } else {
      // Navigate to analysis page with answers
      const params = new URLSearchParams();
      Object.entries(answers).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else {
          params.append(key, value as string);
        }
      });
      // Also add current question's answer if it's the last one
      if (question.type === "multiple" && selectedOptions.length > 0) {
        selectedOptions.forEach((opt) => params.append(question.key, opt));
      } else if (question.type === "single" && selectedOptions.length > 0) {
        params.append(question.key, selectedOptions[0]);
      }
      router.push(`/analysis?${params.toString()}`);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      const prevQuestion = questions[currentQuestion - 1];
      const prevAnswer = answers[prevQuestion.key as keyof QuizAnswers];
      setSelectedOptions(
        Array.isArray(prevAnswer) ? prevAnswer : prevAnswer ? [prevAnswer as string] : []
      );
    }
  };

  const canProceed = () => {
    if (question.type === "single") {
      return selectedOptions.length > 0;
    } else {
      return selectedOptions.length > 0;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Solar System Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Planet */}
        <div className="absolute h-64 w-64 md:h-96 md:w-96 rounded-full border border-white/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(50%_50%_at_16.8%_18.3%,rgba(255,255,255,0.3),rgba(200,200,200,0.2)_37.7%,rgba(50,50,50,0.4))] shadow-[-20px_-20px_50px_rgba(255,255,255,0.1),_-20px_-20px_80px_rgba(255,255,255,0.05),0_0_50px_rgba(255,255,255,0.1)] opacity-30"></div>
        
        {/* Ring 1 */}
        <motion.div
          style={{
            translateX: '-50%',
            translateY: '-50%',
          }}
          animate={{
            rotate: "1turn",
          }}
          transition={{
            repeat: Infinity,
            duration: 60,
            ease: "linear",
          }}
          className="absolute h-[344px] w-[344px] md:h-[580px] md:w-[580px] border border-white/30 opacity-30 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="absolute h-2 w-2 left-0 bg-white/50 rounded-full top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute h-2 w-2 left-1/2 bg-white/50 rounded-full top-0 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute h-5 w-5 left-full border border-white/40 rounded-full top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center">
            <div className="h-2 w-2 bg-white/50 rounded-full"></div>
          </div>
        </motion.div>
        
        {/* Ring 2 */}
        <motion.div
          style={{
            translateX: '-50%',
            translateY: '-50%',
          }}
          animate={{
            rotate: "-1turn",
          }}
          transition={{
            repeat: Infinity,
            duration: 60,
            ease: "linear",
          }}
          className="absolute h-[444px] w-[444px] md:h-[780px] md:w-[780px] rounded-full border border-white/30 opacity-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-dashed"
        ></motion.div>
        
        {/* Ring 3 */}
        <motion.div 
          style={{
            translateX: '-50%',
            translateY: '-50%',
          }}
          animate={{
            rotate: "1turn",
          }}
          transition={{
            repeat: Infinity,
            duration: 90,
            ease: "linear",
          }}
          className="absolute h-[544px] w-[544px] md:h-[980px] md:w-[980px] border border-white/30 opacity-30 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="absolute h-2 w-2 left-0 bg-white/50 rounded-full top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute h-2 w-2 left-full bg-white/50 rounded-full top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-800 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-white/80 to-white/60"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="container mx-auto px-6 py-16 max-w-4xl relative z-10">
        {/* Question Counter */}
        <div className="text-center mb-8">
          <p className="text-white/60 text-sm">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl"
          >
            {/* Question */}
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-white/10 border border-white/20 rounded-xl">
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                {question.question}
              </h2>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {question.options.map((option, idx) => {
                const isSelected = selectedOptions.includes(option);
                const isMultiple = question.type === "multiple";
                const maxReached =
                  isMultiple &&
                  question.maxSelections &&
                  selectedOptions.length >= question.maxSelections &&
                  !isSelected;

                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleOptionClick(option)}
                    disabled={maxReached}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? "bg-white/10 border-white/50 text-white shadow-lg"
                        : maxReached
                        ? "bg-white/5 border-white/5 text-white/30 cursor-not-allowed"
                        : "bg-white/5 border-white/10 text-white/80 hover:border-white/30 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option}</span>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 rounded-full bg-white border border-white/30 flex items-center justify-center"
                        >
                          <svg
                            className="w-4 h-4 text-black"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {question.type === "multiple" && question.maxSelections && (
              <p className="text-white/60 text-sm text-center mb-4">
                Select up to {question.maxSelections} options
              </p>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={handleBack}
                disabled={currentQuestion === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  currentQuestion === 0
                    ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>

              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all ${
                  canProceed()
                    ? "bg-white text-black hover:bg-white/90 shadow-lg border border-white/30"
                    : "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                }`}
              >
                {currentQuestion === questions.length - 1 ? "See Results" : "Next"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
