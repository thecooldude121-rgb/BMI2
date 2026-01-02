import { useState, useRef, useEffect } from 'react';
import { Send, BarChart3, Target, Mail, TrendingUp, Lightbulb } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: JSX.Element;
  prompt: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

const defaultQuickActions: QuickAction[] = [
  {
    id: 'pipeline',
    label: 'Analyze my pipeline',
    icon: <BarChart3 className="w-4 h-4" />,
    prompt: 'Analyze my pipeline and show me the key metrics'
  },
  {
    id: 'leads',
    label: 'Which leads to contact today?',
    icon: <Target className="w-4 h-4" />,
    prompt: 'Which leads should I contact today?'
  },
  {
    id: 'email',
    label: 'Help me write an email',
    icon: <Mail className="w-4 h-4" />,
    prompt: 'Help me write an email'
  },
  {
    id: 'forecast',
    label: 'Sales forecast this month',
    icon: <TrendingUp className="w-4 h-4" />,
    prompt: 'What is the sales forecast for this month?'
  },
  {
    id: 'strategy',
    label: 'Deal strategy recommendations',
    icon: <Lightbulb className="w-4 h-4" />,
    prompt: 'Give me deal strategy recommendations'
  }
];

export default function ChatInterface({ messages, onSendMessage, isLoading = false }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
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

  const showWelcome = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">AI Sales Copilot</h1>
            <p className="text-sm text-gray-600">Your intelligent sales assistant</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {showWelcome && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">🤖</span>
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
                    className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left group"
                  >
                    <span className="text-blue-600 group-hover:text-blue-700">
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
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🤖</span>
                      <span className="text-xs font-medium text-gray-500">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] bg-white border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🤖</span>
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
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-xl">💬</span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
