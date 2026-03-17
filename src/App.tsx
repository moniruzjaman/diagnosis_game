import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, Brain, Ruler, CloudSun, CheckCircle, 
  Map, Search, ThermometerSun, Wind, Droplets, 
  AlertTriangle, ShieldCheck, Leaf, Bug, Sprout, 
  ChevronRight, RotateCcw, Activity, FlaskConical, Target,
  Volume2, VolumeX, Trophy, Star, Award, Medal, Zap, Lightbulb,
  Cloud, Microscope, Thermometer, Sun, Hand, BookOpen, X,
  Image, Info, AlertCircle
} from 'lucide-react';
import { RiceIssue, ALL_RICE_ISSUES, RICE_DISEASES, RICE_PESTS, RICE_DEFICIENCIES, IssueType } from './data/riceIssues';

// --- Sound Constants ---
const SOUND_URLS = {
  click: 'https://unpkg.com/@notion-render/client@1.2.0/dist/assets/click.mp3', // Placeholder, using common short sounds
  walk: 'https://www.soundjay.com/footsteps/footsteps-4.mp3',
  success: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
  complete: 'https://www.soundjay.com/misc/sounds/magic-chime-01.mp3',
  think: 'https://www.soundjay.com/misc/sounds/button-10.mp3',
  error: 'https://www.soundjay.com/misc/sounds/fail-trombone-01.mp3'
};

const playSound = (soundName: keyof typeof SOUND_URLS, enabled: boolean) => {
  if (!enabled) return;
  const audio = new Audio(SOUND_URLS[soundName]);
  audio.volume = 0.4;
  audio.play().catch(() => {}); // Ignore errors if browser blocks autoplay
};

// --- Types & Interfaces ---
type Phase = 'intro' | 'observe' | 'diagnose' | 'measure' | 'think' | 'act' | 'summary';
type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultySettings {
  multiplier: number;
  maxHints: number;
  hintCost: number;
  label: string;
  description: string;
}

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    multiplier: 1,
    maxHints: 10,
    hintCost: 2,
    label: 'সহজ (Easy)',
    description: 'নতুনদের জন্য আদর্শ। বেশি হিন্ট এবং কম পয়েন্ট খরচ।'
  },
  medium: {
    multiplier: 1.5,
    maxHints: 5,
    hintCost: 5,
    label: 'মাঝারি (Medium)',
    description: 'অভিজ্ঞদের জন্য। সীমিত হিন্ট এবং মাঝারি চ্যালেঞ্জ।'
  },
  hard: {
    multiplier: 2,
    maxHints: 2,
    hintCost: 10,
    label: 'কঠিন (Hard)',
    description: 'কৃষি বিশেষজ্ঞদের জন্য। খুব কম হিন্ট এবং উচ্চ ঝুঁকি।'
  }
};

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

interface GameState {
  phase: Phase;
  score: number;
  findings: string[];
  unlockedAchievements: string[];
  difficulty: Difficulty;
  hintsUsed: number;
  currentIssue: RiceIssue | null;
  usedIssueIds: string[];
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'perfect_scout', title: 'নিখুঁত পর্যবেক্ষক (Perfect Scout)', description: 'মাঠের সবকটি লক্ষণ সঠিকভাবে খুঁজে বের করেছেন।', icon: Eye, color: 'text-yellow-400' },
  { id: 'sharp_eye', title: 'তীক্ষ্ণ দৃষ্টি (Sharp Eye)', description: 'প্রথম চেষ্টাতেই সঠিক রোগ নির্ণয় করেছেন।', icon: Brain, color: 'text-yellow-500' },
  { id: 'master_surveyor', title: 'দক্ষ পরিমাপক (Master Surveyor)', description: 'ক্ষতির পরিমাণ নিখুঁতভাবে পরিমাপ করেছেন।', icon: Ruler, color: 'text-yellow-400' },
  { id: 'risk_analyst', title: 'ঝুঁকি বিশ্লেষক (Risk Analyst)', description: 'পরিবেশ ও আবহাওয়ার ঝুঁকি সঠিকভাবে বুঝতে পেরেছেন।', icon: CloudSun, color: 'text-yellow-500' },
  { id: 'ipm_strategist', title: 'আইপিএম বিশেষজ্ঞ (IPM Strategist)', description: 'সঠিক ও টেকসই বালাই ব্যবস্থাপনা গ্রহণ করেছেন।', icon: ShieldCheck, color: 'text-yellow-400' },
  { id: 'smart_farmer', title: 'স্মার্ট কৃষিবিদ (Smart Farmer)', description: '১০০/১০০ স্কোর নিয়ে সিমুলেশন সম্পন্ন করেছেন।', icon: Trophy, color: 'text-yellow-500' },
  { id: 'quick_learner', title: 'দ্রুত শিক্ষার্থী (Quick Learner)', description: 'সফলভাবে সিমুলেশনটি সম্পন্ন করেছেন।', icon: Zap, color: 'text-yellow-400' },
  { id: 'disease_expert', title: 'রোগ বিশেষজ্ঞ (Disease Expert)', description: 'ধানের রোগ সঠিকভাবে শনাক্ত করেছেন।', icon: FlaskConical, color: 'text-red-400' },
  { id: 'pest_detector', title: 'পোকা সনাক্তকারী (Pest Detector)', description: 'ধানের ক্ষতিকর পোকা সঠিকভাবে চিহ্নিত করেছেন।', icon: Bug, color: 'text-yellow-400' },
  { id: 'nutrient_specialist', title: 'পুষ্টি বিশেষজ্ঞ (Nutrient Specialist)', description: 'পুষ্টির অভাব সঠিকভাবে নির্ণয় করেছেন।', icon: Leaf, color: 'text-green-400' }
];

// Helper function to select a random issue
function selectRandomIssue(excludeIds: string[] = []): RiceIssue {
  const availableIssues = ALL_RICE_ISSUES.filter(issue => !excludeIds.includes(issue.id));
  if (availableIssues.length === 0) {
    return ALL_RICE_ISSUES[Math.floor(Math.random() * ALL_RICE_ISSUES.length)];
  }
  return availableIssues[Math.floor(Math.random() * availableIssues.length)];
}

// --- CABI Terminology Constants ---
const CABI_TERMS = {
  observe: "মাঠ পর্যবেক্ষণ ও লক্ষণ অনুসন্ধান (Scouting & Symptom Observation)",
  diagnose: "সমস্যা চিহ্নিতকরণ ও কারণ বিশ্লেষণ (Diagnosis & Cause Analysis)",
  measure: "ক্ষতির মাত্রা ও অর্থনৈতিক দ্বারপ্রান্ত (Damage Assessment & ETL)",
  think: "পরিবেশ, আবহাওয়া ও ঝুঁকি পর্যালোচনা (Risk & Context Evaluation)",
  act: "সমন্বিত বালাই ব্যবস্থাপনা ও সিদ্ধান্ত (IPM & Decision Making)"
};

const ENCYCLOPEDIA_DATA = [
  {
    id: 'blb',
    title: 'ব্যাকটেরিয়া জনিত ধসা রোগ (BLB)',
    category: 'রোগ (Disease)',
    desc: 'এটি ধানের একটি মারাত্মক ব্যাকটেরিয়া জনিত রোগ। পাতার কিনারা বরাবর ঢেউখেলানো হলুদ বা সাদাটে দাগ দেখা যায়।',
    symptoms: ['পাতার কিনারা শুকিয়ে যাওয়া', 'ঢেউখেলানো হলুদ দাগ', 'গাছ দ্রুত শুকিয়ে যাওয়া'],
    management: ['ইউরিয়া সার বন্ধ করা', 'জমির পানি বের করে দেওয়া', 'পটাশ সার প্রয়োগ করা'],
    icon: FlaskConical,
    color: 'bg-red-100 text-red-600'
  },
  {
    id: 'blast',
    title: 'ধানের ব্লাস্ট রোগ (Rice Blast)',
    category: 'রোগ (Disease)',
    desc: 'ছত্রাকজনিত এই রোগে পাতার ওপর চোখের মতো বা নৌকার মতো দাগ পড়ে। এটি ধান গাছের পাতা, গিঁট এবং শীষ আক্রমণ করে।',
    symptoms: ['পাতায় চোখের মতো দাগ', 'গিঁট কালো হয়ে ভেঙে যাওয়া', 'শীষ সাদা হয়ে যাওয়া (চিটা)'],
    management: ['প্রতিরোধক জাত ব্যবহার', 'জমিতে পর্যাপ্ত পানি রাখা', 'সুষম সার প্রয়োগ'],
    icon: FlaskConical,
    color: 'bg-yellow-100 text-yellow-600'
  },
  {
    id: 'bph',
    title: 'বাদামী গাছ ফড়িং (BPH)',
    category: 'পোকা (Pest)',
    desc: 'এই পোকা ধান গাছের গোড়ায় বসে রস চুষে খায়, ফলে গাছ পুড়ে যাওয়ার মতো দেখায় যাকে "হপার বার্ন" বলে।',
    symptoms: ['গাছের গোড়ায় পোকার উপস্থিতি', 'গাছ পুড়ে যাওয়ার মতো হলুদ হওয়া', 'চক্রাকারে গাছ মরে যাওয়া'],
    management: ['আলোক ফাঁদ ব্যবহার', 'বিলি পদ্ধতি অনুসরণ', 'হাঁস পালন'],
    icon: Bug,
    color: 'bg-yellow-100 text-yellow-600'
  },
  {
    id: 'gallmidge',
    title: 'নলি মাছি (Gall Midge)',
    category: 'পোকা (Pest)',
    desc: 'এই পোকার আক্রমণে ধানের কুশি পেঁয়াজ পাতার মতো হয়ে যায়, যাকে "পেঁয়াজ পাতা" বা "সিলভার শুট" বলে।',
    symptoms: ['কুশি পেঁয়াজ পাতার মতো হওয়া', 'শীষ না আসা', 'গাছ খাটো হয়ে যাওয়া'],
    management: ['আলোক ফাঁদ ব্যবহার', 'সুষম পটাশ সার প্রয়োগ', 'প্রতিরোধক জাত চাষ'],
    icon: Bug,
    color: 'bg-green-100 text-green-600'
  },
  {
    id: 'etl',
    title: 'অর্থনৈতিক দ্বারপ্রান্ত (ETL)',
    category: 'পরিমাপ (Measurement)',
    desc: 'পোকা বা রোগের এমন একটি পর্যায় যখন দমন ব্যবস্থা গ্রহণ না করলে ফসলের আর্থিক ক্ষতি দমনের খরচের চেয়ে বেশি হয়।',
    symptoms: ['ক্ষতির শতাংশ পরিমাপ', 'আক্রান্ত গাছের সংখ্যা গণনা'],
    management: ['নিয়মিত মাঠ পর্যবেক্ষণ', 'সঠিক সময়ে সিদ্ধান্ত গ্রহণ'],
    icon: Ruler,
    color: 'bg-yellow-100 text-yellow-600'
  },
  {
    id: 'biocontrol',
    title: 'জৈবিক দমন (Biological Control)',
    category: 'পদ্ধতি (Method)',
    desc: 'ক্ষতিকারক পোকা দমনের জন্য বন্ধু পোকা, পাখি বা অন্যান্য প্রাকৃতিক শত্রুর ব্যবহার। এটি পরিবেশবান্ধব পদ্ধতি।',
    symptoms: ['বন্ধু পোকার উপস্থিতি', 'প্রাকৃতিক ভারসাম্য রক্ষা', 'বিষমুক্ত ফসল'],
    management: ['বন্ধু পোকা সংরক্ষণ', 'পার্চিং (ডাল পোতা)', 'রাসায়নিক বিষ পরিহার'],
    icon: ShieldCheck,
    color: 'bg-green-100 text-green-600'
  },
  {
    id: 'ipm',
    title: 'সমন্বিত বালাই ব্যবস্থাপনা (IPM)',
    category: 'পদ্ধতি (Method)',
    desc: 'পরিবেশকে রক্ষা করে পোকা ও রোগ দমনের একটি বিজ্ঞানসম্মত পদ্ধতি। এতে রাসায়নিকের চেয়ে সাংস্কৃতিক ও জৈবিক দমনে গুরুত্ব দেওয়া হয়।',
    symptoms: ['সাংস্কৃতিক দমন', 'যান্ত্রিক দমন', 'জৈবিক দমন', 'রাসায়নিক দমন (সর্বশেষ উপায়)'],
    management: ['আলোর ফাঁদ ব্যবহার', 'উপকারী পোকা সংরক্ষণ', 'সুষম সার ব্যবহার'],
    icon: ShieldCheck,
    color: 'bg-green-100 text-green-600'
  },
  {
    id: 'abiotic',
    title: 'অজীবজ সমস্যা (Abiotic Stress)',
    category: 'পরিবেশ (Environment)',
    desc: 'জীবিত কোনো মাধ্যম ছাড়াই যখন ফসলের ক্ষতি হয়। যেমন: খরা, অতিরিক্ত লবণাক্ততা বা পুষ্টির অভাব।',
    symptoms: ['পাতার রঙ পরিবর্তন', 'গাছের বৃদ্ধি কমে যাওয়া'],
    management: ['সঠিক সেচ ব্যবস্থাপনা', 'সুষম সার প্রয়োগ'],
    icon: ThermometerSun,
    color: 'bg-yellow-100 text-yellow-600'
  },
  {
    id: 'scouting',
    title: 'মাঠ পর্যবেক্ষণ (Scouting)',
    category: 'পদ্ধতি (Method)',
    desc: 'মাঠের বিভিন্ন পয়েন্ট থেকে নমুনা সংগ্রহ করে ফসলের অবস্থা বোঝার প্রক্রিয়া। সাধারণত "W" প্যাটার্নে হাঁটতে হয়।',
    symptoms: ['পুরো মাঠ কভার করা', 'এলোমেলোভাবে নমুনা না নেওয়া'],
    management: ['সপ্তাহে অন্তত দুইবার পর্যবেক্ষণ'],
    icon: Eye,
    color: 'bg-yellow-100 text-yellow-600'
  }
];

