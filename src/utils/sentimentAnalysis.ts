// Utility for sentiment analysis of Toyota reviews

interface Review {
  car_model: string;
  year: string;
  strengths: string;
  weaknesses: string;
  rating: string;
  full_description: string;
  word_count_full_description: number;
}

interface SentimentAnalysis {
  overallSentiment: "positive" | "neutral" | "negative";
  sentimentScore: number; // 0-100
  keyInsights: {
    strengths: string[];
    weaknesses: string[];
    commonThemes: string[];
  };
  rating: string;
  reviewCount: number;
}

// Simple sentiment analysis based on keywords
function analyzeSentiment(text: string): { score: number; sentiment: "positive" | "neutral" | "negative" } {
  if (!text || text === "empty") {
    return { score: 50, sentiment: "neutral" };
  }

  const positiveWords = [
    "excellent", "great", "good", "amazing", "wonderful", "fantastic", "outstanding",
    "reliable", "comfortable", "powerful", "efficient", "smooth", "quiet", "spacious",
    "well-built", "durable", "safe", "advanced", "premium", "quality", "impressive",
    "versatile", "capable", "refined", "stylish", "modern", "innovative"
  ];

  const negativeWords = [
    "poor", "bad", "terrible", "awful", "disappointing", "cramped", "uncomfortable",
    "noisy", "rough", "cheap", "flimsy", "unreliable", "expensive", "limited",
    "lacks", "missing", "weak", "slow", "boring", "outdated", "tight", "small"
  ];

  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) positiveCount += matches.length;
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) negativeCount += matches.length;
  });

  const totalWords = text.split(/\s+/).length;
  const positiveRatio = positiveCount / Math.max(totalWords, 1);
  const negativeRatio = negativeCount / Math.max(totalWords, 1);

  let score = 50; // Start neutral
  score += positiveRatio * 100 * 2; // Boost for positive words
  score -= negativeRatio * 100 * 2; // Reduce for negative words

  score = Math.max(0, Math.min(100, score));

  let sentiment: "positive" | "neutral" | "negative";
  if (score >= 65) sentiment = "positive";
  else if (score <= 35) sentiment = "negative";
  else sentiment = "neutral";

  return { score, sentiment };
}

// Extract rating from string like "4.8 out of 5 stars"
function extractRating(rating: string): number {
  const match = rating.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

// Normalize vehicle name for matching
function normalizeVehicleName(name: string): string {
  return name.toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(toyota\s+)?/i, ""); // Remove "toyota" prefix if present
}

export function analyzeVehicleReviews(
  vehicleName: string,
  reviews: Review[]
): SentimentAnalysis | null {
  const normalizedName = normalizeVehicleName(vehicleName);
  
  // Find matching reviews
  const matchingReviews = reviews.filter(review => {
    const reviewModel = normalizeVehicleName(review.car_model);
    // Check if vehicle name contains review model or vice versa
    return reviewModel.includes(normalizedName) || normalizedName.includes(reviewModel) ||
           reviewModel.split(" ")[0] === normalizedName.split(" ")[0]; // Match first word (e.g., "camry")
  });

  if (matchingReviews.length === 0) {
    return null;
  }

  // Analyze all reviews
  const allStrengths: string[] = [];
  const allWeaknesses: string[] = [];
  let totalSentimentScore = 0;
  let totalRating = 0;
  let ratingCount = 0;
  const themes: { [key: string]: number } = {};

  matchingReviews.forEach(review => {
    // Extract strengths
    if (review.strengths && review.strengths !== "empty") {
      try {
        const strengths = JSON.parse(review.strengths.replace(/'/g, '"'));
        if (Array.isArray(strengths)) {
          allStrengths.push(...strengths);
        }
      } catch {
        // If not JSON, treat as string
        allStrengths.push(review.strengths);
      }
    }

    // Extract weaknesses
    if (review.weaknesses && review.weaknesses !== "empty") {
      try {
        const weaknesses = JSON.parse(review.weaknesses.replace(/'/g, '"'));
        if (Array.isArray(weaknesses)) {
          allWeaknesses.push(...weaknesses);
        }
      } catch {
        allWeaknesses.push(review.weaknesses);
      }
    }

    // Analyze full description
    const sentiment = analyzeSentiment(review.full_description);
    totalSentimentScore += sentiment.score;

    // Extract rating (handle null/undefined)
    if (review.rating && review.rating !== "empty" && review.rating !== null) {
      const rating = extractRating(review.rating);
      if (rating > 0) {
        totalRating += rating;
        ratingCount++;
      }
    }

    // Extract common themes from description
    const description = review.full_description.toLowerCase();
    const themeKeywords = [
      "reliability", "comfort", "performance", "fuel efficiency", "safety",
      "technology", "space", "quality", "value", "handling", "power", "design"
    ];

    themeKeywords.forEach(keyword => {
      if (description.includes(keyword)) {
        themes[keyword] = (themes[keyword] || 0) + 1;
      }
    });
  });

  const avgSentimentScore = totalSentimentScore / matchingReviews.length;
  const avgRating = ratingCount > 0 ? totalRating / ratingCount : 0;
  const overallSentiment: "positive" | "neutral" | "negative" = 
    avgSentimentScore >= 65 ? "positive" : avgSentimentScore <= 35 ? "negative" : "neutral";

  // Get top themes
  const commonThemes = Object.entries(themes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme);

  // Get unique strengths and weaknesses
  const uniqueStrengths = Array.from(new Set(allStrengths)).slice(0, 5);
  const uniqueWeaknesses = Array.from(new Set(allWeaknesses)).slice(0, 5);

  return {
    overallSentiment,
    sentimentScore: Math.round(avgSentimentScore),
    keyInsights: {
      strengths: uniqueStrengths,
      weaknesses: uniqueWeaknesses,
      commonThemes: commonThemes,
    },
    rating: avgRating > 0 ? `${avgRating.toFixed(1)} out of 5 stars` : "Rating not available",
    reviewCount: matchingReviews.length,
  };
}

