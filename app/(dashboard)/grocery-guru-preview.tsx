'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Star, ShoppingCart } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'guru';
  content: string;
  products?: Product[];
}

interface Product {
  name: string;
  rating: number;
  price: string;
  highlight: string;
}

export function GroceryGuruPreview() {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [showTyping, setShowTyping] = useState(false);

  const conversation: Message[] = [
    {
      id: 1,
      role: 'user',
      content: "I'm looking for a healthy breakfast cereal. Any recommendations?"
    },
    {
      id: 2,
      role: 'guru',
      content: "I'd be happy to help! Based on your preference for healthy options, here are some great cereals:",
      products: [
        {
          name: "Nature's Path Organic Flax Plus",
          rating: 4.5,
          price: "$6.99",
          highlight: "High fiber, omega-3 rich"
        },
        {
          name: "Kashi GO Lean Crunch",
          rating: 4.3,
          price: "$5.49",
          highlight: "13g protein, whole grains"
        },
        {
          name: "Barbara's Puffins Original",
          rating: 4.4,
          price: "$4.99",
          highlight: "Low sugar, high fiber"
        }
      ]
    },
    {
      id: 3,
      role: 'user',
      content: "What about something gluten-free?"
    },
    {
      id: 4,
      role: 'guru',
      content: "Perfect! Here are excellent gluten-free options:",
      products: [
        {
          name: "Three Wishes Grain-Free Cereal",
          rating: 4.6,
          price: "$7.99",
          highlight: "8g protein, grain-free"
        },
        {
          name: "Love Grown Power O's",
          rating: 4.2,
          price: "$5.99",
          highlight: "Navy bean based, 4g protein"
        }
      ]
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      if (currentMessage < conversation.length - 1) {
        setShowTyping(true);
        setTimeout(() => {
          setCurrentMessage(prev => prev + 1);
          setShowTyping(false);
        }, 1500);
      } else {
        // Reset conversation after a pause
        setTimeout(() => {
          setCurrentMessage(0);
        }, 3000);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [currentMessage, conversation.length]);

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-orange-500 text-white p-4 flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Groceries Guru</h3>
            <p className="text-orange-100 text-sm">Your AI Shopping Assistant</p>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="p-4 space-y-4 min-h-[400px] max-h-[400px] overflow-y-auto">
          {conversation.slice(0, currentMessage + 1).map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm">{message.content}</p>
                
                {/* Product recommendations */}
                {message.products && (
                  <div className="mt-3 space-y-2">
                    {message.products.map((product, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{product.name}</h4>
                          <span className="text-green-600 font-bold text-sm">{product.price}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex items-center">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-gray-600 ml-1">{product.rating}</span>
                          </div>
                        </div>
                        <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                          {product.highlight}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {showTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg max-w-xs">
                <div className="flex items-center gap-1">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">Guru is typing...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <MessageCircle className="h-4 w-4" />
            <span>Try asking about products...</span>
          </div>
        </div>
      </div>
    </div>
  );
}