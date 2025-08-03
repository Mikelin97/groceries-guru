'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { ShoppingCart, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ChatHeader } from './components/ChatHeader';
import { ChatInput } from './components/ChatInput';
import { ProductCard, ProductRecommendation } from './components/ProductCard';
import { useVoiceInput } from './hooks/useVoiceInput';

export default function ChatPage() {
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const [showDebug, setShowDebug] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [useSimpleChat, setUseSimpleChat] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    key: useSimpleChat ? 'simple-chat' : 'full-chat', // Force re-initialization
    api: useSimpleChat ? '/api/chat-simple' : '/api/chat',
    ...(useSimpleChat ? {} : { maxSteps: 5 }),
    onError: (error) => {
      console.error('Chat error:', error);
    },
    onFinish: (message) => {
      console.log('Chat finished:', message);
    },
    onResponse: (response) => {
      console.log('Chat response received:', response.status, response.url);
    }
  });

  // Voice input functionality
  const { isRecording, isListening, handleVoiceToggle } = useVoiceInput((text) => {
    handleInputChange({ target: { value: text } } as any);
  });

  // Mock product recommendations for demonstration
  const mockProducts: ProductRecommendation[] = [
    {
      name: "Organic Steel Cut Oats",
      brand: "Nature's Path",
      price: "$6.99",
      rating: 4.5,
      reviews: 1247,
      highlights: ["High fiber", "Organic", "Gluten-free"],
      category: "Breakfast",
      image: "/api/placeholder/100/100"
    },
    {
      name: "Greek Yogurt Plain",
      brand: "Fage",
      price: "$5.49",
      rating: 4.7,
      reviews: 892,
      highlights: ["20g protein", "Probiotic", "No added sugar"],
      category: "Dairy",
      image: "/api/placeholder/100/100"
    }
  ];

  const handleImageUpload = () => {
    // Will be handled by ChatInput component
  };

  const testAIFunction = async (query: string, testType: 'milvus' | 'websearch' | 'both') => {
    try {
      const response = await fetch('/api/test-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, testType })
      });
      
      const result = await response.json();
      setTestResults(result);
      console.log('Test result:', result);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({ error: 'Test failed', details: error });
    }
  };

  const quickTestQueries = [
    'healthy breakfast cereals',
    'gluten free bread',
    'organic oat milk',
    'high protein snacks'
  ];

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const result = await response.json();
      setTestResults({
        type: 'health_check',
        ...result
      });
      console.log('Health check:', result);
    } catch (error) {
      console.error('Health check failed:', error);
      setTestResults({
        type: 'health_check',
        error: 'Health check failed',
        details: error
      });
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <ChatHeader showDebug={showDebug} onToggleDebug={() => setShowDebug(!showDebug)} />

      {/* Debug Panel */}
      {showDebug && (
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-900">AI Function Tests</h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Chat Mode:</label>
                <select
                  value={useSimpleChat ? 'simple' : 'full'}
                  onChange={(e) => {
                    const newValue = e.target.value === 'simple';
                    console.log('Changing chat mode to:', e.target.value, 'useSimpleChat will be:', newValue);
                    setUseSimpleChat(newValue);
                  }}
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                >
                  <option value="full">Full (with tools)</option>
                  <option value="simple">Simple (no tools)</option>
                </select>
              </div>
            </div>
            
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-700 text-sm font-semibold">Chat Error:</p>
                <p className="text-red-600 text-sm">{error.message}</p>
                <p className="text-gray-500 text-xs mt-1">Try switching to Simple mode if the error persists</p>
              </div>
            )}
            
            {/* Health Check */}
            <div className="mb-4">
              <Button
                onClick={checkHealth}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                🔍 Check API Health
              </Button>
            </div>

            {/* Quick Tests */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Test Queries</h3>
                <div className="space-y-2">
                  {quickTestQueries.map((query, index) => (
                    <div key={index} className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testAIFunction(query, 'milvus')}
                        className="text-xs flex-1"
                      >
                        KB: {query}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testAIFunction(query, 'websearch')}
                        className="text-xs"
                      >
                        Web
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Test Results */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Latest Test Result</h3>
                {testResults ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs">
                    <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                      {JSON.stringify(testResults, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No tests run yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-200px)] flex flex-col">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-orange-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Welcome to Groceries Guru!</h3>
                <p className="text-gray-500 mb-4">Ask me about any grocery products and I'll help you make the best choice.</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full transition-colors">
                    "Best breakfast cereals"
                  </button>
                  <button className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full transition-colors">
                    "Healthy snack options"
                  </button>
                  <button className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full transition-colors">
                    "Gluten-free alternatives"
                  </button>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  
                  {/* Message Content */}
                  <div className={`px-4 py-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-orange-500 text-white ml-auto' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {message.content.length > 0 ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-orange-500 rounded-full"></div>
                        <span className="italic">
                          {useSimpleChat 
                            ? 'Thinking...' 
                            : message?.toolInvocations?.[0]?.toolName === 'getInformation' 
                              ? 'Searching knowledge base...' 
                              : 'Searching web...'
                          }
                        </span>
                      </div>
                    )}

                    {/* File Attachments */}
                    {message?.experimental_attachments?.map((attachment, index) => (
                      <div key={`${message.id}-${index}`} className="mt-2">
                        {attachment.contentType?.startsWith('image/') ? (
                          <Image
                            src={attachment.url}
                            width={300}
                            height={200}
                            alt={attachment.name ?? `attachment-${index}`}
                            className="rounded-lg"
                          />
                        ) : attachment.contentType?.startsWith('application/pdf') ? (
                          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                            <p className="text-sm">📄 {attachment.name}</p>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {/* Product Recommendations */}
                  {message.role === 'assistant' && message.content.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {/* Show mock products for now - will be replaced with real AI recommendations */}
                      {message.content.toLowerCase().includes('cereal') && mockProducts.slice(0, 2).map((product, index) => (
                        <ProductCard key={index} product={product} />
                      ))}
                      {message.content.toLowerCase().includes('yogurt') && mockProducts.slice(2, 3).map((product, index) => (
                        <ProductCard key={index} product={product} />
                      ))}
                      {message.content.toLowerCase().includes('milk') && [mockProducts[2]].map((product, index) => (
                        <ProductCard key={index} product={product} />
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <Clock className="h-3 w-3" />
                    <span>Just now</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <ChatInput
            input={input}
            isLoading={isLoading}
            isListening={isListening}
            files={files}
            onInputChange={handleInputChange}
            onSubmit={(e) => {
              console.log('Form submitted, useSimpleChat:', useSimpleChat);
              console.log('API endpoint:', useSimpleChat ? '/api/chat-simple' : '/api/chat');
              
              handleSubmit(e, {
                experimental_attachments: files,
              });
              setFiles(undefined);
            }}
            onVoiceToggle={handleVoiceToggle}
            onImageUpload={handleImageUpload}
            onFilesChange={setFiles}
            isRecording={isRecording}
          />
        </div>
      </div>
    </div>
  );
}