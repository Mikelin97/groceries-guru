import { ShoppingCart } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="bg-orange-500 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Groceries Guru</h1>
          <p className="text-gray-600 mt-2">Your AI Shopping Assistant</p>
        </div>
        
        {/* Auth Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {children}
        </div>
      </div>
    </div>
  );
}