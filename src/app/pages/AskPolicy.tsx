import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, FileText, ThumbsUp, ThumbsDown, Loader2, ChevronDown } from "lucide-react";
import axios from "axios";
import { useRole } from "../contexts/RoleContext";

interface Message {
  id: number;
  type: "user" | "ai";
  content: string;
  sources?: { name: string; relevance: number; snippet?: string }[];
  timestamp: string;
  feedback?: "helpful" | "not-helpful";
  followUps?: string[];
}

export function AskPolicy() {
  const { userRole } = useRole();
  const currentRole = userRole || "STUDENT";

  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "ai",
      content: "Hello! I'm your friendly AI Policy Assistant. Ask me anything about institutional policies, procedures, and guidelines. I'll provide accurate answers with source citations.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const [recentQuestions, setRecentQuestions] = useState<string[]>([]);
  const [popularTopics, setPopularTopics] = useState<{label: string, color: string}[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      // 1. Fetch Recent Questions safely
      try {
        const recentRes = await axios.get("http://localhost:8000/analytics/recent");
        setRecentQuestions(recentRes.data);
      } catch (error) {
        console.error("Failed to load recent questions", error);
      }

      // 2. Fetch Popular Topics safely
      try {
        const topicsRes = await axios.get("http://localhost:8000/analytics/popular");
        setPopularTopics(topicsRes.data);
      } catch (error) {
        console.error("Failed to load popular topics", error);
      }
    };
    
    fetchAnalytics();
  }, []);

  const userEmail = localStorage.getItem('userEmail') || 'guest@ctu.edu.ph';

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/chat-history?email=${userEmail}`);

        if (res.data && res.data.length > 0) {
          const formattedHistory = res.data.map((msg: any, index: number) => ({
            id: index + 2,
            type: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));

          setMessages([
            {
              id: 1,
              type: "ai",
              content: "Hello! I'm your friendly AI Policy Assistant. Ask me anything about institutional policies, procedures, and guidelines.",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            },
            ...formattedHistory
          ]);
        }
      } catch (error) {
        console.error("Failed to load chat history", error);
      }
    };
    fetchHistory();
  }, [userEmail]);

  const handleSendMessage = async (quickText?: string) => {
    const textToSend = typeof quickText === 'string' ? quickText : query;

    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/ask-policy", {
        question: textToSend,
        user_email: userEmail,
        user_role: currentRole,
      });

      const formattedSources = response.data.sources.map((src: any) => ({
        name: src.name,
        snippet: src.snippet,
        relevance: src.relevance
      }));

      const aiMessage: Message = {
        id: messages.length + 2,
        type: "ai",
        content: response.data.answer,
        sources: formattedSources.length > 0 ? formattedSources : undefined,
        followUps: response.data.follow_ups,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 2,
        type: "ai",
        content: "Sorry, I had trouble connecting to the AI brain. Please make sure the backend and your connection are running!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: number, isHelpful: boolean) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId
          ? { ...msg, feedback: isHelpful ? "helpful" : "not-helpful" }
          : msg
      )
    );

    const aiMessage = messages.find((m) => m.id === messageId);
    const userMessage = messages.find((m) => m.id === messageId - 1);

    if (aiMessage && userMessage) {
      try {
        await axios.post("http://localhost:8000/feedback", {
          question: userMessage.content,
          answer: aiMessage.content,
          is_helpful: isHelpful,
        });
      } catch (error) {
        console.error("Failed to submit feedback", error);
      }
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col overflow-hidden">

      {/* Page Header */}
      <div className="shrink-0 mb-4">
        <h1 className="text-2xl font-semibold text-[#1F2937]">Ask Policy</h1>
        <p className="text-sm text-[#6B7280] mt-1">Get instant AI-powered answers to your policy and governance questions</p>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">

        {/* ── LEFT SIDEBAR ── */}
        <div className="w-72 shrink-0 flex flex-col gap-4 overflow-y-auto">

          {/* Recent Questions */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
            <h3 className="text-base font-semibold text-[#1F2937] mb-4">Recent Questions</h3>
            <div className="space-y-2">
              {recentQuestions.length > 0 ? recentQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(question)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-[#374151] hover:bg-[#F5F7FA] hover:text-[#1D6FA3] transition-colors border border-transparent hover:border-[#E5E7EB]"
                >
                  {question}
                </button>
              )) : (
                <p className="text-sm text-[#9CA3AF] italic">No recent questions yet.</p>
              )}
            </div>
          </div>

          {/* Popular Topics */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
            <h4 className="text-sm font-medium mb-4 text-[#1F2937]">Popular Topics</h4>
            <div className="flex flex-wrap gap-2">
              {popularTopics.map((topic, index) => {
                const colors = ['blue', 'emerald', 'purple'];
                const color = topic.color || colors[index % colors.length];
                return (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(`What are the policies regarding ${topic.label}?`)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors cursor-pointer
                      ${color === 'blue'    ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' : ''}
                      ${color === 'emerald' ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' : ''}
                      ${color === 'purple'  ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200' : ''}
                    `}
                  >
                    {topic.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── MAIN CHAT PANEL ── */}
        <div className="flex-1 flex flex-col min-h-0 bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] lg:max-w-[75%] ${message.type === "user" ? "order-2" : "order-1"}`}>

                  {message.type === "ai" && (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-[#1D6FA3] rounded-lg flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-[#1F2937]">AI Assistant</span>
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-5 py-4 ${
                      message.type === "user"
                        ? "bg-[#1D6FA3] text-white rounded-tr-sm border border-[#1D6FA3]"
                        : "bg-[#F9FAFB] text-[#1F2937] border border-[#E5E7EB] rounded-tl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
                  </div>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 ml-2 space-y-2">
                      <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Sources</p>
                      {message.sources.map((source, index) => (
                        <details
                          key={index}
                          className="group bg-white border border-[#E5E7EB] rounded-lg overflow-hidden mb-2 [&_summary::-webkit-details-marker]:hidden"
                        >
                          <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#F5F7FA] transition-colors list-none">
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-[#1D6FA3]" />
                              <span className="text-sm font-medium text-[#374151]">{source.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 hidden sm:flex">
                                <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-1.5 rounded-full transition-all duration-500 ${
                                      source.relevance >= 80 ? 'bg-[#10B981]' :
                                      source.relevance >= 60 ? 'bg-[#F59E0B]' :
                                      'bg-[#EF4444]'
                                    }`}
                                    style={{ width: `${source.relevance}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-bold min-w-[32px] ${
                                  source.relevance >= 80 ? 'text-[#10B981]' :
                                  source.relevance >= 60 ? 'text-[#F59E0B]' :
                                  'text-[#EF4444]'
                                }`}>
                                  {source.relevance}%
                                </span>
                              </div>
                              <ChevronDown className="h-4 w-4 text-[#6B7280] group-open:rotate-180 transition-transform duration-200" />
                            </div>
                          </summary>

                          {source.snippet && (
                            <div className="p-3 bg-[#F9FAFB] border-t border-[#E5E7EB] text-xs text-[#4B5563] leading-relaxed italic">
                              "{source.snippet}"
                            </div>
                          )}
                        </details>
                      ))}

                      {/* Helpful / Not Helpful */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleFeedback(message.id, true)}
                          disabled={message.feedback !== undefined}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors border
                            ${message.feedback === 'helpful'
                              ? 'bg-green-100 text-[#10B981] border-green-200'
                              : 'text-[#6B7280] border-transparent hover:text-[#10B981] hover:bg-green-50 hover:border-green-100 disabled:opacity-50'
                            }`}
                        >
                          <ThumbsUp className={`h-3.5 w-3.5 ${message.feedback === 'helpful' ? 'fill-current' : ''}`} />
                          Helpful
                        </button>

                        <button
                          onClick={() => handleFeedback(message.id, false)}
                          disabled={message.feedback !== undefined}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors border
                            ${message.feedback === 'not-helpful'
                              ? 'bg-red-100 text-[#EF4444] border-red-200'
                              : 'text-[#6B7280] border-transparent hover:text-[#EF4444] hover:bg-red-50 hover:border-red-100 disabled:opacity-50'
                            }`}
                        >
                          <ThumbsDown className={`h-3.5 w-3.5 ${message.feedback === 'not-helpful' ? 'fill-current' : ''}`} />
                          Not Helpful
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Follow-up chips */}
                  {message.followUps && message.followUps.length > 0 && (
                    <div className="mt-4 ml-2 flex flex-col gap-2 items-start">
                      {message.followUps.map((fq, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(fq)}
                          disabled={isLoading}
                          className="px-4 py-2 bg-white border border-[#E5E7EB] hover:border-[#1D6FA3] text-[#1D6FA3] hover:bg-[#F5F7FA] text-xs font-medium rounded-full transition-all disabled:opacity-50 text-left shadow-sm hover:shadow-md"
                        >
                          {fq.endsWith('?') ? fq : `${fq}?`}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className={`text-[11px] text-[#9CA3AF] mt-2 block ${message.type === "user" ? "text-right mr-1" : "ml-1"}`}>
                    {message.timestamp}
                  </span>

                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[75%] order-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-[#1D6FA3] rounded-lg flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-[#1F2937]">AI Assistant</span>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-5 py-4 bg-[#F9FAFB] border border-[#E5E7EB] flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-[#1D6FA3]" />
                    <p className="text-[15px] text-[#6B7280]">Searching knowledge base...</p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-[#E5E7EB] p-4 sm:p-6 bg-white">
            <div className="flex gap-3 items-center">
              <div className="flex-1 relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask a question about policies, procedures, or guidelines..."
                  className="w-full pl-5 pr-12 py-[17px] bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-[15px] text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] resize-none h-[56px]"
                  rows={1}
                />
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !query.trim()}
                className="px-6 py-0 bg-[#1D6FA3] text-white rounded-xl hover:bg-[#0B3C5D] disabled:opacity-50 transition-all flex items-center justify-center gap-2 font-medium h-[56px] shrink-0 active:scale-[0.98]"
              >
                <Send className="h-5 w-5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>

        </div>
        {/* ── END MAIN CHAT PANEL ── */}

      </div>
    </div>
  );
}