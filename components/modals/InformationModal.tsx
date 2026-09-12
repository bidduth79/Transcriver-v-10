
import React, { useState, useRef } from 'react';
import { getApiUrl } from '../../services/api';

interface InformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  activeColors: any;
  appLang: 'bn' | 'en';
  addToast?: (msg: string, type: any) => void;
}

export const InformationModal: React.FC<InformationModalProps> = ({ isOpen, onClose, isDark, activeColors, appLang, addToast }) => {
  const [activeTab, setActiveTab] = useState('sidebar');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [size, setSize] = useState({ width: 1100, height: 850 });
  const isResizing = useRef(false);

  if (!isOpen) return null;

  // --- DB Setup Logic ---
  const runDbSetup = async () => {
      try {
          const url = getApiUrl('setup.php');
          console.log("Attempting to DB Setup at URL:", url);
          const res = await fetch(url);
          const text = await res.text();
          let data;
          try {
              data = JSON.parse(text);
          } catch(e) {
              console.error("Invalid JSON:", text);
              if (addToast) addToast("Invalid response from server", 'error');
              return;
          }

          if (data.status === 'success') {
              if (addToast) addToast(appLang === 'bn' ? 'ডাটাবেস সেটআপ সফল হয়েছে!' : 'Database Setup Successful!', 'success');
          } else {
              if (addToast) addToast('Setup Error: ' + (data.message || 'Unknown'), 'error');
          }
      } catch (e: any) {
          console.error("Fetch error:", e);
          if (addToast) addToast((appLang === 'bn' ? 'সার্ভার কানেকশন ব্যর্থ: ' : 'Server Connection Failed: ') + (e.message || 'Unknown error'), 'error');
      }
  };

  // --- Content Data Structure ---
  const guideData = {
    sidebar: {
      title: appLang === 'bn' ? 'সাইডবার (Sidebar)' : 'Sidebar',
      description: appLang === 'bn' ? 'ইনপুট সোর্স, হিস্টোরি এবং ফাইল ইনফরমেশন' : 'Input sources, history and file information',
      items: [
        {
          title: appLang === 'bn' ? '১. ইনপুট মেথড (Input Methods)' : '1. Input Methods',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />,
          content: appLang === 'bn' 
            ? '• লোকাল ফাইল: ফোল্ডার আইকনে ক্লিক করে পিসি থেকে অডিও/ভিডিও আপলোড করুন।\n• ইউটিউব/ফেসবুক: আইকনে ক্লিক করে লিংক পেস্ট করুন। "DL Only" দিলে শুধু ডাউনলোড হবে, "Transcribe" দিলে ডাউনলোডের পর অটোমেটিক লেখা বের হবে।\n• রেকর্ডার: মাইক আইকন দিয়ে লাইভ ভয়েস রেকর্ড করা যায়।'
            : '• Local File: Upload from PC.\n• YouTube/FB: Paste link to download or transcribe.\n• Recorder: Live voice recording.'
        },
        {
          title: appLang === 'bn' ? '২. হিস্টোরি (Expanded History)' : '2. Expanded History',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
          content: appLang === 'bn'
            ? '• লিস্ট: পূর্বের সব কাজের তালিকা এখানে থাকে। ক্লিক করলে পুরনো ফাইল লোড হয়।\n• এক্সপান্ড বাটন: হিস্টোরি প্যানেলের কোণায় "তীর" আইকনে ক্লিক করলে ফুল স্ক্রিন হিস্টোরি ওপেন হবে। সেখানে তারিখ অনুযায়ী সার্চ এবং ফিল্টার করা যায়।\n• সেন্সিটিভ ওয়ার্ড: "বিজিবি/সীমান্ত" জাতীয় শব্দ থাকলে লাল বর্ডার দেখাবে।'
            : 'View past work. Click expand arrow for full-screen search and filtering. Sensitive keywords are highlighted in red.'
        },
        {
          title: appLang === 'bn' ? '৩. ফাইল ইনফো (File Info)' : '3. File Info',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
          content: appLang === 'bn'
            ? 'ফাইল লোড হওয়ার পর ফাইলের নাম, সাইজ এবং ডিউরেশন দেখাবে।\n• প্লেয়ার: এখান থেকে অডিও প্লে/পজ করা যায়।\n• স্পিড: 1x, 1.5x, 2x দিয়ে প্লেব্যাক স্পিড বাড়ানো কমানো যায়।\n• ট্রান্সক্রাইব বাটন: এটি চাপলে প্রসেসিং শুরু হবে।'
            : 'Shows name, size, duration. Includes audio player with speed controls and the main "Start Transcribe" button.'
        }
      ]
    },
    header: {
      title: appLang === 'bn' ? 'হেডার (Header)' : 'Header',
      description: appLang === 'bn' ? 'টুলস, সেটিংস এবং সিস্টেম কন্ট্রোল' : 'Tools, settings and system controls',
      items: [
        {
          title: appLang === 'bn' ? 'টুলস ও ইউটিলিটি (Tools)' : 'Tools & Utility',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />,
          content: appLang === 'bn'
            ? 'কাঁচি (Scissors) আইকনে ক্লিক করলে টুলস মেনু আসবে।\n• কাটার/জয়েনার: ভিডিও বা অডিও কাটতে ও জোড়া দিতে।\n• কনভার্টার: ভিডিও থেকে অডিও আলাদা করতে।\n• ইউটিউব ডাউনলোডার: এখান থেকেও ভিডিও নামানো যায়।'
            : 'Scissors Icon: Access Cutter, Joiner, Converter, and Downloaders.'
        },
        {
          title: appLang === 'bn' ? 'এপিআই ও লগস (API & Logs)' : 'API & Logs',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />,
          content: appLang === 'bn'
            ? '• চাবি (Key) আইকন: এখানে আপনার ব্যক্তিগত Gemini API Key যোগ/ডিলিট করতে পারবেন।\n• লগ আইকন: সিস্টেমে কখন কি কাজ হয়েছে তার তালিকা (Activity Log) দেখা যাবে। ডিবাগিংয়ের জন্য এটি জরুরি।'
            : 'Key Icon: Manage API Keys. Log Icon: View system activity logs for debugging.'
        },
        {
          title: appLang === 'bn' ? 'সিস্টেম কন্ট্রোল (System Control)' : 'System Control',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
          content: appLang === 'bn'
            ? '• ফুল স্ক্রিন: কাজের সুবিধার্থে বড় পর্দা।\n• ডে/নাইট: চোখের আরামের জন্য ডার্ক মুড।\n• ভাষা (BN/EN): ইন্টারফেসের ভাষা পরিবর্তন।\n• স্ট্যাটাস: সিস্টেম অনলাইন না ব্যস্ত তা দেখায়।\n• রিফ্রেশ: অ্যাপ আটকে গেলে রিলোড দেওয়ার জন্য।'
            : 'Controls for Fullscreen, Theme, Language, Status Indicator, and Refresh.'
        }
      ]
    },
    footer: {
      title: appLang === 'bn' ? 'ফুটার (Footer)' : 'Footer',
      description: appLang === 'bn' ? 'সার্ভার কানেকশন এবং এপিআই স্ট্যাটাস মনিটরিং' : 'Server connection and API status monitoring',
      items: [
        {
          title: appLang === 'bn' ? '১. সার্ভার (Server Status)' : '1. Server Status',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />,
          content: appLang === 'bn'
            ? 'এটি দেখায় আপনার XAMPP লোকাল সার্ভার কানেক্টেড কিনা।\n• সবুজ (Online): সব ঠিক আছে, ডাটাবেসে সেভ হচ্ছে।\n• লাল (Offline): সার্ভার বন্ধ, ডাটা সেভ হবে না। ক্লিক করে আইপি ঠিক করা যায়।'
            : 'Green = XAMPP Connected (Saving data). Red = Offline (Data risk). Click to configure IP.'
        },
        {
          title: appLang === 'bn' ? '২. এপিআই সোর্স (API Source)' : '2. API Source',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />,
          content: appLang === 'bn'
            ? 'বর্তমানে কোন API Key টি ব্যবহার হচ্ছে তা এখানে দেখায়।\n• Auto Rotate: সিস্টেম অটোমেটিক এক কি থেকে অন্য কিতে সুইচ করবে।\n• Manual: আপনি নির্দিষ্ট কি সিলেক্ট করে দিলে সেটিই ফিক্সড থাকবে।'
            : 'Shows active API Key. Indicates if using Auto-Rotation or a specific Manual Key.'
        },
        {
          title: appLang === 'bn' ? '৩. মডেল ও কলস (Model & Calls)' : '3. Model & Calls',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
          content: appLang === 'bn'
            ? '• মডেল: বর্তমানে কোন এআই মডেল (যেমন Gemini 1.5 Flash বা Pro) কাজ করছে।\n• এপিআই কলস: মোট কতবার সার্ভারে রিকোয়েস্ট পাঠানো হয়েছে তার হিসাব। এটি আপনাকে কোটা লিমিট বুঝতে সাহায্য করবে।'
            : 'Model: Current AI engine (Flash/Pro). Calls: Total requests sent, helps track quota usage.'
        }
      ]
    },
    transcript: {
      title: appLang === 'bn' ? 'আউটপুট (Transcript)' : 'Transcript',
      description: appLang === 'bn' ? 'আউটপুট কন্ট্রোল, এনালাইসিস এবং এক্সপোর্ট' : 'Output control, analysis and export',
      items: [
        {
          title: appLang === 'bn' ? '১-৩. সার্চ ও এনালাইসিস (Search & Analysis)' : '1-3. Search & Analysis',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
          content: appLang === 'bn'
            ? '• সার্চ বার: শব্দ খুঁজলে টেক্সটে হাইলাইট হবে।\n• এনালাইসিস (মস্তিষ্ক আইকন): সার্চ করা শব্দ নিয়ে এআই বিস্তারিত বিশ্লেষণ ও সেন্টিমেন্ট (ইতিবাচক/নেতিবাচক) দিবে।\n• রিপোর্ট (ডকুমেন্ট আইকন): সার্চের ওপর ভিত্তি করে ফরমাল রিপোর্ট তৈরি করবে।'
            : 'Search highlights text. Analysis icon gives AI sentiment. Report icon generates official docs.'
        },
        {
          title: appLang === 'bn' ? '৪-৫. ভাষা ও কনভার্টার (Lang & Converter)' : '4-5. Lang & Converter',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />,
          content: appLang === 'bn'
            ? '• বাংলা (EN): পুরো ট্রান্সক্রিপ্টকে বাংলা থেকে ইংরেজি বা ইংরেজি থেকে বাংলায় অনুবাদ করবে।\n• ইউ/বি (Unicode/Bijoy): আউটপুট টেক্সটকে ইউনিকোড থেকে বিজয় ফন্টে রূপান্তর করবে (প্রিন্টের জন্য দরকারি)।'
            : 'Translate button flips language. U/B button converts text between Unicode and Bijoy encoding.'
        },
        {
          title: appLang === 'bn' ? '৬-৭. ফন্ট ও ডাউনলোড (Font & Download)' : '6-7. Font & Download',
          icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
          content: appLang === 'bn'
            ? '• ফন্ট ছোট/বড়: টেক্সট পড়ার সুবিধার জন্য + বা - চেপে সাইজ বদলানো যায়।\n• ডাউনলোড: PDF (প্রিন্ট রেডি), Word (এডিটেবল), Text বা SRT (সাবটাইটেল) ফরমেটে সেভ করার সুবিধা।'
            : 'Adjust font size with +/- buttons. Download as PDF, Word, Text, or SRT subtitles.'
        }
      ]
    }
  };

  const tabs = [
    { id: 'sidebar', label: appLang === 'bn' ? 'সাইডবার' : 'Sidebar', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 00-2-2h-2a2 2 0 00-2 2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 00-2-2h-2a2 2 0 00-2 2" /> },
    { id: 'header', label: appLang === 'bn' ? 'হেডার' : 'Header', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /> },
    { id: 'footer', label: appLang === 'bn' ? 'ফুটার' : 'Footer', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /> },
    { id: 'transcript', label: appLang === 'bn' ? 'আউটপুট' : 'Transcript', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> }
  ];

  // --- Resizing Logic ---
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const modalElement = document.getElementById('info-modal-container');
    if (modalElement) {
      const rect = modalElement.getBoundingClientRect();
      setSize({
        width: Math.max(800, e.clientX - rect.left),
        height: Math.max(600, e.clientY - rect.top)
      });
    }
  };

  const stopResizing = () => {
    isResizing.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', stopResizing);
  };

  // @ts-ignore
  const currentData = guideData[activeTab];

  return (
    <>
      {/* Minimized Floating Widget */}
      <div className={`fixed bottom-24 right-20 z-[120] animate-in slide-in-from-bottom-10 fade-in duration-300 ${isMinimized ? 'block' : 'hidden'}`}>
         <div 
           onClick={() => setIsMinimized(false)}
           className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border cursor-pointer hover:scale-105 transition-transform ${isDark ? 'bg-slate-900 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
         >
            <div className={`w-3 h-3 rounded-full ${activeColors.primary}`}></div>
            <span className="text-xs font-bold uppercase tracking-widest">{appLang === 'bn' ? 'নির্দেশিকা' : 'Guide'}</span>
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
         </div>
      </div>

      {/* Full Modal */}
      <div className={`fixed inset-0 z-[120] flex items-center justify-center p-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500 ${isMinimized ? 'hidden' : 'flex'}`}>
      <div 
        id="info-modal-container"
        className={`rounded-[3rem] border shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col relative ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
        style={{ 
            width: isMaximized ? '100vw' : `${size.width}px`, 
            height: isMaximized ? '100vh' : `${size.height}px`,
            maxWidth: isMaximized ? '100vw' : '95vw', 
            maxHeight: isMaximized ? '100vh' : '95vh',
            borderRadius: isMaximized ? '0' : '3rem'
        }}
      >
        
        {/* Header */}
        <header className="px-10 py-6 bg-slate-900 text-white flex items-center justify-between shrink-0 relative z-20 cursor-move">
          <div className="flex items-center gap-5 group">
            <div className={`w-12 h-12 ${activeColors.primary} rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12`}>
              <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight font-stylish-bn leading-none transition-colors group-hover:text-white/90">{appLang === 'bn' ? 'ব্যবহার নির্দেশিকা' : 'USER MANUAL'}</h2>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-1">LI CELL STUDIO V4.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMinimized(true)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all border border-white/5 group"><svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4"/></svg></button>
            <button onClick={() => setIsMaximized(!isMaximized)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all border border-white/5 group"><svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M20 8V4m0 0h-4M4 16v4m0 0h4M20 16v4m0 0h-4M4 20v4m0 0h4M20 20v4m0 0h-4"/></svg></button>
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-full transition-all border border-white/10 group"><svg className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative z-10">
          
          {/* Sidebar Navigation */}
          <aside className={`w-64 flex flex-col gap-2 p-6 border-r overflow-y-auto custom-scrollbar ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
             {tabs.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-left group relative overflow-hidden ${activeTab === tab.id ? `${activeColors.primary} text-white shadow-lg` : `hover:bg-black/5 ${isDark ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}`}
               >
                 <div className={`w-6 h-6 flex items-center justify-center ${activeTab === tab.id ? 'text-white' : 'opacity-60'}`}>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{tab.icon}</svg>
                 </div>
                 <span className="text-xs font-black uppercase tracking-widest font-stylish-bn">{tab.label}</span>
                 {activeTab === tab.id && <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none"></div>}
               </button>
             ))}
          </aside>

          {/* Main Content Area */}
          <main className={`flex-1 overflow-y-auto custom-scrollbar p-10 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
             <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="mb-8">
                   <h3 className={`text-3xl font-black uppercase tracking-tight mb-2 font-stylish-bn ${isDark ? 'text-white' : 'text-slate-800'}`}>{currentData.title}</h3>
                   <p className={`text-sm font-bold opacity-60 ${isDark ? 'text-white' : 'text-slate-600'}`}>{currentData.description}</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                   {currentData.items.map((item: any, idx: number) => (
                     <div key={idx} className={`p-6 rounded-[2rem] border flex gap-6 group transition-all hover:scale-[1.01] ${isDark ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-lg'}`}>
                        <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-600 text-white' : 'bg-white text-indigo-600 shadow-md'}`}>
                           <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
                        </div>
                        <div>
                           <h4 className={`text-lg font-black uppercase mb-3 font-stylish-bn ${activeColors.text}`}>{item.title}</h4>
                           <p className={`text-sm leading-relaxed font-medium whitespace-pre-line font-stylish-bn ${isDark ? 'text-white/80' : 'text-slate-600'}`}>{item.content}</p>
                        </div>
                     </div>
                   ))}
                </div>

                {/* Pro Tip Box */}
                <div className="mt-10 p-6 rounded-[2rem] bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 flex items-center gap-5">
                   <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-lg animate-pulse text-indigo-600 font-bold text-xl">!</div>
                   <div>
                      <h5 className="text-white font-black uppercase tracking-widest text-xs mb-1">PRO TIP</h5>
                      <p className="text-white/80 text-xs font-bold font-stylish-bn">
                        {appLang === 'bn' 
                          ? 'ভালো ফলাফলের জন্য নয়েজ-মুক্ত অডিও ব্যবহার করুন। বড় ফাইলের ক্ষেত্রে "Auto Split" ব্যবহার করলে দ্রুত কাজ হবে।' 
                          : 'Use noise-free audio for best results. For large files, "Auto Split" is faster.'}
                      </p>
                   </div>
                </div>
             </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="px-10 py-6 bg-slate-900/50 border-t border-slate-700 flex items-center justify-between shrink-0 backdrop-blur-sm relative z-20">
           {/* DB Setup Button */}
           <button 
             onClick={runDbSetup}
             className="px-6 py-3 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg hover:bg-slate-700 transition-all border border-white/10 active:scale-95"
           >
             DB SETUP
           </button>

           <button onClick={onClose} className={`px-10 py-3 ${activeColors.primary} text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all`}>
             {appLang === 'bn' ? 'বুঝতে পেরেছি' : 'GOT IT'}
           </button>
        </footer>

        {/* Resize Handle */}
        {!isMaximized && (
            <div 
            onMouseDown={startResizing}
            className="absolute bottom-4 right-4 w-12 h-12 cursor-nwse-resize flex items-center justify-center opacity-20 hover:opacity-100 transition-opacity z-[200]"
            >
            <svg className="w-8 h-8 text-slate-400 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 22h-2v-2h2v2zm0-4h-2v-2h2v2zm-4 4h-2v-2h2v2zm0-4h-2v-2h2v2zm-4 4h-2v-2h2v2zm8-8h-2v-2h2v2zm-12 8h-2v-2h2v2z"/>
            </svg>
            </div>
        )}
      </div>
      </div>
    </>
  );
};
