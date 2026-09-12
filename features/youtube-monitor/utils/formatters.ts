export const formatTime = (dateString: string, appLang: 'en' | 'bn' = 'bn') => {
  const date = new Date(dateString);
  const locale = appLang === 'bn' ? 'bn-BD' : 'en-US';
  return date.toLocaleString(locale, { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const toBengaliNumber = (num: number | string) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
};

export const getRelativeTime = (dateString: string, appLang: 'en' | 'bn' = 'bn') => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return appLang === 'bn' ? 'এইমাত্র' : 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return appLang === 'bn' ? `${toBengaliNumber(diffInMinutes)} মিনিট আগে` : `${diffInMinutes} mins ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return appLang === 'bn' ? `${toBengaliNumber(diffInHours)} ঘণ্টা আগে` : `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return appLang === 'bn' ? `${toBengaliNumber(diffInDays)} দিন আগে` : `${diffInDays} days ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return appLang === 'bn' ? `${toBengaliNumber(diffInMonths)} মাস আগে` : `${diffInMonths} months ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return appLang === 'bn' ? `${toBengaliNumber(diffInYears)} বছর আগে` : `${diffInYears} years ago`;
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('bn-BD', options);
};
