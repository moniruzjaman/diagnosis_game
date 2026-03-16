// AI Service utility for frontend
// This provides methods to call the AI API endpoints

interface AIHintResponse {
  success: boolean;
  hint: string;
  phase: string;
  error?: string;
}

interface AIQAResponse {
  success: boolean;
  answer: string;
  error?: string;
}

// Determine API base URL based on environment
const getApiBaseUrl = (): string => {
  // In production on Vercel, API routes are relative
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return ''; // Relative URL for Vercel
  }
  // For local development, we need to run a separate server or use the Vercel dev command
  return ''; // Vite proxy will handle this in development
};

/**
 * Get an AI-generated hint for a specific game phase
 */
export async function getAIHint(phase: string, context?: string, language: string = 'bn'): Promise<string> {
  try {
    const response = await fetch('/api/ai-hint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phase, context, language }),
    });

    if (!response.ok) {
      // Return a fallback hint if API fails
      return getFallbackHint(phase, language);
    }

    const data: AIHintResponse = await response.json();
    return data.success ? data.hint : getFallbackHint(phase, language);
  } catch (error) {
    console.warn('AI Hint API not available, using fallback:', error);
    return getFallbackHint(phase, language);
  }
}

/**
 * Ask a question to the agricultural AI assistant
 */
export async function askAIQuestion(question: string, language: string = 'bn'): Promise<string> {
  try {
    const response = await fetch('/api/ai-qa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, language }),
    });

    if (!response.ok) {
      return language === 'bn' 
        ? 'দুঃখিত, এই মুহূর্তে উত্তর দেওয়া সম্ভব হচ্ছে না। অনুগ্রহ করে পরে আবার চেষ্টা করুন।'
        : 'Sorry, unable to answer at this moment. Please try again later.';
    }

    const data: AIQAResponse = await response.json();
    return data.success ? data.answer : getFallbackAnswer(language);
  } catch (error) {
    console.warn('AI Q&A API not available:', error);
    return getFallbackAnswer(language);
  }
}

// Fallback hints when API is not available
function getFallbackHint(phase: string, language: string): string {
  const hints: Record<string, { bn: string; en: string }> = {
    observe: {
      bn: 'মাঠের বিভিন্ন স্থানে ঘুরে ঘুরে লক্ষণ খুঁজুন। পাতার রঙ, গাছের গোড়া, শীষের অবস্থা লক্ষ্য করুন।',
      en: 'Walk around different parts of the field to find symptoms. Observe leaf color, plant base, and panicle condition.'
    },
    diagnose: {
      bn: 'লক্ষণ দেখে রোগ বা পোকার ধরন চিহ্নিত করুন। ব্যাকটেরিয়া, ছত্রাক বা পোকা - কোনটি আক্রমণ করেছে?',
      en: 'Identify the type of disease or pest from symptoms. Is it bacteria, fungus, or insect attack?'
    },
    measure: {
      bn: 'ক্ষতির পরিমাণ ঠিক করুন। কত শতাংশ জমি আক্রান্ত? দমনের খরচ বনাম ফসলের ক্ষতি - কোনটি বেশি?',
      en: 'Measure the damage extent. What percentage of the field is affected? Compare control cost vs crop loss.'
    },
    think: {
      bn: 'আবহাওয়ার প্রভাব বিবেচনা করুন। বৃষ্টি, আর্দ্রতা, তাপমাত্রা - এগুলো রোগ ছড়াতে সাহায্য করতে পারে।',
      en: 'Consider weather impact. Rain, humidity, temperature - these can help spread diseases.'
    },
    act: {
      bn: 'IPM পদ্ধতি অনুসরণ করুন। প্রথমে সাংস্কৃতিক দমন, তারপর জৈবিক, সর্বশেষ রাসায়নিক দমন।',
      en: 'Follow IPM method. First cultural control, then biological, and finally chemical control.'
    }
  };

  return hints[phase]?.[language] || hints.observe[language];
}

function getFallbackAnswer(language: string): string {
  return language === 'bn'
    ? 'দুঃখিত, এই মুহূর্তে উত্তর দেওয়া সম্ভব হচ্ছে না। অনুগ্রহ করে পরে আবার চেষ্টা করুন।'
    : 'Sorry, unable to answer at this moment. Please try again later.';
}

// Check if AI features are available (for UI indication)
export async function checkAIAvailability(): Promise<boolean> {
  try {
    const response = await fetch('/api/ai-hint', {
      method: 'OPTIONS',
    });
    return response.ok;
  } catch {
    return false;
  }
}
