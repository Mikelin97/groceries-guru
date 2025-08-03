import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  showDebug: boolean;
  onToggleDebug: () => void;
}

export const ChatHeader = ({ showDebug, onToggleDebug }: ChatHeaderProps) => (
  <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 rounded-full p-2">
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">Groceries Guru</h1>
            <p className="text-sm text-gray-500">Your AI Shopping Assistant</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleDebug}
          className="text-xs"
        >
          {showDebug ? 'Hide' : 'Show'} Debug
        </Button>
      </div>
    </div>
  </div>
);