const Encyclopedia = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-green-950/90 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-green-900 w-full max-w-4xl max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-2 border-yellow-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-yellow-500/30 flex justify-between items-center bg-green-800">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-500 text-green-950 p-2 rounded-xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white italic">কৃষি বিশ্বকোষ (Encyclopedia)</h2>
                  <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest">স্মার্ট কৃষকের জ্ঞান ভাণ্ডার</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-green-700 rounded-full transition-colors text-yellow-400 hover:text-white"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-3 gap-6">
              {/* Sidebar List */}
              <div className="md:col-span-1 space-y-3">
                {ENCYCLOPEDIA_DATA.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-3 border-2
                      ${selectedId === item.id 
                        ? 'bg-yellow-500 border-yellow-400 text-green-950 shadow-lg scale-[1.02]' 
                        : 'bg-green-800 border-green-700 hover:border-yellow-500/50 text-white'}
                    `}
                  >
                    <item.icon className={`w-5 h-5 ${selectedId === item.id ? 'text-green-950' : 'text-yellow-400'}`} />
                    <span className="font-bold text-sm">{item.title}</span>
                  </button>
                ))}
              </div>

              {/* Details Area */}
              <div className="md:col-span-2 bg-green-800 rounded-3xl p-8 border border-yellow-500/30">
                {selectedId ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedId}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-6"
                    >
                      {(() => {
                        const item = ENCYCLOPEDIA_DATA.find(i => i.id === selectedId)!;
                        return (
                          <>
                            <div className="flex items-center gap-4">
                              <div className={`p-4 rounded-2xl ${item.color}`}>
                                <item.icon className="w-10 h-10" />
                              </div>
                              <div>
                                <div className="text-xs font-black uppercase tracking-widest text-yellow-400">{item.category}</div>
                                <h3 className="text-2xl font-black text-white">{item.title}</h3>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <p className="text-white/90 font-medium leading-relaxed text-lg">
                                {item.desc}
                              </p>

                              <div className="grid sm:grid-cols-2 gap-4">
                                <div className="bg-green-900 p-5 rounded-2xl border border-yellow-500/30 shadow-sm">
                                  <h4 className="font-black text-yellow-400 mb-3 flex items-center gap-2">
                                    <Search className="w-4 h-4" /> লক্ষণসমূহ
                                  </h4>
                                  <ul className="space-y-2">
                                    {item.symptoms.map((s, i) => (
                                      <li key={i} className="text-sm text-white/80 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full" /> {s}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="bg-green-900 p-5 rounded-2xl border border-yellow-500/30 shadow-sm">
                                  <h4 className="font-black text-yellow-400 mb-3 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> ব্যবস্থাপনা
                                  </h4>
                                  <ul className="space-y-2">
                                    {item.management.map((m, i) => (
                                      <li key={i} className="text-sm text-white/80 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" /> {m}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                    <BookOpen className="w-20 h-20 text-yellow-400/50" />
                    <p className="font-bold text-white/60">বাম পাশ থেকে একটি বিষয় নির্বাচন করুন</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const VisualAidTooltip = ({ text, children }: { text: string, children: React.ReactNode, key?: React.Key }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-green-900 text-white text-xs rounded-lg shadow-xl z-[60] text-center pointer-events-none border border-yellow-500/30"
          >
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-900 rotate-45 border-r border-b border-yellow-500/30" />
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Components ---
const FarmerAvatar = ({ className = "w-12 h-12", mood = "normal" }: { className?: string, mood?: "normal" | "happy" | "sad" | "thinking" | "walking" }) => {
  const variants = {
    normal: { y: [0, -2, 0], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } },
    walking: { y: [0, -6, 0], rotate: [-5, 5, -5], transition: { repeat: Infinity, duration: 0.4, ease: "easeInOut" } },
    happy: { y: [0, -8, 0], transition: { repeat: Infinity, duration: 0.6, ease: "easeOut" } },
    sad: { y: 2, scaleY: 0.95, transition: { duration: 0.5 } },
    thinking: { y: [0, -2, 0], rotate: [0, -2, 2, 0], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } }
  };

  return (
    <motion.div 
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      variants={variants}
      animate={mood}
    >
      <div className="absolute inset-0 bg-amber-100 rounded-full border-2 border-amber-600 shadow-md overflow-hidden flex items-end justify-center">
        <div className="w-3/4 h-[45%] bg-green-600 rounded-t-3xl" />
      </div>
      <div className="absolute top-[35%] w-[55%] h-[45%] bg-orange-200 rounded-full border border-orange-300 flex flex-col items-center justify-center gap-0.5">
        <motion.div 
          className="flex gap-2 w-full justify-center px-1"
          animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
          transition={{ repeat: Infinity, duration: 4, times: [0, 0.45, 0.5, 0.55, 1] }}
        >
          <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
          <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
        </motion.div>
        {mood === 'happy' && <div className="w-3 h-1.5 border-b-2 border-slate-800 rounded-b-full mt-0.5" />}
        {mood === 'sad' && <div className="w-3 h-1.5 border-t-2 border-slate-800 rounded-t-full mt-1" />}
        {(mood === 'normal' || mood === 'walking') && <div className="w-3 h-0.5 bg-slate-800 mt-1" />}
        {mood === 'thinking' && <div className="w-2 h-2 border-2 border-slate-800 rounded-full mt-0.5" />}
      </div>
      <div className="absolute top-[10%] w-[80%] h-[30%] bg-amber-500 rounded-t-full z-10" />
      <div className="absolute top-[35%] w-[110%] h-2 bg-amber-600 rounded-full z-10 shadow-sm" />
      
      <AnimatePresence>
        {mood === 'thinking' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
            className="absolute -top-2 -right-2 flex flex-col items-end gap-1 z-20"
          >
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full border border-yellow-500" />
            <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full border border-yellow-500 mr-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const AvatarDialog = ({ text, mood = "normal" }: { text: string, mood?: "normal" | "happy" | "sad" | "thinking" | "walking" }) => (
  <div className="flex items-start max-w-2xl">
    <FarmerAvatar className="w-16 h-16" mood={mood} />
    <motion.div 
      initial={{ opacity: 0, x: -10, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="bg-green-800 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm border border-yellow-500/30 relative ml-3 mt-2"
    >
      <div className="absolute -left-2 top-0 w-4 h-4 bg-green-800 border-l border-t border-yellow-500/30 transform -skew-x-12" />
      <p className="text-white font-medium relative z-10 leading-relaxed">{text}</p>
    </motion.div>
  </div>
);

const HintButton = ({ hint, onUse, score, soundEnabled, difficulty, hintsUsed }: { hint: string, onUse: () => void, score: number, soundEnabled: boolean, difficulty: Difficulty, hintsUsed: number }) => {
  const [show, setShow] = useState(false);
  const [used, setUsed] = useState(false);
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const isExhausted = hintsUsed >= settings.maxHints && !used;

  const handleUse = () => {
    if (used) {
      setShow(!show);
      playSound('click', soundEnabled);
      return;
    }
    if (isExhausted || score < settings.hintCost) return;
    onUse();
    setUsed(true);
    setShow(true);
  };

  return (
    <div className="relative">
      <button
        onClick={handleUse}
        disabled={isExhausted && !used}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm
          ${used 
            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' 
            : isExhausted
              ? 'bg-green-900/50 text-white/40 cursor-not-allowed border border-green-700'
              : score >= settings.hintCost 
                ? 'bg-green-800 text-yellow-400 hover:bg-green-700 border border-yellow-500/30' 
                : 'bg-green-900/50 text-white/40 cursor-not-allowed border border-green-700'}
        `}
      >
        <Lightbulb className={`w-4 h-4 ${used ? 'fill-yellow-400 text-yellow-400' : ''}`} />
        {used 
          ? (show ? 'হিন্ট লুকান' : 'হিন্ট দেখুন') 
          : isExhausted 
            ? 'হিন্ট শেষ' 
            : `হিন্ট নিন (-${settings.hintCost} পয়েন্ট)`}
      </button>
      
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-3 right-0 w-64 p-4 bg-green-800 border-2 border-yellow-500/50 rounded-2xl shadow-xl z-50 text-yellow-100 text-sm font-medium leading-relaxed"
          >
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-green-800 border-r-2 border-b-2 border-yellow-500/50 transform rotate-45" />
            {hint}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'intro',
    score: 0,
    findings: [],
    unlockedAchievements: [],
    difficulty: 'easy',
    hintsUsed: 0,
    currentIssue: null,
    usedIssueIds: []
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null);
  const [isEncyclopediaOpen, setIsEncyclopediaOpen] = useState(false);

  const unlockAchievement = (id: string) => {
    if (gameState.unlockedAchievements.includes(id)) return;
    
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (achievement) {
      playSound('success', soundEnabled);
      setShowAchievement(achievement);
      setGameState(prev => ({
        ...prev,
        unlockedAchievements: [...prev.unlockedAchievements, id]
      }));
      setTimeout(() => setShowAchievement(null), 4000);
    }
  };

  const updatePhase = (newPhase: Phase) => {
    playSound('complete', soundEnabled);
    setGameState(prev => ({ ...prev, phase: newPhase }));
    
    if (newPhase === 'summary') {
      unlockAchievement('quick_learner');
      if (gameState.score >= 100) {
        unlockAchievement('smart_farmer');
      }
    }
  };
  
  const addScore = (points: number) => {
    const multiplier = DIFFICULTY_SETTINGS[gameState.difficulty].multiplier;
    setGameState(prev => ({ ...prev, score: prev.score + Math.round(points * multiplier) }));
  };

  const deductScore = (points: number) => {
    if (gameState.hintsUsed >= DIFFICULTY_SETTINGS[gameState.difficulty].maxHints) return;
    playSound('think', soundEnabled);
    setGameState(prev => ({ ...prev, score: Math.max(0, prev.score - points), hintsUsed: prev.hintsUsed + 1 }));
  };
  
  const addFinding = (finding: string) => {
    playSound('success', soundEnabled);
    setGameState(prev => ({ ...prev, findings: [...prev.findings, finding] }));
  };

  const resetGame = () => {
    playSound('click', soundEnabled);
    // Select a new random issue for the next game
    const newIssue = selectRandomIssue([]);
    setGameState({ 
      phase: 'intro', 
      score: 0, 
      findings: [], 
      unlockedAchievements: [], 
      difficulty: 'easy', 
      hintsUsed: 0,
      currentIssue: null,
      usedIssueIds: []
    });
  };

  const startGameWithIssue = () => {
    playSound('click', soundEnabled);
    const newIssue = selectRandomIssue(gameState.usedIssueIds);
    setGameState(prev => ({ 
      ...prev, 
      phase: 'observe',
      currentIssue: newIssue,
      usedIssueIds: [...prev.usedIssueIds, newIssue.id]
    }));
  };

  const setDifficulty = (difficulty: Difficulty) => {
    setGameState(prev => ({ ...prev, difficulty }));
  };

  return (
    <div className="min-h-screen bg-green-950 text-white font-sans selection:bg-yellow-300 selection:text-green-950">
      {/* Achievement Notification */}
      <AnimatePresence>
        {showAchievement && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4"
          >
            <div className="bg-green-900 text-white p-4 rounded-2xl shadow-2xl border-2 border-yellow-400/50 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-yellow-500/20 text-yellow-400`}>
                <showAchievement.icon className="w-8 h-8" />
              </div>
              <div>
                <div className="text-xs font-black text-yellow-400 uppercase tracking-widest mb-1">অর্জন আনলক হয়েছে!</div>
                <div className="font-black text-lg leading-tight text-white">{showAchievement.title}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Top Navigation / Progress Bar */}
      {gameState.phase !== 'intro' && (
        <header className="bg-green-900 border-b-2 border-yellow-500/30 sticky top-0 z-50 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-400 font-bold text-lg">
              <Leaf className="w-6 h-6" />
              <span>ফসল ফতোয়া (Crop Call)</span>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium text-white">
              <button 
                onClick={() => {
                  playSound('click', soundEnabled);
                  setIsEncyclopediaOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-800 text-yellow-400 hover:bg-green-700 transition-colors font-bold border border-yellow-500/30"
                title="এনসাইক্লোপিডিয়া দেখুন"
              >
                <BookOpen className="w-5 h-5" />
                <span className="hidden sm:inline">এনসাইক্লোপিডিয়া</span>
              </button>
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-xl bg-green-800 hover:bg-green-700 transition-colors text-yellow-400 border border-yellow-500/30"
                title={soundEnabled ? "শব্দ বন্ধ করুন" : "শব্দ চালু করুন"}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <span className="flex items-center gap-1 bg-yellow-500 text-green-950 px-3 py-1 rounded-full font-bold">
                <Target className="w-4 h-4" /> স্কোর: {gameState.score}
              </span>
            </div>
          </div>
          {/* Progress Indicator */}
          <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center text-xs sm:text-sm overflow-x-auto">
            {['observe', 'diagnose', 'measure', 'think', 'act'].map((p, i) => {
              const phases = ['observe', 'diagnose', 'measure', 'think', 'act'];
              const currentIndex = phases.indexOf(gameState.phase);
              const isPast = i < currentIndex;
              const isCurrent = p === gameState.phase;
              
              return (
                <div key={p} className={`flex items-center gap-2 whitespace-nowrap ${isCurrent ? 'text-yellow-400 font-bold' : isPast ? 'text-yellow-500' : 'text-white/40'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isCurrent ? 'border-yellow-400 bg-yellow-500/20' : isPast ? 'border-yellow-500 bg-yellow-500 text-green-950' : 'border-white/30'}`}>
                    {isPast ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="hidden sm:inline capitalize">{p}</span>
                  {i < 4 && <div className={`w-4 sm:w-8 h-0.5 ${isPast ? 'bg-yellow-500' : 'bg-white/20'}`} />}
                </div>
              );
            })}
          </div>
        </header>
      )}

      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {gameState.phase === 'intro' && <IntroScreen key="intro" onStart={startGameWithIssue} difficulty={gameState.difficulty} onDifficultyChange={setDifficulty} />}
          {gameState.phase === 'observe' && <PhaseObserve key="observe" soundEnabled={soundEnabled} score={gameState.score} hintsUsed={gameState.hintsUsed} onUseHint={() => deductScore(DIFFICULTY_SETTINGS[gameState.difficulty].hintCost)} onUnlockAchievement={unlockAchievement} onComplete={(f) => { addFinding(f); addScore(20); updatePhase('diagnose'); }} difficulty={gameState.difficulty} currentIssue={gameState.currentIssue} />}
          {gameState.phase === 'diagnose' && <PhaseDiagnose key="diagnose" soundEnabled={soundEnabled} score={gameState.score} hintsUsed={gameState.hintsUsed} onUseHint={() => deductScore(DIFFICULTY_SETTINGS[gameState.difficulty].hintCost)} onUnlockAchievement={unlockAchievement} onComplete={(f) => { addFinding(f); addScore(20); updatePhase('measure'); }} difficulty={gameState.difficulty} currentIssue={gameState.currentIssue} />}
          {gameState.phase === 'measure' && <PhaseMeasure key="measure" soundEnabled={soundEnabled} score={gameState.score} hintsUsed={gameState.hintsUsed} onUseHint={() => deductScore(DIFFICULTY_SETTINGS[gameState.difficulty].hintCost)} onUnlockAchievement={unlockAchievement} onComplete={(f) => { addFinding(f); addScore(20); updatePhase('think'); }} difficulty={gameState.difficulty} currentIssue={gameState.currentIssue} />}
          {gameState.phase === 'think' && <PhaseThink key="think" soundEnabled={soundEnabled} score={gameState.score} hintsUsed={gameState.hintsUsed} onUseHint={() => deductScore(DIFFICULTY_SETTINGS[gameState.difficulty].hintCost)} onUnlockAchievement={unlockAchievement} onComplete={(f) => { addFinding(f); addScore(20); updatePhase('act'); }} difficulty={gameState.difficulty} currentIssue={gameState.currentIssue} />}
          {gameState.phase === 'act' && <PhaseAct key="act" soundEnabled={soundEnabled} score={gameState.score} hintsUsed={gameState.hintsUsed} onUseHint={() => deductScore(DIFFICULTY_SETTINGS[gameState.difficulty].hintCost)} onUnlockAchievement={unlockAchievement} onComplete={(f) => { addFinding(f); addScore(20); updatePhase('summary'); }} difficulty={gameState.difficulty} currentIssue={gameState.currentIssue} />}
          {gameState.phase === 'summary' && <SummaryScreen key="summary" state={gameState} onRestart={resetGame} soundEnabled={soundEnabled} />}
        </AnimatePresence>
      </main>

      <Encyclopedia isOpen={isEncyclopediaOpen} onClose={() => setIsEncyclopediaOpen(false)} />
    </div>
  );
}

// --- Collapsible Instructions Guide ---
const InstructionsGuide = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-green-800/50 backdrop-blur-md border-2 border-yellow-500/30 rounded-2xl p-4 flex items-center justify-between group hover:bg-green-800/70 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500 text-green-950 p-2 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-bold text-yellow-400">কিভাবে খেলবেন? (How to Play)</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronRight className="w-5 h-5 text-yellow-400 rotate-90" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-green-900/80 backdrop-blur-md border-2 border-yellow-500/30 rounded-b-2xl p-6 mt-1 space-y-4">
              {/* Game Overview */}
              <div className="space-y-2">
                <h3 className="font-black text-yellow-400 flex items-center gap-2">
                  <Target className="w-5 h-5" /> গেমের লক্ষ্য
                </h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  এই গেমে আপনি একজন কৃষি বিশেষজ্ঞ হিসেবে ধান ক্ষেতের সমস্যা নির্ণয় ও সমাধান করবেন। প্রতিবার নতুন রোগ, পোকা বা পুষ্টির অভাবের সমস্যা এলোমেলোভাবে আসবে।
                </p>
              </div>
              
              {/* 5 Phases */}
              <div className="space-y-2">
                <h3 className="font-black text-yellow-400 flex items-center gap-2">
                  <Activity className="w-5 h-5" /> ৫টি ধাপ (5 Phases)
                </h3>
                <div className="grid gap-2">
                  <div className="bg-green-800/50 p-3 rounded-xl flex items-start gap-3">
                    <div className="bg-yellow-500 text-green-950 w-6 h-6 rounded-full flex items-center justify-center font-black text-sm shrink-0">১</div>
                    <div>
                      <div className="font-bold text-white text-sm">পর্যবেক্ষণ (Observe)</div>
                      <div className="text-white/60 text-xs">মাঠে 'W' প্যাটার্নে হেঁটে লক্ষণ খুঁজুন</div>
                    </div>
                  </div>
                  <div className="bg-green-800/50 p-3 rounded-xl flex items-start gap-3">
                    <div className="bg-yellow-500 text-green-950 w-6 h-6 rounded-full flex items-center justify-center font-black text-sm shrink-0">২</div>
                    <div>
                      <div className="font-bold text-white text-sm">নির্ণয় (Diagnose)</div>
                      <div className="text-white/60 text-xs">লক্ষণ বিশ্লেষণ করে সমস্যা চিহ্নিত করুন</div>
                    </div>
                  </div>
                  <div className="bg-green-800/50 p-3 rounded-xl flex items-start gap-3">
                    <div className="bg-yellow-500 text-green-950 w-6 h-6 rounded-full flex items-center justify-center font-black text-sm shrink-0">৩</div>
                    <div>
                      <div className="font-bold text-white text-sm">পরিমাপ (Measure)</div>
                      <div className="text-white/60 text-xs">আক্রান্ত গাছের সংখ্যা গণনা করুন</div>
                    </div>
                  </div>
                  <div className="bg-green-800/50 p-3 rounded-xl flex items-start gap-3">
                    <div className="bg-yellow-500 text-green-950 w-6 h-6 rounded-full flex items-center justify-center font-black text-sm shrink-0">৪</div>
                    <div>
                      <div className="font-bold text-white text-sm">বিশ্লেষণ (Think)</div>
                      <div className="text-white/60 text-xs">আবহাওয়ার ঝুঁকি মূল্যায়ন করুন</div>
                    </div>
                  </div>
                  <div className="bg-green-800/50 p-3 rounded-xl flex items-start gap-3">
                    <div className="bg-yellow-500 text-green-950 w-6 h-6 rounded-full flex items-center justify-center font-black text-sm shrink-0">৫</div>
                    <div>
                      <div className="font-bold text-white text-sm">পদক্ষেপ (Act)</div>
                      <div className="text-white/60 text-xs">IPM অনুযায়ী সঠিক ব্যবস্থাপনা বেছে নিন</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tips */}
              <div className="space-y-2">
                <h3 className="font-black text-yellow-400 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" /> টিপস
                </h3>
                <ul className="text-white/80 text-sm space-y-1">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> এনসাইক্লোপিডিয়া থেকে শিখুন</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> হিন্ট ব্যবহার করলে পয়েন্ট কমবে</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> প্রতিবার নতুন সমস্যা আসবে</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> কঠিন মোডে বেশি পয়েন্ট পাবেন</li>
                </ul>
              </div>
              
              {/* Issue Types */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="bg-red-500/20 border border-red-500/30 p-2 rounded-xl text-center">
                  <FlaskConical className="w-6 h-6 text-red-400 mx-auto" />
                  <div className="text-xs text-white font-medium mt-1">রোগ</div>
                  <div className="text-[10px] text-white/50">৫টি</div>
                </div>
                <div className="bg-yellow-500/20 border border-yellow-500/30 p-2 rounded-xl text-center">
                  <Bug className="w-6 h-6 text-yellow-400 mx-auto" />
                  <div className="text-xs text-white font-medium mt-1">পোকা</div>
                  <div className="text-[10px] text-white/50">৫টি</div>
                </div>
                <div className="bg-green-500/20 border border-green-500/30 p-2 rounded-xl text-center">
                  <Leaf className="w-6 h-6 text-green-400 mx-auto" />
                  <div className="text-xs text-white font-medium mt-1">পুষ্টি</div>
                  <div className="text-[10px] text-white/50">৮টি</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Phase Components ---

function IntroScreen({ onStart, difficulty, onDifficultyChange }: { onStart: () => void; difficulty: Difficulty; onDifficultyChange: (d: Difficulty) => void; key?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="relative min-h-[80vh] flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden rounded-[3rem] shadow-2xl mt-10 max-w-5xl mx-auto"
    >
      {/* Cinematic Background Layer - Dark Green */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-green-950" />
        <motion.div 
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.3 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/30 via-green-950/70 to-green-950" />
        <div className="absolute inset-0 bg-grid-white opacity-10" />
      </div>

      {/* Floating Clouds for Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Cloud className="absolute top-10 left-[-10%] text-white/10 w-40 h-40 animate-cloud" />
        <Cloud className="absolute top-40 left-[-20%] text-white/5 w-60 h-60 animate-cloud" style={{ animationDelay: '-15s', animationDuration: '80s' }} />
      </div>

      <div className="relative z-10 max-w-4xl w-full text-center space-y-12">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <div className="inline-block px-6 py-2 bg-yellow-500/30 backdrop-blur-md border-2 border-yellow-400/60 rounded-full text-yellow-300 font-black text-sm uppercase tracking-[0.3em] mb-6">
            🌾 Crop Call - কৃষি সিদ্ধান্ত গেম 🌾
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white italic leading-none tracking-tighter mb-4 drop-shadow-lg">
            ফসল ফতোয়া <span className="text-yellow-400 block md:inline drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]">(Crop Call)</span>
          </h1>
          <p className="text-white/90 text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
            🎯 আপনার ফসল, আপনার সিদ্ধান্ত! ধানের রোগ শনাক্তকরণ ও সঠিক ব্যবস্থাপনার রোমাঞ্চকর গেম।
          </p>
        </motion.div>

        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-green-900/80 backdrop-blur-md p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-2xl border-2 border-yellow-500/30"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500/30 blur-2xl rounded-full animate-pulse" />
            <FarmerAvatar className="w-32 h-32 md:w-40 md:h-40 relative z-10" mood="normal" />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-black text-yellow-400 mb-3 italic">সালাম! আমি কৃষক রহিম।</h2>
            <p className="text-white/90 text-xl leading-relaxed font-medium">
              আমার ধানের জমিতে একটি <span className="text-red-400 font-bold">রহস্যময় সমস্যা</span> দেখা দিয়েছে। সঠিক কারণ নির্ণয় করে বিজ্ঞানভিত্তিক সমাধান দিতে আমার সাথে মাঠে চলুন।
            </p>
          </div>
        </motion.div>

        {/* Collapsible Instructions Guide */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <InstructionsGuide />
        </motion.div>

        {/* Difficulty Selection */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="space-y-6"
        >
          <h3 className="text-2xl font-black text-white italic">গেমের ধরন নির্বাচন করুন <span className="text-yellow-400">(Select Difficulty)</span>:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map((d) => {
              const settings = DIFFICULTY_SETTINGS[d];
              const isSelected = difficulty === d;
              return (
                <button
                  key={d}
                  onClick={() => onDifficultyChange(d)}
                  className={`p-6 rounded-3xl border-4 transition-all text-left group relative overflow-hidden
                    ${isSelected 
                      ? 'bg-yellow-500 border-yellow-400 text-green-950 shadow-[0_0_30px_rgba(250,204,21,0.5)]' 
                      : 'bg-green-900/50 border-green-700/50 text-white hover:bg-green-800/50 hover:border-green-600'}
                  `}
                >
                  <div className={`font-black text-xl mb-1 ${isSelected ? 'text-green-950' : 'text-yellow-400'}`}>{settings.label}</div>
                  <div className={`text-sm font-medium leading-tight ${isSelected ? 'text-green-900' : 'text-white/70'}`}>{settings.description}</div>
                  {isSelected && (
                    <motion.div layoutId="diff-check" className="absolute top-4 right-4">
                      <CheckCircle className="w-6 h-6 text-green-800" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.button 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.6 }}
          onClick={onStart}
          className="group relative bg-red-600 hover:bg-red-500 text-white px-16 py-6 rounded-[2rem] font-black text-2xl shadow-[0_20px_40px_-10px_rgba(220,38,38,0.5)] transition-all active:scale-95 flex items-center gap-4 mx-auto overflow-hidden border-2 border-red-400"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          সিমুলেশন শুরু করুন 
          <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
        </motion.button>
      </div>
    </motion.div>
  );
}

function PhaseObserve({ onComplete, soundEnabled, score, hintsUsed, onUseHint, onUnlockAchievement, difficulty, currentIssue }: { onComplete: (f: string) => void; soundEnabled: boolean; score: number; hintsUsed: number; onUseHint: () => void; onUnlockAchievement: (id: string) => void; difficulty: Difficulty; currentIssue: RiceIssue | null; key?: string }) {
  const getHotspots = (d: Difficulty) => {
    if (d === 'easy') return [2, 12, 24];
    if (d === 'medium') return [2, 7, 18, 24];
    return [2, 7, 12, 18, 24];
  };
  const hotspots = getHotspots(difficulty);
  const [found, setFound] = useState<number[]>([]);
  const [avatarPos, setAvatarPos] = useState<number | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [justFound, setJustFound] = useState(false);

  // Get issue-specific information
  const issueTypeLabel = currentIssue?.type === 'disease' ? 'রোগ' : currentIssue?.type === 'pest' ? 'পোকা' : 'পুষ্টির অভাব';
  const issueHint = currentIssue ? currentIssue.symptoms[0] : 'মাঠের কোণগুলোতে এবং মাঝখানে ভালো করে লক্ষ্য করুন।';

  useEffect(() => {
    if (found.length === 5) {
      onUnlockAchievement('perfect_scout');
    }
  }, [found.length]);

  const handleClick = (index: number) => {
    if (avatarPos === index || isWalking) return;
    
    setIsWalking(true);
    playSound('walk', soundEnabled);
    setAvatarPos(index);
    setJustFound(false);

    setTimeout(() => {
      setIsWalking(false);
      if (hotspots.includes(index) && !found.includes(index)) {
        setFound(prev => [...prev, index]);
        setJustFound(true);
        playSound('success', soundEnabled);
        setTimeout(() => setJustFound(false), 1500);
      }
    }, 600);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-green-800 border border-yellow-500/30 p-6 rounded-3xl">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-3xl font-black text-white flex items-center gap-3 italic">
            <Eye className="w-10 h-10 text-yellow-400" /> {CABI_TERMS.observe}
          </h2>
          <HintButton 
            hint={currentIssue ? `${currentIssue.symptomDetails.leaf} ${currentIssue.symptomDetails.overall}` : "মাঠের কোণগুলোতে এবং মাঝখানে ভালো করে লক্ষ্য করুন। 'W' প্যাটার্নে হাঁটলে সবকটি লক্ষণ পাওয়া সহজ হয়।"} 
            onUse={onUseHint} 
            score={score} 
            soundEnabled={soundEnabled} 
            difficulty={difficulty}
            hintsUsed={hintsUsed}
          />
        </div>
        <AvatarDialog text={`আসুন মাঠের গভীরে যাই। 'W' প্যাটার্নে হেঁটে ${hotspots.length}টি পয়েন্ট থেকে নমুনা সংগ্রহ করি। ${currentIssue ? `${currentIssue.bengaliName}-এর লক্ষণ খুঁজে বের করুন।` : 'মাটির ঘ্রাণ আর ধানের পাতার অবস্থা আমাদের অনেক কিছু বলবে।'}`} mood="normal" />
      </div>

      <div className="relative aspect-[16/9] md:aspect-[21/9] bg-green-800 rounded-[2rem] shadow-2xl overflow-hidden border-4 border-yellow-500/30">
        {/* Realistic Field Background */}
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 via-transparent to-green-900/20" />
        
        {/* Interactive Grid */}
        <div className="absolute inset-0 p-4 sm:p-8 grid grid-cols-6 grid-rows-5 gap-2 sm:gap-4 z-10">
          {Array.from({ length: 30 }).map((_, i) => {
            const isHotspot = hotspots.includes(i);
            const isFound = found.includes(i);
            const currentMood = isWalking ? "walking" : (justFound && avatarPos === i ? "happy" : "normal");

            return (
              <button
                key={i}
                onClick={() => handleClick(i)}
                className={`relative rounded-2xl flex items-center justify-center transition-all duration-500 group
                  ${isFound ? 'bg-white/20 backdrop-blur-sm shadow-inner' : 'hover:bg-white/10'}
                `}
              >
                {!isFound && (
                  <div className="sway">
                    <Sprout className={`w-8 h-8 sm:w-12 sm:h-12 ${isHotspot ? 'text-yellow-400/60' : 'text-green-600/30'}`} />
                  </div>
                )}
                
                {isFound && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-yellow-500 p-2 rounded-full shadow-lg">
                    <Search className="w-5 h-5 text-green-950" />
                  </motion.div>
                )}
                
                {avatarPos === i && (
                  <motion.div
                    layoutId="farmer-avatar"
                    className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                    transition={{ type: "spring", stiffness: 150, damping: 20 }}
                  >
                    <FarmerAvatar className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-2xl" mood={currentMood} />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* W Path Guide */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" preserveAspectRatio="none">
          <polyline points="5%,20% 25%,80% 50%,20% 75%,80% 95%,20%" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeDasharray="20,20" />
        </svg>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-green-800 border border-yellow-500/30 p-6 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="bg-yellow-500/20 p-3 rounded-2xl">
            <Activity className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-yellow-400 uppercase tracking-widest">নমুনা সংগ্রহ প্রগতি</div>
            <div className="text-2xl font-black text-white">{found.length} <span className="text-white/50">/ {hotspots.length}</span></div>
          </div>
        </div>
        
        <button
          disabled={found.length < hotspots.length}
          onClick={() => onComplete(currentIssue ? `মাঠে 'W' প্যাটার্নে হেঁটে দেখা গেছে: ${currentIssue.symptoms.slice(0, 2).join(', ')}` : "মাঠে 'W' প্যাটার্নে হেঁটে দেখা গেছে কিছু গাছের পাতা হলুদ হয়ে শুকিয়ে যাচ্ছে।")}
          className={`group px-10 py-4 rounded-2xl font-black text-lg flex items-center gap-3 transition-all transform active:scale-95
            ${found.length === hotspots.length 
              ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_10px_20px_-5px_rgba(220,38,38,0.4)]' 
              : 'bg-green-900 text-white/40 cursor-not-allowed border border-green-700'}
          `}
        >
          পরবর্তী ধাপ 
          <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}

function PhaseDiagnose({ onComplete, soundEnabled, score, hintsUsed, onUseHint, onUnlockAchievement, difficulty, currentIssue }: { onComplete: (f: string) => void; soundEnabled: boolean; score: number; hintsUsed: number; onUseHint: () => void; onUnlockAchievement: (id: string) => void; difficulty: Difficulty; currentIssue: RiceIssue | null; key?: string }) {
  const [step, setStep] = useState(0);
  const [selectedCause, setSelectedCause] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [mistakeMade, setMistakeMade] = useState(false);

  // Generate diagnosis options based on current issue type
  const getDiagnosisOptions = () => {
    const correctType = currentIssue?.type || 'disease';
    const correctId = currentIssue?.id || 'blb';
    
    // Get wrong options from other categories
    const wrongDiseases = RICE_DISEASES.filter(d => d.id !== correctId).slice(0, 2);
    const wrongPests = RICE_PESTS.slice(0, 2);
    const wrongDeficiencies = RICE_DEFICIENCIES.slice(0, 2);
    
    // Create options based on correct type
    const options = [];
    
    // Add the correct answer
    options.push({
      id: correctId,
      label: currentIssue?.bengaliName || 'ব্যাকটেরিয়া জনিত ধসা রোগ (BLB)',
      desc: currentIssue?.type === 'disease' ? 'রোগ জনিত সমস্যা' : currentIssue?.type === 'pest' ? 'পোকার আক্রমণ' : 'পুষ্টির অভাব',
      icon: currentIssue?.type === 'disease' ? FlaskConical : currentIssue?.type === 'pest' ? Bug : Leaf,
      correct: true
    });
    
    // Add wrong options
    if (correctType === 'disease') {
      wrongPests.forEach(p => {
        options.push({ id: p.id, label: p.bengaliName, desc: 'পোকা জনিত সমস্যা', icon: Bug, correct: false });
      });
      wrongDeficiencies.forEach(d => {
        options.push({ id: d.id, label: d.bengaliName, desc: 'পুষ্টির অভাব', icon: Leaf, correct: false });
      });
    } else if (correctType === 'pest') {
      wrongDiseases.forEach(d => {
        options.push({ id: d.id, label: d.bengaliName, desc: 'রোগ জনিত সমস্যা', icon: FlaskConical, correct: false });
      });
      wrongDeficiencies.forEach(d => {
        options.push({ id: d.id, label: d.bengaliName, desc: 'পুষ্টির অভাব', icon: Leaf, correct: false });
      });
    } else {
      wrongDiseases.forEach(d => {
        options.push({ id: d.id, label: d.bengaliName, desc: 'রোগ জনিত সমস্যা', icon: FlaskConical, correct: false });
      });
      wrongPests.forEach(p => {
        options.push({ id: p.id, label: p.bengaliName, desc: 'পোকা জনিত সমস্যা', icon: Bug, correct: false });
      });
    }
    
    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
  };

  const causes = useMemo(() => getDiagnosisOptions(), [currentIssue]);

  const handleScan = () => {
    setScanning(true);
    playSound('think', soundEnabled);
    setTimeout(() => {
      setScanning(false);
      setStep(1);
    }, 2000);
  };

  const handleSelect = (cause: typeof causes[0]) => {
    setSelectedCause(cause.id);
    if (cause.correct) {
      playSound('success', soundEnabled);
      if (!mistakeMade) {
        // Award specific achievement based on issue type
        if (currentIssue?.type === 'disease') {
          onUnlockAchievement('disease_expert');
        } else if (currentIssue?.type === 'pest') {
          onUnlockAchievement('pest_detector');
        } else {
          onUnlockAchievement('nutrient_specialist');
        }
        onUnlockAchievement('sharp_eye');
      }
    } else {
      playSound('error', soundEnabled);
      setMistakeMade(true);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 1.1 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-green-800 border border-yellow-500/30 p-6 rounded-3xl">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-3xl font-black text-white flex items-center gap-3 italic">
            <Brain className="w-10 h-10 text-yellow-400" /> {CABI_TERMS.diagnose}
          </h2>
          <HintButton 
            hint={currentIssue ? `${currentIssue.symptomDetails.leaf} এটি ${currentIssue.type === 'disease' ? 'একটি রোগ' : currentIssue.type === 'pest' ? 'পোকার আক্রমণ' : 'পুষ্টির অভাব'}।` : "পাতার কিনারা বরাবর ঢেউখেলানো হলুদ দাগ এবং শুকিয়ে যাওয়া অংশ ব্যাকটেরিয়া জনিত ধসা রোগের (BLB) প্রধান লক্ষণ।"} 
            onUse={onUseHint} 
            score={score} 
            soundEnabled={soundEnabled} 
            difficulty={difficulty}
            hintsUsed={hintsUsed}
          />
        </div>
        <AvatarDialog text="নমুনাগুলো ল্যাবে নিয়ে এসেছি। চলুন মাইক্রোস্কোপের নিচে রেখে দেখি আসলে কী ঘটছে। লক্ষণগুলো খুব মন দিয়ে দেখুন।" mood="thinking" />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* High-Tech Inspection Area */}
        <div className="relative bg-green-950 rounded-[2.5rem] p-4 shadow-2xl border-4 border-green-900 overflow-hidden aspect-square group">
          {/* Realistic Microscope Background */}
          <div className="absolute inset-0 opacity-80 bg-[url('https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-1000 group-hover:scale-110" />
          <div className="absolute inset-0 bg-green-950/20 mix-blend-overlay" />
          
          {/* Digital Scan Line */}
          <div className="scan-line" />

          {/* Lens Flare Effect */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-400/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative h-full w-full rounded-[2rem] overflow-hidden flex flex-col items-center justify-center border-2 border-yellow-500/30 backdrop-blur-[1px]">
            {step === 0 ? (
              <div className="text-center space-y-6 z-10">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-32 h-32 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-yellow-500/30"
                >
                  <Search className="w-16 h-16 text-yellow-400" />
                </motion.div>
                <div className="space-y-2">
                  <p className="text-yellow-400 font-mono text-sm tracking-widest uppercase">System Ready</p>
                  <button
                    onClick={handleScan}
                    disabled={scanning}
                    className="bg-yellow-500 text-green-950 font-black px-10 py-5 rounded-2xl shadow-[0_10px_30px_rgba(250,204,21,0.3)] hover:scale-105 transition-transform disabled:opacity-50 active:scale-95"
                  >
                    {scanning ? 'বিশ্লেষণ চলছে...' : 'বিশ্লেষণ শুরু করুন'}
                  </button>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 bg-green-900/90 backdrop-blur-2xl p-8 rounded-3xl w-full h-full flex flex-col justify-center border border-yellow-500/30 shadow-inner"
              >
                {/* Visual Aid Hotspots */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/4 left-1/3 pointer-events-auto">
                    <VisualAidTooltip text="V-আকৃতির হলুদ দাগ: এটি BLB রোগের প্রধান লক্ষণ।">
                      <div className="w-6 h-6 bg-yellow-400/30 border border-yellow-400 rounded-full animate-pulse flex items-center justify-center">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                      </div>
                    </VisualAidTooltip>
                  </div>
                  <div className="absolute bottom-1/3 right-1/4 pointer-events-auto">
                    <VisualAidTooltip text="ব্যাকটেরিয়াল রস: সকালে পাতার ডগায় আঠালো বিন্দু দেখা যায়।">
                      <div className="w-6 h-6 bg-red-400/30 border border-red-400 rounded-full animate-pulse flex items-center justify-center">
                        <div className="w-2 h-2 bg-red-400 rounded-full" />
                      </div>
                    </VisualAidTooltip>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-10 bg-yellow-500 rounded-full shadow-[0_0_10px_#eab308]" />
                    <h3 className="font-black text-2xl text-white italic tracking-tight">লক্ষণ বিশ্লেষণ রিপোর্ট</h3>
                  </div>
                  <div className="font-mono text-yellow-400 text-xs animate-pulse">LIVE FEED</div>
                </div>
                <div className="space-y-4">
                  {(currentIssue ? currentIssue.symptoms.slice(0, 4) : [
                    "পাতার কিনারা বরাবর V-shape হলুদ দাগ",
                    "দাগগুলো ক্রমশ নিচের দিকে ছড়াচ্ছে",
                    "কোনো পোকা বা পোকার মল দেখা যাচ্ছে না",
                    "সকালে পাতার ডগায় আঠালো ব্যাকটেরিয়াল রস"
                  ]).map((symptom, i) => (
                    <motion.div 
                      key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}
                      className="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-yellow-500/20 hover:bg-white/10 transition-colors"
                    >
                      <div className="bg-green-800 p-2 rounded-lg"><CheckCircle className="text-yellow-400" /></div>
                      <span className="text-white font-bold text-lg">{symptom}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-yellow-500/20 flex justify-between items-center">
                  <div className="text-yellow-500/50 font-mono text-[10px]">SCAN_ID: {currentIssue?.id?.toUpperCase() || 'CABI_BLB_092'}</div>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-yellow-500 rounded-full animate-ping" />
                    <div className="w-1 h-1 bg-yellow-500 rounded-full animate-ping delay-75" />
                    <div className="w-1 h-1 bg-yellow-500 rounded-full animate-ping delay-150" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Deduction Area */}
        <div className={`space-y-6 flex flex-col justify-center transition-all duration-700 ${step === 0 ? 'opacity-30 blur-sm pointer-events-none' : 'opacity-100'}`}>
          <div className="space-y-2">
            <h3 className="font-black text-2xl text-white italic">আপনার চূড়ান্ত সিদ্ধান্ত কী?</h3>
            <p className="text-white/70 font-medium">CABI প্রোটোকল অনুযায়ী সঠিক কারণটি বেছে নিন।</p>
          </div>
          
          <div className="space-y-4">
            {causes.map(cause => (
              <button
                key={cause.id}
                onClick={() => handleSelect(cause)}
                className={`w-full text-left p-6 rounded-[1.5rem] border-4 transition-all flex items-center gap-6 group
                  ${selectedCause === cause.id 
                    ? 'border-yellow-500 bg-green-800 shadow-xl scale-[1.02]' 
                    : 'border-green-700 hover:border-yellow-500/50 bg-green-900'}
                `}
              >
                <div className={`p-4 rounded-2xl transition-colors ${selectedCause === cause.id ? 'bg-yellow-500 text-green-950' : 'bg-green-800 text-yellow-400 group-hover:bg-yellow-500/20'}`}>
                  <cause.icon className="w-8 h-8" />
                </div>
                <div>
                  <div className="font-black text-xl text-white">{cause.label}</div>
                  <div className="text-white/70 font-medium">{cause.desc}</div>
                </div>
              </button>
            ))}
          </div>

          <AnimatePresence>
            {selectedCause && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 overflow-hidden">
                {causes.find(c => c.id === selectedCause)?.correct ? (
                  <div className="bg-green-700 text-white p-6 rounded-2xl shadow-lg flex items-start gap-4 border border-yellow-500/30">
                    <ShieldCheck className="w-8 h-8 shrink-0 text-yellow-400" />
                    <p className="font-bold text-lg leading-snug">সঠিক বিশ্লেষণ! এটি {currentIssue?.bengaliName || 'ব্যাকটেরিয়া জনিত রোগ'}। আপনি একজন দক্ষ প্ল্যান্ট ডক্টর!</p>
                  </div>
                ) : (
                  <div className="bg-red-600 text-white p-6 rounded-2xl shadow-lg flex items-start gap-4">
                    <AlertTriangle className="w-8 h-8 shrink-0" />
                    <p className="font-bold text-lg leading-snug">ভুল বিশ্লেষণ। লক্ষণগুলো আবার ভালো করে দেখুন। {currentIssue ? `এটি ${currentIssue.type === 'disease' ? 'একটি রোগ' : currentIssue.type === 'pest' ? 'পোকার আক্রমণ' : 'পুষ্টির অভাব'}` : 'এটি একটি সংক্রামক রোগ'}।</p>
                  </div>
                )}
                
                {causes.find(c => c.id === selectedCause)?.correct && (
                  <button
                    onClick={() => onComplete(`লক্ষণ বিশ্লেষণ করে ${currentIssue?.bengaliName || 'ব্যাকটেরিয়া জনিত রোগ'} শনাক্ত করা হয়েছে।`)}
                    className="w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-2xl hover:bg-red-500 transition-colors flex justify-center items-center gap-3 text-xl"
                  >
                    পরবর্তী ধাপে যান <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function PhaseMeasure({ onComplete, soundEnabled, score, hintsUsed, onUseHint, onUnlockAchievement, difficulty, currentIssue }: { onComplete: (f: string) => void; soundEnabled: boolean; score: number; hintsUsed: number; onUseHint: () => void; onUnlockAchievement: (id: string) => void; difficulty: Difficulty; currentIssue: RiceIssue | null; key?: string }) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [assessed, setAssessed] = useState(false);
  const [mistakeMade, setMistakeMade] = useState(false);

  const getSettings = (d: Difficulty) => {
    if (d === 'easy') return { total: 8, infected: [1, 4, 7] };
    if (d === 'medium') return { total: 12, infected: [1, 4, 7, 10] };
    return { total: 16, infected: [1, 4, 7, 10, 13] };
  };
  const { total: totalHills, infected: infectedIndices } = getSettings(difficulty);

  const togglePlant = (index: number) => {
    if (assessed) return;
    playSound('click', soundEnabled);
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleAssess = () => {
    setAssessed(true);
    const isCorrect = selectedIndices.length === infectedIndices.length && 
                      selectedIndices.every(i => infectedIndices.includes(i));
    if (isCorrect) {
      playSound('success', soundEnabled);
      if (!mistakeMade) onUnlockAchievement('master_surveyor');
    } else {
      playSound('error', soundEnabled);
      setMistakeMade(true);
    }
  };

  const isCorrect = selectedIndices.length === infectedIndices.length && 
                    selectedIndices.every(i => infectedIndices.includes(i));

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 1.1 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-green-800 border border-yellow-500/30 p-6 rounded-3xl">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-3xl font-black text-white flex items-center gap-3 italic">
            <Ruler className="w-10 h-10 text-yellow-400" /> {CABI_TERMS.measure}
          </h2>
          <HintButton 
            hint="যেসব গাছের গোছায় (hill) অন্তত একটি পাতায় লক্ষণ দেখা যাচ্ছে, সেগুলোই আক্রান্ত হিসেবে গণ্য করুন।" 
            onUse={onUseHint} 
            score={score} 
            soundEnabled={soundEnabled} 
            difficulty={difficulty}
            hintsUsed={hintsUsed}
          />
        </div>
        <AvatarDialog text={`রোগ তো বুঝলাম, কিন্তু ক্ষতির পরিমাণ কতটুকু? চলুন গুচ্ছগুলোর মধ্যে কয়টি আক্রান্ত হয়েছে তা চিহ্নিত করি। ${currentIssue ? currentIssue.symptomDetails.leaf : 'হলুদ দাগযুক্ত'} গাছগুলো খুঁজে বের করুন।`} mood="thinking" />
      </div>

      <div className="relative bg-green-900/90 rounded-[2.5rem] p-8 shadow-2xl border-4 border-yellow-500/30 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-grid-white opacity-10" />
        
        {assessed && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 400 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-x-0 h-1 bg-yellow-400/50 shadow-[0_0_20px_#eab308] z-20"
          />
        )}

        <div className="relative z-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
          {Array.from({ length: totalHills }).map((_, i) => {
            const isInfected = infectedIndices.includes(i);
            const isSelected = selectedIndices.includes(i);
            
            return (
              <VisualAidTooltip 
                key={i}
                text={isInfected ? "আক্রান্ত গাছ: পাতার কিনারা হলুদ হয়ে শুকিয়ে যাচ্ছে।" : "সুস্থ গাছ: পাতা সবুজ এবং সতেজ।"}
              >
                <motion.button
                  whileHover={{ scale: 1.05, rotate: isSelected ? 0 : [0, -2, 2, 0] }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => togglePlant(i)}
                  className={`relative aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 border-2 group
                    ${isSelected 
                      ? 'bg-yellow-500/30 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)]' 
                      : 'bg-black/20 border-transparent hover:bg-white/10'}
                  `}
                >
                  <div className="relative">
                    <Sprout className={`w-12 h-12 sm:w-16 sm:h-16 transition-all duration-500 animate-sway
                      ${isInfected && (isSelected || assessed) ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-green-400'}
                      ${!isInfected && isSelected ? 'text-green-200' : ''}
                    `} />
                    {isInfected && (isSelected || assessed) && (
                      <motion.div 
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-yellow-400/20 blur-lg rounded-full"
                      />
                    )}
                  </div>
                  
                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-yellow-500 text-green-950 rounded-full p-1 shadow-lg z-30">
                      <CheckCircle className="w-5 h-5" />
                    </motion.div>
                  )}

                  {assessed && isInfected && !isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg z-30">
                      <AlertTriangle className="w-5 h-5" />
                    </motion.div>
                  )}
                </motion.button>
              </VisualAidTooltip>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-green-800 border border-yellow-500/30 p-6 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="bg-yellow-500/20 p-3 rounded-2xl">
            <Target className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-yellow-400 uppercase tracking-widest">আক্রান্ত গাছ চিহ্নিত</div>
            <div className="text-2xl font-black text-white">{selectedIndices.length} <span className="text-white/50">/ {infectedIndices.length}</span></div>
          </div>
        </div>

        {!assessed ? (
          <button
            disabled={selectedIndices.length === 0}
            onClick={handleAssess}
            className={`px-10 py-4 rounded-2xl font-black text-lg transition-all transform active:scale-95
              ${selectedIndices.length > 0 
                ? 'bg-red-600 text-white hover:bg-red-500 shadow-xl' 
                : 'bg-green-900 text-white/40 cursor-not-allowed border border-green-700'}
            `}
          >
            পরিমাপ যাচাই করুন
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex justify-end">
            {isCorrect ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="text-yellow-400 font-black">চমৎকার!</div>
                  <div className="text-white/70 text-sm font-medium">ক্ষতির হার ৩৩% (ETL এর কাছাকাছি)</div>
                </div>
                <button
                  onClick={() => onComplete("ক্ষতির মাত্রা পরিমাপ: ১২টির মধ্যে ৪টি গুচ্ছ আক্রান্ত (৩৩%), যা ETL এর কাছাকাছি।")}
                  className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-red-500 shadow-lg flex items-center gap-2"
                >
                  পরবর্তী ধাপ <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="text-red-400 font-black">আবার চেষ্টা করুন</div>
                  <div className="text-white/70 text-sm font-medium">কিছু আক্রান্ত গাছ বাদ পড়েছে</div>
                </div>
                <button
                  onClick={() => { setAssessed(false); setSelectedIndices([]); }}
                  className="bg-yellow-500 text-green-950 px-8 py-4 rounded-2xl font-black text-lg hover:bg-yellow-400 flex items-center gap-2"
                >
                  <RotateCcw className="w-6 h-6" /> পুনরায় শুরু
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

type WeatherType = 'rainy' | 'sunny' | 'windy' | 'foggy';

interface WeatherScenario {
  type: WeatherType;
  title: string;
  desc: string;
  impact: string;
  bgUrl: string;
  icon: React.ElementType;
  riskOptions: { id: number; text: string; correct: boolean }[];
}

// Function to generate weather scenarios based on issue type
function generateWeatherScenarios(issue: RiceIssue | null): WeatherScenario[] {
  const issueType = issue?.type || 'disease';
  const issueName = issue?.bengaliName || 'সমস্যা';
  
  // Different impact texts based on issue type
  const getRainyImpact = () => {
    if (issueType === 'disease') {
      return 'বৃষ্টির ঝাপটায় রোগজীবাণু দ্রুত এক গাছ থেকে অন্য গাছে ছড়িয়ে পড়ে।';
    } else if (issueType === 'pest') {
      return 'বৃষ্টিতে পোকার আক্রমণ কিছুটা কমলেও আর্দ্রতা বাড়লে পোকার বংশবৃদ্ধি বাড়তে পারে।';
    } else {
      return 'অতিরিক্ত বৃষ্টিতে পুষ্টি উপাদান মাটি থেকে ধুয়ে যেতে পারে।';
    }
  };
  
  const getSunnyImpact = () => {
    if (issueType === 'disease') {
      return 'তীব্র রোদে রোগজীবাণু কিছুটা দুর্বল হলেও আর্দ্রতা কম থাকলে রোগ ছড়ানো ধীর হয়।';
    } else if (issueType === 'pest') {
      return 'তীব্র রোদ ও উচ্চ তাপমাত্রায় কিছু পোকা দুর্বল হয়, তবে সব পোকা মারা যায় না।';
    } else {
      return 'তীব্র রোদে গাছের পানির চাহিদা বাড়ে এবং পুষ্টি শোষণ ব্যাহত হতে পারে।';
    }
  };
  
  const getWindyImpact = () => {
    if (issueType === 'disease') {
      return 'বাতাসে গাছের পাতায় ক্ষত তৈরি হয়, যা দিয়ে রোগজীবাণু সহজেই ভেতরে প্রবেশ করে।';
    } else if (issueType === 'pest') {
      return 'বাতাসে পোকা এক জমি থেকে অন্য জমিতে ছড়িয়ে পড়তে পারে।';
    } else {
      return 'ঝোড়ো বাতাসে গাছের শিকড় ক্ষতিগ্রস্ত হতে পারে এবং পুষ্টি শোষণ কমে যায়।';
    }
  };
  
  const getFoggyImpact = () => {
    if (issueType === 'disease') {
      return 'অতিরিক্ত আর্দ্রতা ও শিশিরবিন্দু রোগজীবাণুর বংশবৃদ্ধির জন্য আদর্শ পরিবেশ।';
    } else if (issueType === 'pest') {
      return 'কুয়াশা ও আর্দ্রতা পোকার বংশবৃদ্ধির জন্য অনুকূল পরিবেশ তৈরি করে।';
    } else {
      return 'কুয়াশাচ্ছন্ন আবহাওয়ায় গাছের বৃদ্ধি ধীর হয় এবং পুষ্টি শোষণ কমে যায়।';
    }
  };
  
  const getRainyRiskOptions = () => {
    if (issueType === 'disease') {
      return [
        { id: 1, text: 'ঝুঁকি কম। বৃষ্টিতে রোগজীবাণু ধুয়ে যাবে।', correct: false },
        { id: 2, text: 'মাঝারি ঝুঁকি। শুধু সার প্রয়োগ কমালেই হবে।', correct: false },
        { id: 3, text: `উচ্চ ঝুঁকি! বৃষ্টি ও বাতাস ${issueName} দ্রুত মহামারী আকারে ছড়াতে পারে।`, correct: true },
      ];
    } else if (issueType === 'pest') {
      return [
        { id: 1, text: 'ঝুঁকি নেই। বৃষ্টিতে সব পোকা মারা যাবে।', correct: false },
        { id: 2, text: `মাঝারি ঝুঁকি। ${issueName}-এর জন্য সতর্ক থাকতে হবে।`, correct: true },
        { id: 3, text: 'ঝুঁকি খুব বেশি। বৃষ্টি পোকা বাড়ায়।', correct: false },
      ];
    } else {
      return [
        { id: 1, text: `উচ্চ ঝুঁকি! বৃষ্টিতে পুষ্টি ধুয়ে যেতে পারে এবং ${issueName} আরও বাড়তে পারে।`, correct: true },
        { id: 2, text: 'ঝুঁকি নেই। বৃষ্টি গাছের জন্য ভালো।', correct: false },
        { id: 3, text: 'মাঝারি ঝুঁকি। সার দিলেই হবে।', correct: false },
      ];
    }
  };
  
  const getSunnyRiskOptions = () => {
    if (issueType === 'disease') {
      return [
        { id: 1, text: 'উচ্চ ঝুঁকি। রোদ রোগজীবাণুকে শক্তিশালী করে।', correct: false },
        { id: 2, text: `মাঝারি ঝুঁকি। রোদ ও উচ্চ তাপমাত্রায় ${issueName} কিছুটা নিয়ন্ত্রণে থাকতে পারে।`, correct: true },
        { id: 3, text: 'ঝুঁকি নেই। রোদ সব রোগজীবাণু মেরে ফেলে।', correct: false },
      ];
    } else if (issueType === 'pest') {
      return [
        { id: 1, text: `উচ্চ ঝুঁকি। তীব্র রোদে ${issueName} আরও সক্রিয় হতে পারে।`, correct: false },
        { id: 2, text: 'মাঝারি ঝুঁকি। তাপমাত্রা বেশি হলে কিছু পোকা মারা যেতে পারে।', correct: true },
        { id: 3, text: 'ঝুঁকি নেই। সব পোকা রোদে মারা যাবে।', correct: false },
      ];
    } else {
      return [
        { id: 1, text: `উচ্চ ঝুঁকি! তীব্র রোদে ${issueName} আরও বাড়তে পারে।`, correct: true },
        { id: 2, text: 'ঝুঁকি নেই। রোদ গাছের জন্য ভালো।', correct: false },
        { id: 3, text: 'মাঝারি ঝুঁকি। পানি দিলেই হবে।', correct: false },
      ];
    }
  };
  
  const getWindyRiskOptions = () => {
    if (issueType === 'disease') {
      return [
        { id: 1, text: 'ঝুঁকি কম। বাতাস রোগজীবাণুকে উড়িয়ে নিয়ে যাবে।', correct: false },
        { id: 2, text: `উচ্চ ঝুঁকি! বাতাসের ঘর্ষণে পাতায় ক্ষত তৈরি হয় এবং ${issueName} দ্রুত ছড়ায়।`, correct: true },
        { id: 3, text: 'মাঝারি ঝুঁকি। বাতাস শুধু ধুলোবালি ছড়ায়।', correct: false },
      ];
    } else if (issueType === 'pest') {
      return [
        { id: 1, text: 'ঝুঁকি কম। বাতাস পোকাকে উড়িয়ে নিয়ে যাবে।', correct: false },
        { id: 2, text: `উচ্চ ঝুঁকি! বাতাসে ${issueName} অন্য জমিতে ছড়িয়ে পড়তে পারে।`, correct: true },
        { id: 3, text: 'মাঝারি ঝুঁকি। বাতাসে কিছু হবে না।', correct: false },
      ];
    } else {
      return [
        { id: 1, text: `উচ্চ ঝুঁকি! বাতাসে গাছ ক্ষতিগ্রস্ত হলে ${issueName} আরও বাড়তে পারে।`, correct: true },
        { id: 2, text: 'ঝুঁকি নেই। বাতাস গাছের জন্য ভালো।', correct: false },
        { id: 3, text: 'মাঝারি ঝুঁকি। বাতাসে কিছু হবে না।', correct: false },
      ];
    }
  };
  
  const getFoggyRiskOptions = () => {
    if (issueType === 'disease') {
      return [
        { id: 1, text: `উচ্চ ঝুঁকি! কুয়াশা ও শিশির ${issueName} ছড়ানোর জন্য খুবই অনুকূল।`, correct: true },
        { id: 2, text: 'ঝুঁকি নেই। কুয়াশা রোগজীবাণুকে ঢেকে রাখে।', correct: false },
        { id: 3, text: 'মাঝারি ঝুঁকি। শুধু কুয়াশায় কিছু হয় না।', correct: false },
      ];
    } else if (issueType === 'pest') {
      return [
        { id: 1, text: `উচ্চ ঝুঁকি! কুয়াশাচ্ছন্ন আবহাওয়া ${issueName}-এর বংশবৃদ্ধির জন্য অনুকূল।`, correct: true },
        { id: 2, text: 'ঝুঁকি নেই। কুয়াশায় পোকা থাকে না।', correct: false },
        { id: 3, text: 'মাঝারি ঝুঁকি। কুয়াশায় কিছু হবে না।', correct: false },
      ];
    } else {
      return [
        { id: 1, text: `উচ্চ ঝুঁকি! আর্দ্রতায় ${issueName} আরও বাড়তে পারে।`, correct: true },
        { id: 2, text: 'ঝুঁকি নেই। কুয়াশা গাছের জন্য ভালো।', correct: false },
        { id: 3, text: 'মাঝারি ঝুঁকি। কুয়াশায় কিছু হবে না।', correct: false },
      ];
    }
  };
  
  return [
    {
      type: 'rainy' as WeatherType,
      title: 'ভারী বৃষ্টি (Heavy Rain)',
      desc: 'আগামী ৩ দিন ঝড়ো হাওয়া ও ভারী বৃষ্টির সম্ভাবনা রয়েছে।',
      impact: getRainyImpact(),
      bgUrl: 'https://images.unsplash.com/photo-1514632595863-608f81441848?q=80&w=1000&auto=format&fit=crop',
      icon: Droplets,
      riskOptions: getRainyRiskOptions()
    },
    {
      type: 'sunny' as WeatherType,
      title: 'তীব্র রোদ (Intense Sun)',
      desc: 'টানা কয়েকদিন ধরে আকাশ পরিষ্কার এবং তাপমাত্রা অনেক বেশি।',
      impact: getSunnyImpact(),
      bgUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1000&auto=format&fit=crop',
      icon: ThermometerSun,
      riskOptions: getSunnyRiskOptions()
    },
    {
      type: 'windy' as WeatherType,
      title: 'ঝড়ো হাওয়া (Strong Wind)',
      desc: 'বাতাসের গতিবেগ অনেক বেশি, ধানের গাছগুলো একে অপরের সাথে ঘষা খাচ্ছে।',
      impact: getWindyImpact(),
      bgUrl: 'https://images.unsplash.com/photo-1496450681664-3df85efbd29f?q=80&w=1000&auto=format&fit=crop',
      icon: Wind,
      riskOptions: getWindyRiskOptions()
    },
    {
      type: 'foggy' as WeatherType,
      title: 'ঘন কুয়াশা (Dense Fog)',
      desc: 'সকাল থেকে দুপুর পর্যন্ত ঘন কুয়াশা এবং পাতায় শিশির জমে আছে।',
      impact: getFoggyImpact(),
      bgUrl: 'https://images.unsplash.com/photo-1485236715598-c8879a198911?q=80&w=1000&auto=format&fit=crop',
      icon: CloudSun,
      riskOptions: getFoggyRiskOptions()
    }
  ];
}

function PhaseThink({ onComplete, soundEnabled, score, hintsUsed, onUseHint, onUnlockAchievement, difficulty, currentIssue }: { onComplete: (f: string) => void; soundEnabled: boolean; score: number; hintsUsed: number; onUseHint: () => void; onUnlockAchievement: (id: string) => void; difficulty: Difficulty; currentIssue: RiceIssue | null; key?: string }) {
  const [selectedRisk, setSelectedRisk] = useState<number | null>(null);
  const [mistakeMade, setMistakeMade] = useState(false);
  
  // Generate weather scenarios based on current issue
  const weatherScenarios = useMemo(() => generateWeatherScenarios(currentIssue), [currentIssue]);
  const [scenario] = useState<WeatherScenario>(() => {
    return weatherScenarios[Math.floor(Math.random() * weatherScenarios.length)];
  });
  
  // Dynamic hint based on issue type
  const getDynamicHint = () => {
    const issueType = currentIssue?.type || 'disease';
    if (issueType === 'disease') {
      return 'বৃষ্টি এবং দমকা হাওয়া রোগজীবাণু ছড়িয়ে দিতে সাহায্য করে। তাই আবহাওয়ার পূর্বাভাস গুরুত্ব সহকারে দেখুন।';
    } else if (issueType === 'pest') {
      return 'আবহাওয়া পোকার বংশবৃদ্ধি ও ছড়িয়ে পড়ার ওপর প্রভাব ফেলে। বাতাস ও আর্দ্রতা বিশেষভাবে গুরুত্বপূর্ণ।';
    } else {
      return 'প্রতিকূল আবহাওয়া পুষ্টি শোষণে বাধা দিতে পারে। বৃষ্টি ও তাপমাত্রা বিশেষভাবে গুরুত্বপূর্ণ।';
    }
  };

  const handleRiskSelect = (option: { id: number, correct: boolean }) => {
    setSelectedRisk(option.id);
    if (option.correct) {
      playSound('success', soundEnabled);
      if (!mistakeMade) onUnlockAchievement('risk_analyst');
    } else {
      playSound('error', soundEnabled);
      setMistakeMade(true);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 max-w-5xl mx-auto relative">
      {/* Weather Background Simulation */}
      <div className="absolute inset-0 -z-10 rounded-[3rem] overflow-hidden bg-green-950">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: `url(${scenario.bgUrl})` }}
        />
        <div className={`absolute inset-0 bg-gradient-to-b from-green-950/40 via-green-950/80 to-green-950`} />
        
        {/* Lightning Effect for Rainy/Stormy */}
        {scenario.type === 'rainy' && (
          <div className="absolute inset-0 bg-white/30 animate-lightning pointer-events-none z-10" />
        )}

        {/* Moving Clouds */}
        {(scenario.type === 'windy' || scenario.type === 'foggy') && (
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <Cloud className="absolute top-10 left-[-10%] text-white w-40 h-40 animate-cloud" />
            <Cloud className="absolute top-40 left-[-20%] text-white w-60 h-60 animate-cloud" style={{ animationDelay: '-20s', animationDuration: '70s' }} />
          </div>
        )}

        {/* Rain Effect */}
        {scenario.type === 'rainy' && Array.from({ length: 60 }).map((_, i) => (
          <div 
            key={i} 
            className="rain-drop" 
            style={{ 
              left: `${Math.random() * 100}%`, 
              animationDelay: `${Math.random() * 2}s`,
              opacity: Math.random() * 0.5,
              height: `${20 + Math.random() * 30}px`
            }} 
          />
        ))}

        {/* Fog Effect */}
        {scenario.type === 'foggy' && Array.from({ length: 8 }).map((_, i) => (
          <div 
            key={i} 
            className="fog-layer w-[200%] h-full top-0" 
            style={{ 
              top: `${i * 15}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${20 + i * 5}s`,
              opacity: 0.4 + Math.random() * 0.4
            }} 
          />
        ))}

        {/* Wind Effect (Visual Sway) */}
        {scenario.type === 'windy' && (
          <div className="absolute inset-0 wind-effect opacity-30 bg-white/5 pointer-events-none z-10" />
        )}

        {/* Sunny Effect (Glow) */}
        {scenario.type === 'sunny' && (
          <div className="absolute inset-0 bg-yellow-400/10 animate-pulse-soft pointer-events-none z-10" />
        )}
      </div>

      <div className="bg-green-800 border border-yellow-500/30 p-6 rounded-3xl">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-3xl font-black text-white flex items-center gap-3 italic">
            <scenario.icon className="w-10 h-10 text-yellow-400" /> {CABI_TERMS.think}
          </h2>
          <HintButton 
            hint={getDynamicHint()} 
            onUse={onUseHint} 
            score={score} 
            soundEnabled={soundEnabled} 
            difficulty={difficulty}
            hintsUsed={hintsUsed}
          />
        </div>
        <AvatarDialog 
          text={`মাঠের আবহাওয়া এখন ${scenario.title.toLowerCase()}। ${currentIssue ? `${currentIssue.bengaliName}-এর` : 'সমস্যার'} ক্ষেত্রে এই অবস্থায় ঝুঁকি কতটা বলে আপনার মনে হয়?`} 
          mood={scenario.type === 'sunny' ? 'thinking' : 'sad'} 
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-green-800/80 backdrop-blur-xl p-6 rounded-[2rem] border border-yellow-500/30 flex items-start gap-5 shadow-2xl"
        >
          <div className="bg-yellow-500 text-green-950 p-4 rounded-2xl shadow-lg"><scenario.icon className="w-8 h-8" /></div>
          <div>
            <h3 className="font-black text-xl text-yellow-400 mb-2 italic">{scenario.title}</h3>
            <p className="text-white/80 font-medium leading-relaxed">{scenario.desc} {scenario.impact}</p>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-green-800/80 backdrop-blur-xl p-6 rounded-[2rem] border border-red-500/30 flex items-start gap-5 shadow-2xl"
        >
          <div className="bg-red-500 text-white p-4 rounded-2xl shadow-lg">{currentIssue?.type === 'disease' ? <FlaskConical className="w-8 h-8" /> : currentIssue?.type === 'pest' ? <Bug className="w-8 h-8" /> : <Leaf className="w-8 h-8" />}</div>
          <div>
            <h3 className="font-black text-xl text-red-400 mb-2 italic">সাম্প্রতিক অবস্থা</h3>
            <p className="text-white/80 font-medium leading-relaxed">{currentIssue?.causes || 'গত সপ্তাহে জমিতে অতিরিক্ত ইউরিয়া সার প্রয়োগ করা হয়েছে। এটি গাছকে নরম ও রোগপ্রবণ করে তোলে।'}</p>
          </div>
        </motion.div>
      </div>

      <div className="bg-green-800 border border-yellow-500/30 p-8 rounded-[2.5rem] shadow-2xl">
        <h3 className="font-black text-2xl text-white mb-6 italic">আপনার ঝুঁকি বিশ্লেষণ কী?</h3>
        <div className="grid gap-4">
          {scenario.riskOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedRisk(option.id)}
              className={`w-full text-left p-6 rounded-2xl border-4 transition-all flex items-center gap-6 group
                ${selectedRisk === option.id 
                  ? option.correct 
                    ? 'border-yellow-500 bg-green-700 shadow-xl scale-[1.02]' 
                    : 'border-red-500 bg-red-900/50 shadow-xl scale-[1.02]'
                  : 'border-green-700 hover:border-yellow-500/50 bg-green-900'}
              `}
            >
              <div className={`p-4 rounded-xl transition-colors ${selectedRisk === option.id ? (option.correct ? 'bg-yellow-500 text-green-950' : 'bg-red-500 text-white') : 'bg-green-800 text-yellow-400 group-hover:bg-yellow-500/20'}`}>
                {option.correct ? <ShieldCheck className="w-8 h-8" /> : (selectedRisk === option.id ? <AlertTriangle className="w-8 h-8" /> : <Activity className="w-8 h-8" />)}
              </div>
              <span className={`font-black text-xl ${selectedRisk === option.id ? (option.correct ? 'text-white' : 'text-red-200') : 'text-white/80'}`}>
                {option.text}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence>
          {selectedRisk !== null && scenario.riskOptions.find(o => o.id === selectedRisk)?.correct && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-8 overflow-hidden">
              <button
                onClick={() => onComplete(`ঝুঁকি বিশ্লেষণ: ${scenario.title} ও অতিরিক্ত ইউরিয়ার কারণে ${scenario.type === 'sunny' ? 'মাঝারি' : 'উচ্চ'} ঝুঁকি বিদ্যমান।`)}
                className="w-full bg-red-600 text-white font-black py-6 px-10 rounded-2xl shadow-2xl hover:bg-red-500 transition-all flex justify-center items-center gap-4 text-2xl group"
              >
                সিদ্ধান্ত গ্রহণ ধাপে যান 
                <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function PhaseAct({ onComplete, soundEnabled, score, hintsUsed, onUseHint, onUnlockAchievement, difficulty, currentIssue }: { onComplete: (f: string) => void; soundEnabled: boolean; score: number; hintsUsed: number; onUseHint: () => void; onUnlockAchievement: (id: string) => void; difficulty: Difficulty; currentIssue: RiceIssue | null; key?: string }) {
  const [selectedAction, setSelectedAction] = useState<number | null>(null);
  const [mistakeMade, setMistakeMade] = useState(false);

  const getActions = (d: Difficulty) => {
    // Get management options based on issue type
    const managementOptions = currentIssue?.management || ['সাংস্কৃতিক দমন পদ্ধতি অবলম্বন করা'];
    const issueType = currentIssue?.type || 'disease';
    const issueName = currentIssue?.bengaliName || 'এই সমস্যা';
    
    const base = [
      { id: 1, type: 'chemical', label: 'রাসায়নিক দমন (Chemical)', desc: 'দোকান থেকে কড়া কীটনাশক কিনে স্প্রে করা।', correct: false, feedback: `ভুল সিদ্ধান্ত! ${issueType === 'disease' ? 'এটি একটি রোগ' : issueType === 'pest' ? 'পোকার জন্য সঠিক কীটনাশক প্রয়োজন' : 'পুষ্টির অভাবে সার প্রয়োজন'}, অন্য পদক্ষেপ নিন।`, icon: FlaskConical },
      { id: 2, type: 'cultural', label: 'সাংস্কৃতিক দমন (Cultural - IPM)', desc: managementOptions[0] || 'ইউরিয়া সার প্রয়োগ বন্ধ করা, জমির পানি বের করে দেওয়া।', correct: true, feedback: `সঠিক সিদ্ধান্ত! ${issueName}-এর ক্ষেত্রে ${managementOptions[0]} সবচেয়ে কার্যকরী পদক্ষেপ।`, icon: ShieldCheck },
      { id: 3, type: 'biological', label: 'জৈব দমন (Biological)', desc: 'জমিতে উপকারী পোকা (যেমন লেডিবার্ড বিটল) ছেড়ে দেওয়া।', correct: issueType === 'pest', feedback: issueType === 'pest' ? 'সঠিক সিদ্ধান্ত! জৈবিক দমন পোকা নিয়ন্ত্রণে কার্যকর।' : `ভুল সিদ্ধান্ত। উপকারী পোকা ক্ষতিকর পোকা দমনে সাহায্য করে, কিন্তু ${issueType === 'disease' ? 'রোগের' : 'পুষ্টির'} ক্ষেত্রে এটি কার্যকর নয়।`, icon: Bug },
    ];
    if (d === 'easy') return base;
    if (d === 'medium') return [
      ...base,
      { id: 4, type: 'herbal', label: 'ভেষজ দমন (Herbal)', desc: 'নিম পাতার রস স্প্রে করা।', correct: false, feedback: `নিম পাতা পোকা দমনে কাজ করে, কিন্তু ${issueType === 'disease' ? 'রোগের' : 'পুষ্টির অভাবের'} ক্ষেত্রে এটি যথেষ্ট নয়।`, icon: Leaf },
    ];
    return [
      ...base,
      { id: 4, type: 'herbal', label: 'ভেষজ দমন (Herbal)', desc: 'নিম পাতার রস স্প্রে করা।', correct: false, feedback: `নিম পাতা পোকা দমনে কাজ করে, কিন্তু ${issueType === 'disease' ? 'রোগের' : 'পুষ্টির অভাবের'} ক্ষেত্রে এটি যথেষ্ট নয়।`, icon: Leaf },
      { id: 5, type: 'mechanical', label: 'যান্ত্রিক দমন (Mechanical)', desc: 'আক্রান্ত গাছগুলো হাত দিয়ে টেনে তুলে ফেলা।', correct: false, feedback: 'পুরো মাঠের আক্রান্ত গাছ তুলে ফেলা সম্ভব নয় এবং এটি রোগ ছড়াতে সাহায্য করতে পারে।', icon: Hand },
    ];
  };

  const actions = getActions(difficulty);

  const handleActionSelect = (action: typeof actions[0]) => {
    setSelectedAction(action.id);
    if (action.correct) {
      playSound('success', soundEnabled);
      if (!mistakeMade) onUnlockAchievement('ipm_strategist');
    } else {
      playSound('error', soundEnabled);
      setMistakeMade(true);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 1.1 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-green-800 border border-yellow-500/30 p-6 rounded-3xl">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-3xl font-black text-white flex items-center gap-3 italic">
            <ShieldCheck className="w-10 h-10 text-yellow-400" /> {CABI_TERMS.act}
          </h2>
          <HintButton 
            hint="সমন্বিত বালাই ব্যবস্থাপনায় (IPM) রাসায়নিকের আগে সাংস্কৃতিক ও জৈবিক দমনের ওপর গুরুত্ব দেওয়া হয়। ইউরিয়া সার ব্যাকটেরিয়ার বৃদ্ধি বাড়ায়।" 
            onUse={onUseHint} 
            score={score} 
            soundEnabled={soundEnabled} 
            difficulty={difficulty}
            hintsUsed={hintsUsed}
          />
        </div>
        <AvatarDialog text="সব তো বুঝলাম। এখন আমার কী করা উচিত? দোকানদার তো কড়া বিষ দিতে বলছে। আপনি সঠিক পরামর্শ দিন যাতে আমার ফসল বাঁচে।" mood="thinking" />
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* IPM Pyramid Visual */}
        <div className="lg:col-span-2 flex flex-col justify-end gap-3 h-full min-h-[400px] p-8 bg-green-950 rounded-[2.5rem] shadow-2xl border border-yellow-500/30 relative overflow-hidden group">
          <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-110 transition-transform duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-t from-green-950 via-transparent to-transparent" />
          
          <div className="relative z-10 space-y-2">
            <motion.div 
              initial={{ x: -50, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              transition={{ delay: 0.2 }} 
              className="bg-red-500/90 text-white text-center py-3 rounded-t-2xl font-black text-xs border-b-2 border-white/20 shadow-lg"
            >
              রাসায়নিক (Chemical)
            </motion.div>
            <motion.div 
              initial={{ x: -50, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              transition={{ delay: 0.3 }} 
              className="bg-orange-500/90 text-white text-center py-4 font-black text-xs border-b-2 border-white/20 mx-3 shadow-lg"
            >
              জৈব (Biological)
            </motion.div>
            <motion.div 
              initial={{ x: -50, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              transition={{ delay: 0.4 }} 
              className="bg-yellow-500/90 text-green-950 text-center py-6 font-black text-xs border-b-2 border-white/20 mx-6 shadow-lg"
            >
              যান্ত্রিক (Mechanical)
            </motion.div>
            <motion.div 
              initial={{ x: -50, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              transition={{ delay: 0.5 }} 
              className="bg-green-500 text-white text-center py-12 rounded-b-2xl font-black text-xl mx-9 shadow-[0_0_40px_rgba(34,197,94,0.5)] border-2 border-green-400/50"
            >
              সাংস্কৃতিক (Cultural)
            </motion.div>
          </div>
          
          <div className="text-center text-[10px] text-yellow-400 mt-6 font-black uppercase tracking-[0.3em] z-10">IPM পিরামিড (ভিত্তি থেকে শুরু)</div>
        </div>

        {/* Action Selection */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="font-black text-2xl text-white italic mb-4">আপনার চূড়ান্ত পরামর্শ:</h3>
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionSelect(action)}
              className={`w-full text-left p-6 rounded-[2rem] border-4 transition-all flex items-center gap-6 group relative overflow-hidden
                ${selectedAction === action.id 
                  ? action.correct 
                    ? 'border-yellow-500 bg-green-800 shadow-xl scale-[1.02]' 
                    : 'border-red-500 bg-red-900/50 shadow-xl scale-[1.02]'
                  : 'border-green-700 bg-green-900 hover:border-yellow-500/50'}
              `}
            >
              <div className={`p-4 rounded-2xl transition-colors ${selectedAction === action.id ? (action.correct ? 'bg-yellow-500 text-green-950' : 'bg-red-500 text-white') : 'bg-green-800 text-yellow-400 group-hover:bg-yellow-500/20'}`}>
                <action.icon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="font-black text-xl text-white">{action.label}</div>
                <div className="text-white/70 font-medium leading-relaxed">{action.desc}</div>
              </div>
              
              {selectedAction === action.id && action.correct && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 animate-stamp">
                  <div className="border-4 border-yellow-500 text-yellow-500 font-black px-4 py-2 rounded-xl rotate-[-15deg] uppercase text-2xl tracking-tighter opacity-80">
                    অনুমোদিত
                  </div>
                </div>
              )}
            </button>
          ))}

          <AnimatePresence>
            {selectedAction && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-4 space-y-4">
                <div className={`p-6 rounded-[1.5rem] shadow-lg flex items-start gap-4 border-l-8 ${actions.find(a => a.id === selectedAction)?.correct ? 'bg-green-700 text-white border-yellow-400' : 'bg-red-600 text-white border-red-400'}`}>
                  {actions.find(a => a.id === selectedAction)?.correct ? <ShieldCheck className="w-8 h-8 shrink-0 text-yellow-400" /> : <AlertTriangle className="w-8 h-8 shrink-0" />}
                  <p className="font-bold text-lg leading-snug">{actions.find(a => a.id === selectedAction)?.feedback}</p>
                </div>
                
                {actions.find(a => a.id === selectedAction)?.correct && (
                  <button
                    onClick={() => onComplete(`ব্যবস্থাপনা: ${currentIssue?.management?.[0] || 'সাংস্কৃতিক দমন পদ্ধতি'} প্রয়োগের সিদ্ধান্ত গৃহীত।`)}
                    className="w-full bg-red-600 text-white font-black py-6 px-10 rounded-2xl shadow-2xl hover:bg-red-500 transition-all flex justify-center items-center gap-4 text-2xl group"
                  >
                    সিমুলেশন রিপোর্ট দেখুন 
                    <Activity className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function SummaryScreen({ state, onRestart, soundEnabled }: { state: GameState, onRestart: () => void; soundEnabled: boolean; key?: string }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    playSound('complete', soundEnabled);
    const duration = 2000;
    const steps = 60;
    const increment = state.score / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= state.score) {
        setDisplayScore(state.score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [state.score]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-800 border-4 border-yellow-500/30 rounded-[3rem] shadow-2xl overflow-hidden max-w-5xl mx-auto">
      <div className="bg-green-950 p-12 text-center text-white relative overflow-hidden">
        {/* Celebration Particles (CSS only) */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -20, opacity: 0 }}
              animate={{ 
                y: [0, 600], 
                x: [0, (Math.random() - 0.5) * 400],
                opacity: [0, 1, 0],
                rotate: [0, 720]
              }}
              transition={{ 
                duration: 2 + Math.random() * 3, 
                repeat: Infinity, 
                delay: Math.random() * 2 
              }}
              className={`absolute top-0 w-3 h-3 rounded-sm ${i % 2 === 0 ? 'bg-green-400' : 'bg-yellow-400'}`}
              style={{ left: `${Math.random() * 100}%` }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-yellow-500/30 blur-3xl rounded-full animate-pulse" />
            <FarmerAvatar className="w-32 h-32 relative z-10" mood="happy" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-4 italic tracking-tight">মিশন সফল!</h1>
          <p className="text-yellow-200 text-xl md:text-2xl font-medium max-w-2xl leading-relaxed">আপনার সঠিক ও বিজ্ঞানভিত্তিক পরামর্শে আমার ধানক্ষেত রক্ষা পেয়েছে। আপনি একজন সত্যিকারের স্মার্ট কৃষি বিশেষজ্ঞ!</p>
        </div>
      </div>
      
      <div className="p-10 md:p-16">
        <div className="flex justify-center mb-16">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="bg-green-900 border-4 border-yellow-500/30 rounded-[3rem] p-12 text-center min-w-[320px] shadow-2xl relative"
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-500 text-green-950 px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest shadow-lg">
              চূড়ান্ত ফলাফল
            </div>
            <div className="text-sm text-yellow-400 font-black uppercase tracking-[0.2em] mb-2 opacity-60">আপনার দক্ষতা স্কোর</div>
            <div className="text-8xl font-black text-white tabular-nums leading-none">
              {displayScore}<span className="text-3xl text-yellow-400">/100</span>
            </div>
          </motion.div>
        </div>

        <div className="space-y-10">
          <div className="flex items-center gap-4 border-b-4 border-yellow-500/30 pb-4">
            <div className="bg-yellow-500/20 p-3 rounded-2xl">
              <Search className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-2xl font-black text-white italic">ডায়াগনস্টিক রিপোর্ট সারাংশ:</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {state.findings.map((finding, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-5 items-start bg-green-900 p-8 rounded-[2rem] border-2 border-yellow-500/30 hover:border-yellow-500/50 hover:shadow-xl transition-all group"
              >
                <div className="bg-yellow-500 text-green-950 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl shadow-lg group-hover:rotate-12 transition-transform">
                  {idx + 1}
                </div>
                <p className="text-white font-bold text-lg leading-relaxed pt-1">{finding}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-16 bg-green-950 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden border border-yellow-500/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full -mr-32 -mt-32 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/10 rounded-full -ml-32 -mb-32 blur-[100px]" />
          <div className="relative z-10 text-center space-y-4">
            <h4 className="font-black text-3xl italic">স্মার্ট কৃষকের মূলমন্ত্র</h4>
            <p className="text-yellow-400 text-2xl font-black italic tracking-tight">"আগে দেখি, পরে বুঝি; না মেপে ওষুধ নয়"</p>
            <div className="pt-6">
              <button 
                onClick={onRestart}
                className="bg-yellow-500 text-green-950 hover:bg-yellow-400 px-12 py-5 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95 flex items-center gap-3 mx-auto"
              >
                <RotateCcw className="w-6 h-6" /> পুনরায় শুরু করুন
              </button>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mt-20 space-y-10">
          <div className="flex items-center gap-4 border-b-4 border-yellow-500/30 pb-4">
            <div className="bg-yellow-500/20 p-3 rounded-2xl">
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-2xl font-black text-white italic">আপনার অর্জনসমূহ (Achievements):</h3>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {ACHIEVEMENTS.map((achievement, idx) => {
              const isUnlocked = state.unlockedAchievements.includes(achievement.id);
              return (
                <motion.div 
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-8 rounded-[2.5rem] border-4 transition-all flex flex-col items-center text-center gap-6 relative group
                    ${isUnlocked 
                      ? 'bg-green-900 border-yellow-500/30 shadow-xl hover:shadow-2xl hover:-translate-y-2' 
                      : 'bg-green-950 border-green-800 opacity-40 grayscale'}
                  `}
                >
                  {isUnlocked && (
                    <div className="absolute top-4 right-4 text-yellow-400">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  )}
                  <div className={`p-6 rounded-[1.5rem] transition-all duration-500 ${isUnlocked ? 'bg-yellow-500/20 ' + achievement.color + ' group-hover:scale-110' : 'bg-green-800 text-green-600'}`}>
                    <achievement.icon className="w-12 h-12" />
                  </div>
                  <div>
                    <div className={`font-black text-xl mb-2 ${isUnlocked ? 'text-white' : 'text-green-600'}`}>{achievement.title}</div>
                    <div className="text-white/70 font-medium leading-relaxed">{achievement.description}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={onRestart}
            className="bg-red-600 hover:bg-red-500 text-white font-black py-6 px-12 rounded-full shadow-[0_15px_30px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(220,38,38,0.6)] transition-all inline-flex items-center gap-4 text-xl active:scale-95"
          >
            <RotateCcw className="w-6 h-6" /> নতুন সিমুলেশন শুরু করুন
          </button>
        </div>
      </div>
    </motion.div>
  );
}
