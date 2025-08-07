'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, MessageCircle, Trash2, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthProvider } from '@/app/contexts/AuthContext';
import { LanguageProvider, useLanguage } from '@/app/contexts/LanguageContext';

interface ConversationSummary {
  id: number;
  title?: string;
  language: string;
  lastMessageAt?: Date;
  messageCount: number;
  isActive: boolean;
  createdAt: Date;
}

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
  createdAt?: Date;
}

function ChatHistoryContent() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const { t, language } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chat-history');
      const data = await response.json();
      
      if (data.success) {
        setConversations(data.conversations.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          lastMessageAt: conv.lastMessageAt ? new Date(conv.lastMessageAt) : undefined,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      setMessagesLoading(true);
      const response = await fetch(`/api/chat-history?conversationId=${conversationId}`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages.map((msg: any) => ({
          ...msg,
          createdAt: msg.createdAt ? new Date(msg.createdAt) : undefined,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const deleteConversation = async (conversationId: number) => {
    if (!confirm(t('chat.history.confirmDelete') || 'Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/chat-history?conversationId=${conversationId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        if (selectedConversation === conversationId) {
          setSelectedConversation(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const continueConversation = (conversationId: number) => {
    router.push(`/chat?conversationId=${conversationId}`);
  };

  const filteredConversations = conversations
    .filter(conv => {
      const matchesSearch = !searchTerm || 
        conv.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.id.toString().includes(searchTerm);
      const matchesLanguage = languageFilter === 'all' || conv.language === languageFilter;
      return matchesSearch && matchesLanguage;
    })
    .sort((a, b) => {
      const aDate = a.lastMessageAt || a.createdAt;
      const bDate = b.lastMessageAt || b.createdAt;
      return bDate.getTime() - aDate.getTime();
    });

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return t('chat.history.justNow') || 'Just now';
    } else if (diffInHours < 24) {
      return t('chat.history.hoursAgo') || `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return t('chat.history.daysAgo') || `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getConversationPreview = (conv: ConversationSummary) => {
    if (conv.title) return conv.title;
    return t('chat.history.conversation') || `Conversation ${conv.id}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('chat.history.title') || 'Chat History'}
          </h1>
          <p className="text-gray-600">
            {t('chat.history.subtitle') || 'View and manage your past conversations with Groceries Guru'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder={t('chat.history.searchPlaceholder') || 'Search conversations...'}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Language Filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={languageFilter}
                      onChange={(e) => setLanguageFilter(e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 flex-1"
                    >
                      <option value="all">{t('chat.history.allLanguages') || 'All Languages'}</option>
                      <option value="en">English</option>
                      <option value="zh">中文</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>{t('chat.history.noConversations') || 'No conversations found'}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredConversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedConversation === conv.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                        }`}
                        onClick={() => {
                          setSelectedConversation(conv.id);
                          fetchMessages(conv.id);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {getConversationPreview(conv)}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {conv.messageCount} {t('chat.history.messages') || 'messages'}
                              </span>
                              <span className="text-xs text-gray-300">•</span>
                              <span className="text-xs text-gray-500">
                                {conv.language.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(conv.lastMessageAt || conv.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                continueConversation(conv.id);
                              }}
                              className="text-xs px-2 py-1"
                            >
                              {t('chat.history.continue') || 'Continue'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conv.id);
                              }}
                              className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages View */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[700px] flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-900">
                      {getConversationPreview(
                        conversations.find(c => c.id === selectedConversation)!
                      )}
                    </h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                            <div className="h-16 bg-gray-200 rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message, index) => (
                          <div
                            key={message.id || index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-2xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                              <div className={`px-4 py-3 rounded-lg ${
                                message.role === 'user' 
                                  ? 'bg-orange-500 text-white ml-auto' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                <p className="whitespace-pre-wrap">{message.content}</p>
                              </div>
                              {message.createdAt && (
                                <div className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${
                                  message.role === 'user' ? 'justify-end' : 'justify-start'
                                }`}>
                                  <Clock className="h-3 w-3" />
                                  <span>{formatDate(message.createdAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">
                      {t('chat.history.selectConversation') || 'Select a conversation'}
                    </p>
                    <p className="text-sm">
                      {t('chat.history.selectConversationDesc') || 'Choose a conversation from the list to view its messages'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatHistoryPage() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ChatHistoryContent />
      </LanguageProvider>
    </AuthProvider>
  );
}