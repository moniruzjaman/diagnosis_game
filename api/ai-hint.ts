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
    const { phase, context, language = 'bn' } = req.body;

    if (!phase) {
      return res.status(400).json({ error: 'Phase is required' });
    }

    const zai = await ZAI.create();

    const systemPrompt = language === 'bn' 
      ? `আপনি একজন বাংলাদেশী কৃষি বিশেষজ্ঞ। আপনি ধান চাষের রোগ, পোকামাকড় এবং ব্যবস্থাপনা সম্পর্কে জানেন। 
         আপনার কাজ হলো কৃষকদের সাহায্য করা তাদের জমির সমস্যা নির্ণয় ও সমাধান করতে।
         সংক্ষিপ্ত, কার্যকর এবং বাস্তবসম্মত পরামর্শ দিন। উত্তর বাংলায় দিন।`
      : `You are an agricultural expert from Bangladesh. You know about rice cultivation diseases, pests, and management practices.
         Your job is to help farmers diagnose and solve their field problems.
         Provide concise, practical, and realistic advice. Answer in English.`;

    const phaseContext: Record<string, string> = {
      observe: 'মাঠ পর্যবেক্ষণ ও লক্ষণ অনুসন্ধান (Scouting & Symptom Observation)',
      diagnose: 'সমস্যা চিহ্নিতকরণ ও কারণ বিশ্লেষণ (Diagnosis & Cause Analysis)',
      measure: 'ক্ষতির মাত্রা ও অর্থনৈতিক দ্বারপ্রান্ত (Damage Assessment & ETL)',
      think: 'পরিবেশ, আবহাওয়া ও ঝুঁকি পর্যালোচনা (Risk & Context Evaluation)',
      act: 'সমন্বিত বালাই ব্যবস্থাপনা ও সিদ্ধান্ত (IPM & Decision Making)'
    };

    const userMessage = context 
      ? `বর্তমান ধাপ: ${phaseContext[phase] || phase}\nপ্রসঙ্গ: ${context}\n\nএই ধাপে কৃষককে কী পরামর্শ দেবেন? সংক্ষিপ্ত এবং কার্যকর হিন্ট দিন।`
      : `বর্তমান ধাপ: ${phaseContext[phase] || phase}\n\nএই ধাপে কৃষককে কী পরামর্শ দেবেন? সংক্ষিপ্ত এবং কার্যকর হিন্ট দিন।`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    const hint = completion.choices[0]?.message?.content || 'ক্ষমা করবেন, এই মুহূর্তে হিন্ট দেওয়া সম্ভব হচ্ছে না।';

    return res.status(200).json({ 
      success: true, 
      hint,
      phase 
    });

  } catch (error: unknown) {
    console.error('AI Hint Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      error: 'Failed to generate hint',
      details: errorMessage 
    });
  }
}
