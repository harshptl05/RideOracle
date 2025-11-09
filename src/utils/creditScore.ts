// Credit score utility based on SSN placeholder
// This is mock data for demonstration purposes

export function getCreditScore(ssnPlaceholder: string): number {
  // Mock credit score based on SSN placeholder hash
  // In a real application, this would call a credit bureau API
  
  // Simple hash function to generate consistent score from SSN placeholder
  let hash = 0;
  for (let i = 0; i < ssnPlaceholder.length; i++) {
    const char = ssnPlaceholder.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Map hash to credit score range (300-850)
  // Use absolute value and modulo to get consistent range
  const score = 300 + (Math.abs(hash) % 551);
  
  return score;
}

export function getAPRFromCreditScore(creditScore: number): number {
  // APR based on credit score ranges
  if (creditScore >= 750) {
    return 0.029; // 2.9% APR - Excellent credit
  } else if (creditScore >= 700) {
    return 0.039; // 3.9% APR - Good credit
  } else if (creditScore >= 650) {
    return 0.049; // 4.9% APR - Fair credit
  } else if (creditScore >= 600) {
    return 0.069; // 6.9% APR - Poor credit
  } else {
    return 0.099; // 9.9% APR - Very poor credit
  }
}

export function getCreditScoreTier(creditScore: number): string {
  if (creditScore >= 750) {
    return "Excellent";
  } else if (creditScore >= 700) {
    return "Good";
  } else if (creditScore >= 650) {
    return "Fair";
  } else if (creditScore >= 600) {
    return "Poor";
  } else {
    return "Very Poor";
  }
}


