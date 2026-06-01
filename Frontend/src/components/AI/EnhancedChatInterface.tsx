import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, BarChart3, Target, Mail, TrendingUp, Lightbulb, ThumbsUp, ThumbsDown, Copy, RotateCw, ExternalLink, Calendar, FileText, CheckSquare, Download, Eye } from 'lucide-react';
import DealRecommendationCard from './DealRecommendationCard';

interface DealRecommendation {
  name: string;
  value: string;
  stage: string;
  badge: {
    icon: string;
    text: string;
    type: 'warning' | 'success' | 'info';
  };
  whyFocus: string[];
  nextAction: {
    title: string;
    details: string[];
  };
  actions: Array<{
    label: string;
    icon?: JSX.Element;
    onClick: () => void;
  }>;
}

interface EnhancedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  deals?: DealRecommendation[];
  summary?: {
    text: string;
    stats: { label: string; value: string }[];
  };
  primaryActions?: Array<{
    label: string;
    icon: JSX.Element;
    onClick: () => void;
  }>;
}

interface QuickAction {
  id: string;
  label: string;
  icon: JSX.Element;
  prompt: string;
}

interface EnhancedChatInterfaceProps {
  messages: EnhancedMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

const defaultQuickActions: QuickAction[] = [
  {
    id: 'pipeline',
    label: '📊 Analyze my pipeline',
    icon: <BarChart3 className="w-4 h-4" />,
    prompt: 'Which deals should I focus on this week?'
  },
  {
    id: 'leads',
    label: '🎯 Which leads to contact today?',
    icon: <Target className="w-4 h-4" />,
    prompt: 'Which leads should I contact today? I have 12 new leads this week.'
  },
  {
    id: 'email',
    label: '✉️ Help me write an email',
    icon: <Mail className="w-4 h-4" />,
    prompt: 'Help me write an email'
  },
  {
    id: 'forecast',
    label: '📈 Sales forecast this month',
    icon: <TrendingUp className="w-4 h-4" />,
    prompt: "What's my sales forecast for this month? How likely am I to hit my $250K target?"
  },
  {
    id: 'strategy',
    label: '💡 Deal strategy recommendations',
    icon: <Lightbulb className="w-4 h-4" />,
    prompt: 'Which deals should I focus on this week?'
  }
];

export default function EnhancedChatInterface({ messages, onSendMessage, isLoading = false }: EnhancedChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down' | null>>({});
  const [toast, setToast] = useState<{message: string; visible: boolean}>({ message: '', visible: false });
  const navigate = useNavigate();

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleQuickAction = (prompt: string) => {
    if (!isLoading) {
      onSendMessage(prompt);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    const currentFeedback = feedbackGiven[messageId];
    if (!currentFeedback) {
      setFeedbackGiven(prev => ({
        ...prev,
        [messageId]: type
      }));
      showToast(type === 'up' ? 'Thanks for feedback!' : 'Feedback received');
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    showToast('Copied to clipboard!');
  };

  const handleRegenerate = (content: string) => {
    onSendMessage(content);
    showToast('Regenerating response...');
  };

  const showWelcome = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AI Sales Copilot</h1>
              <p className="text-sm text-gray-600">Your intelligent sales assistant</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {showWelcome && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                  <span className="text-lg">🤖</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-2">AI Assistant</p>
                  <p className="text-gray-700 leading-relaxed">
                    Hello! I'm your AI Sales Copilot. I can help you with deal strategy,
                    lead prioritization, email writing, and sales forecasting.
                  </p>
                  <p className="text-gray-700 mt-3">
                    What would you like help with today?
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Quick Actions:</p>
              <div className="grid grid-cols-1 gap-2">
                {defaultQuickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left group"
                  >
                    <span className="text-purple-600 group-hover:text-purple-700">
                      {action.icon}
                    </span>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'user' ? (
                  <div className="flex items-start gap-3 max-w-[70%]">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm">👤</span>
                    </div>
                    <div className="bg-gray-200 rounded-lg px-4 py-3 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-700">You</span>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-900">{message.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <span className="text-sm">🤖</span>
                    </div>
                    <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">AI Assistant</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(message.content)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Copy"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const lastUserMessage = messages.slice(0, messages.indexOf(message)).reverse().find(m => m.role === 'user');
                              if (lastUserMessage) {
                                handleRegenerate(lastUserMessage.content);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Regenerate"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm text-gray-700 leading-relaxed mb-4">
                        {message.content}
                      </p>

                      {message.deals && message.deals.length > 0 && (
                        <div>
                          <div className="border-t border-gray-200 my-6"></div>

                          {message.deals.map((deal, index) => (
                            <DealRecommendationCard
                              key={index}
                              deal={deal}
                              index={index + 1}
                            />
                          ))}
                        </div>
                      )}

                      {message.summary && (
                        <div className="mt-6">
                          <div className="border-t border-gray-200 my-6"></div>

                          <div className="flex items-start gap-2 mb-3">
                            <span className="text-base">📊</span>
                            <p className="text-sm font-semibold text-gray-900">Summary:</p>
                          </div>
                          <p className="text-sm text-gray-700 mb-4">{message.summary.text}</p>
                        </div>
                      )}

                      {message.primaryActions && message.primaryActions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {message.primaryActions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={action.onClick}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                            >
                              {action.icon}
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {message.role === 'assistant' && message.content.toLowerCase().includes('deal') && (
                        <div className="mt-4">
                          <button
                            onClick={() => navigate('/crm/ai-copilot/response/strategy-1')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View Full Strategy
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleFeedback(message.id, 'up')}
                        disabled={!!feedbackGiven[message.id]}
                        className={`p-1.5 rounded transition-colors ${
                          feedbackGiven[message.id] === 'up'
                            ? 'bg-green-100 text-green-600'
                            : feedbackGiven[message.id]
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleFeedback(message.id, 'down')}
                        disabled={!!feedbackGiven[message.id]}
                        className={`p-1.5 rounded transition-colors ${
                          feedbackGiven[message.id] === 'down'
                            ? 'bg-red-100 text-red-600'
                            : feedbackGiven[message.id]
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <span className="text-sm">🤖</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg px-6 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-gray-500">AI Assistant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <span className="text-xl mb-2">💬</span>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={isLoading}
              rows={1}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm resize-none overflow-hidden"
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {toast.visible && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up">
          {toast.message}
        </div>
      )}
    </div>
  );
}
