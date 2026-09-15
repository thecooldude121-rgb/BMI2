import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ConversationSidebar from '../../components/AI/ConversationSidebar';
import EnhancedChatInterface from '../../components/AI/EnhancedChatInterface';

interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  isActive: boolean;
  timeGroup: 'TODAY' | 'YESTERDAY' | 'THIS WEEK' | 'THIS MONTH' | 'OLDER';
}

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

/**
 * AI COPILOT — PREVIEW. NOT A WORKING FEATURE, AND NO LONGER PRETENDING.
 *
 * ─── WHAT WAS REMOVED AND WHY ──────────────────────────────────────────────
 *
 * This page used to answer questions by keyword-matching the query and
 * returning one of five canned transcripts (~800 lines of them). Those
 * transcripts did not merely invent numbers — they ASSERTED SPECIFIC CRM FACTS
 * ABOUT NAMED PEOPLE AT NAMED COMPANIES, in the voice of an assistant reading
 * your database:
 *
 *     "Based on your CRM data, I can see:
 *      • Last contact: 5 days ago (Proposal sent via email)
 *      • Email open rate: Opened 2x but no response
 *      • Deal stage: Prospecting → Needs momentum"
 *
 * None of it came from anywhere, and each transcript ended in recommended
 * actions computed from the same nothing. That is a different and worse thing
 * than a fabricated metric: a fake number misleads inside the app, whereas this
 * fabricates a customer record and tells you to act on it.
 *
 * A `PREVIEW · SAMPLE CONTENT` badge would not have been enough, for the reason
 * the fabricated-credential rule gives: the label does not travel with the
 * content. Anyone could paste "last contact 5 days ago, opened 2x" into a call
 * or a deal note, where it is indistinguishable from a real observation. So the
 * transcripts are DELETED, not labelled, and what remains is a page that says
 * plainly that it does nothing yet.
 *
 * The real build stays at P4 in the facade-page audit: it needs an LLM
 * integration plus retrieval over real CRM data, and CLAUDE.md puts AI features
 * in Phase 2. The shell, the route and the chat layout are kept so that work
 * has somewhere to land.
 */

const mockConversations: Conversation[] = [];


export default function AICopilotPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasProcessedQuery, setHasProcessedQuery] = useState(false);

  // The effect that lived here loaded a canned transcript per
  // conversation id. See the note at the top of this file: the
  // transcripts asserted invented CRM facts about named customers and
  // were deleted rather than labelled. A selected conversation now shows
  // nothing, which is the truth.
  useEffect(() => {
    setMessages([]);
  }, [activeConversationId]);


  useEffect(() => {
    const query = searchParams.get('query');
    if (query && !hasProcessedQuery) {
      handleNewChat();
      setTimeout(() => {
        handleSendMessage(query);
        setHasProcessedQuery(true);
        setSearchParams({});
      }, 100);
    }
  }, [searchParams, hasProcessedQuery]);

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setConversations(prevConvs =>
      prevConvs.map(conv => ({ ...conv, isActive: false }))
    );
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setConversations(prevConvs =>
      prevConvs.map(conv => ({
        ...conv,
        isActive: conv.id === id
      }))
    );
  };

  /**
   * The ONLY reply this page produces. Every question gets the same answer on
   * purpose: there is no model, no retrieval and no CRM read behind this page,
   * so a reply that varied by question would be implying otherwise.
   */
  const notBuiltReply = (userQuery: string): EnhancedMessage => ({
    id: `ai-${Date.now()}`,
    role: 'assistant',
    content:
      `**This assistant is not built yet, so it cannot answer "${userQuery}".**\n\n`
      + 'Nothing is connected behind this page \u2014 no model, and no access to your '
      + 'CRM data. It is a preview of where the feature will live.\n\n'
      + 'What used to appear here were fixed examples naming real-sounding '
      + 'companies and contacts, with invented contact history. They were removed '
      + 'rather than labelled: an invented "last contacted 5 days ago" is '
      + 'impossible to tell from a real one once it leaves the screen.\n\n'
      + 'For figures that ARE computed from your data today, see the Sales '
      + 'Intelligence Guide on the dashboard, and Reports.',
    timestamp: 'Just now',
  });

  const handleSendMessage = async (content: string) => {
    const userMessage: EnhancedMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(() => {
      const aiMessage = notBuiltReply(content);
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);

      if (!activeConversationId) {
        const newConv: Conversation = {
          id: `conv-${Date.now()}`,
          title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
          timestamp: 'Just now',
          isActive: true,
          timeGroup: 'TODAY'
        };
        setConversations(prev => [
          newConv,
          ...prev.map(c => ({ ...c, isActive: false }))
        ]);
        setActiveConversationId(newConv.id);
      }
    }, 1500);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations(prev => prev.map(conv =>
      conv.id === id ? { ...conv, title: newTitle } : conv
    ));
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
      />
      <EnhancedChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
