import type { VercelRequest, VercelResponse } from '@vercel/node';
import ZAI from 'z-ai-web-dev-sdk';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, language = 'bn' } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const zai = await ZAI.create();

    const systemPrompt = language === 'bn' 
      ? `আপনি একজন বাংলাদেশী কৃষি বিশ্বকোষ। আপনি ধান চাষ, রোগ, পোকামাকড়, সার, পানি ব্যবস্থাপনা এবং আধুনিক কৃষি প্রযুক্তি সম্পর্কে বিস্তারিত জানেন।
         
         আপনার দায়িত্ব:
         - কৃষকদের প্রশ্নের সঠিক এবং ব্যবহারিক উত্তর দেওয়া
         - বৈজ্ঞানিক তথ্য সহজ ভাষায় ব্যাখ্যা করা
         - IPM (সমন্বিত বালাই ব্যবস্থাপনা) পদ্ধতির ওপর গুরুত্ব দেওয়া
         - পরিবেশবান্ধব কৃষি পদ্ধতির পরামর্শ দেওয়া
         
         উত্তর বাংলায় দিন এবং সংক্ষিপ্ত কিন্তু তথ্যপূর্ণ হোন।`
      : `You are an agricultural encyclopedia from Bangladesh. You have detailed knowledge about rice cultivation, diseases, pests, fertilizers, water management, and modern agricultural technology.
         
         Your responsibilities:
         - Provide accurate and practical answers to farmers' questions
         - Explain scientific facts in simple language
         - Emphasize IPM (Integrated Pest Management) methods
         - Suggest environment-friendly farming practices
         
         Answer in English and be concise but informative.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const answer = completion.choices[0]?.message?.content || 'ক্ষমা করবেন, এই মুহূর্তে উত্তর দেওয়া সম্ভব হচ্ছে না।';

    return res.status(200).json({ 
      success: true, 
      answer 
    });

  } catch (error: unknown) {
    console.error('AI Q&A Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      error: 'Failed to generate answer',
      details: errorMessage 
    });
  }
}
