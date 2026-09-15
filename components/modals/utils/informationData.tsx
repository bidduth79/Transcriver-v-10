import React from 'react';

export const getGuideData = (appLang: 'bn' | 'en') => ({
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
            ? 'এটি দেখায় আপনার XAMPP লোকাল সার্ভার কানেক্টেড কিনা।\n• সবুজ (Online): সব ঠিক আছে, ডাটাবেসে সেভ হচ্ছে।\n• লাল (Offline): সার্ভার বন্ধ, ডাটা সেভ হবেবিধা। ক্লিক করে আইপি ঠিক করা যায়।'
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
});

export const getTabs = (appLang: 'bn' | 'en') => [
    { id: 'sidebar', label: appLang === 'bn' ? 'সাইডবার' : 'Sidebar', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 00-2-2h-2a2 2 0 00-2 2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 00-2-2h-2a2 2 0 00-2 2" /> },
    { id: 'header', label: appLang === 'bn' ? 'হেডার' : 'Header', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /> },
    { id: 'footer', label: appLang === 'bn' ? 'ফুটার' : 'Footer', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /> },
    { id: 'transcript', label: appLang === 'bn' ? 'আউটপুট' : 'Transcript', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> }
];
