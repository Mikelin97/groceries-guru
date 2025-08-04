import { ShoppingCart, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/contexts/AuthContext';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { LanguageToggle } from '@/components/ui/language-toggle';

interface ChatHeaderProps {
  showDebug: boolean;
  onToggleDebug: () => void;
}

export const ChatHeader = ({ showDebug, onToggleDebug }: ChatHeaderProps) => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 rounded-full p-2">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">{t('app.title')}</h1>
              <p className="text-sm text-gray-500">{t('app.subtitle')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2 mr-4">
                <div className="bg-gray-100 rounded-full p-1">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user.name || 'User'}</div>
                  <div className="text-gray-500 text-xs">{user.email}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-xs text-gray-500 hover:text-red-600"
                  title={t('user.signout')}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <LanguageToggle />
            
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleDebug}
              className="text-xs"
            >
              {showDebug ? t('debug.hide') : t('debug.show')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};