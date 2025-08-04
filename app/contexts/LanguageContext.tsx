'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Header
    'app.title': 'Groceries Guru',
    'app.subtitle': 'Your AI Shopping Assistant',
    'user.signout': 'Sign out',
    'debug.show': 'Show Debug',
    'debug.hide': 'Hide Debug',
    
    // Chat
    'chat.welcome.title': 'Welcome to Groceries Guru!',
    'chat.welcome.subtitle': 'Ask me about any grocery products and I\'ll help you make the best choice.',
    'chat.suggestions.cereals': '"Best breakfast cereals"',
    'chat.suggestions.snacks': '"Healthy snack options"',
    'chat.suggestions.glutenfree': '"Gluten-free alternatives"',
    'chat.placeholder': 'Ask about any grocery product...',
    'chat.listening': 'Listening... speak now',
    'chat.thinking': 'Thinking...',
    'chat.searching.kb': 'Searching knowledge base...',
    'chat.searching.web': 'Searching web...',
    
    // Voice input
    'voice.tooltip.start': 'Start voice input',
    'voice.tooltip.stop': 'Stop recording',
    'voice.tooltip.https': 'Voice input requires HTTPS on mobile devices',
    'voice.https.title': 'Voice input requires HTTPS',
    'voice.https.description': 'Mobile browsers require a secure connection (HTTPS) to access the microphone.',
    'voice.https.suggestion': 'Try accessing via HTTPS or use the desktop version.',
    
    // Language toggle
    'language.toggle': 'Language',
    'language.english': 'English',
    'language.chinese': '中文',
  },
  zh: {
    // Header
    'app.title': '购物助手',
    'app.subtitle': '您的AI购物助手',
    'user.signout': '退出登录',
    'debug.show': '显示调试',
    'debug.hide': '隐藏调试',
    
    // Chat
    'chat.welcome.title': '欢迎使用购物助手！',
    'chat.welcome.subtitle': '询问任何商品，我将帮助您做出最佳选择。',
    'chat.suggestions.cereals': '"最好的早餐谷物"',
    'chat.suggestions.snacks': '"健康零食选择"',
    'chat.suggestions.glutenfree': '"无麸质替代品"',
    'chat.placeholder': '询问任何商品...',
    'chat.listening': '正在聆听...请说话',
    'chat.thinking': '思考中...',
    'chat.searching.kb': '搜索知识库中...',
    'chat.searching.web': '网络搜索中...',
    
    // Voice input
    'voice.tooltip.start': '开始语音输入',
    'voice.tooltip.stop': '停止录音',
    'voice.tooltip.https': '移动设备上的语音输入需要HTTPS',
    'voice.https.title': '语音输入需要HTTPS',
    'voice.https.description': '移动浏览器需要安全连接(HTTPS)才能访问麦克风。',
    'voice.https.suggestion': '请尝试通过HTTPS访问或使用桌面版。',
    
    // Language toggle
    'language.toggle': '语言',
    'language.english': 'English',
    'language.chinese': '中文',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'zh')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    handleSetLanguage(newLang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[Language]] || key;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage: handleSetLanguage,
      toggleLanguage,
      t
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};