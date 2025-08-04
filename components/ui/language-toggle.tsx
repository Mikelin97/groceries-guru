import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/app/contexts/LanguageContext';

export const LanguageToggle = () => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2 min-w-[80px]"
      title={t('language.toggle')}
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs font-medium">
        {language === 'en' ? 'EN' : '中'}
      </span>
    </Button>
  );
};