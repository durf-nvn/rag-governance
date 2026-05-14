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
      try {
        const recentRes = await axios.get("http://localhost:8000/analytics/recent");
        setRecentQuestions(recentRes.data);
      } catch (error) {
        console.error("Failed to load recent questions", error);
      }

      try {
        const topicsRes = await axios.get("http://localhost:8000/analytics/popular");
        setPopularTopics(topicsRes.data);
      } catch (error) {
        console.error("Failed to load popular topics", error);
      }
    };
    
    fetchAnalytics();
  }, []);

  const userEmail = sessionStorage.getItem('userEmail') || 'guest@ctu.edu.ph';

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
      <div className="shrink-0 mb-4 px-2 lg:px-0">
        <h1 className="text-2xl font-semibold text-[#1F2937]">Ask Policy</h1>
        <p className="text-sm text-[#6B7280] mt-1">Get instant AI-powered answers to your policy and governance questions</p>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">

        {/* ── RESPONSIVE SIDEBAR ── 
            Changed 'w-72' to 'hidden lg:flex lg:w-72' so the column disappears entirely on small screens.
        */}
        <div className="hidden lg:flex lg:w-72 shrink-0 flex-col gap-4 overflow-y-auto">

          {/* Recent Questions */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
            <h3 className="text-base font-semibold text-[#1F2937] mb-4">Recent Questions</h3>
            <div className="space-y-2">
              {recentQuestions.length > 0 ? recentQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(question)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-[#374151] hover:bg-[#FFF4E5] hover:text-[#D97E00] transition-colors border border-transparent hover:border-[#FF9501]/20 cursor-pointer"
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
                const colorClass = topic.color === 'emerald' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                                 topic.color === 'purple' ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' :
                                 'bg-[#FFF4E5] text-[#D97E00] border-[#FF9501]/20 hover:bg-[#FF9501]/10';
                return (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(`What are the policies regarding ${topic.label}?`)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors cursor-pointer ${colorClass}`}
                  >
                    {topic.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── MAIN CHAT PANEL ── */}
        <div className="flex-1 flex flex-col min-h-0 bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] lg:max-w-[75%] ${message.type === "user" ? "order-2" : "order-1"}`}>

                  {message.type === "ai" && (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-[#FF9501] rounded-lg flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-[#1F2937]">AI Assistant</span>
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-3 lg:px-5 lg:py-4 ${
                      message.type === "user"
                        ? "bg-[#FF9501] text-white rounded-tr-sm shadow-sm"
                        : "bg-[#F9FAFB] text-[#1F2937] border border-[#E5E7EB] rounded-tl-sm shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm lg:text-[15px] leading-relaxed">{message.content}</p>
                  </div>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 ml-2 space-y-2">
                      <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Sources</p>
                      {message.sources.map((source, index) => (
                        <details
                          key={index}
                          className="group bg-white border border-[#E5E7EB] rounded-lg overflow-hidden mb-2 shadow-sm"
                        >
                          <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#FFF4E5] transition-colors list-none">
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-[#FF9501]" />
                              <span className="text-xs lg:text-sm font-medium text-[#374151] truncate max-w-[150px] sm:max-w-none">{source.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 hidden sm:flex">
                                <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-1.5 rounded-full transition-all duration-500 ${
                                      source.relevance >= 80 ? 'bg-[#10B981]' :
                                      source.relevance >= 60 ? 'bg-[#FF9501]' :
                                      'bg-[#EF4444]'
                                    }`}
                                    style={{ width: `${source.relevance}%` }}
                                  />
                                </div>
                                <span className={`text-[10px] font-bold min-w-[32px] ${
                                  source.relevance >= 80 ? 'text-[#10B981]' :
                                  source.relevance >= 60 ? 'text-[#D97E00]' :
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
                              : 'text-[#6B7280] border-transparent hover:text-[#10B981] hover:bg-green-50 hover:border-green-100 disabled:opacity-50 cursor-pointer'
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
                              : 'text-[#6B7280] border-transparent hover:text-[#EF4444] hover:bg-red-50 hover:border-red-100 disabled:opacity-50 cursor-pointer'
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
                    <div className="mt-4 ml-2 flex flex-wrap gap-2 items-start">
                      {message.followUps.map((fq, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(fq)}
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:border-[#FF9501] text-[#D97E00] hover:bg-[#FFF4E5] text-[11px] font-semibold rounded-full transition-all disabled:opacity-50 text-left shadow-sm hover:shadow-md cursor-pointer"
                        >
                          {fq.endsWith('?') ? fq : `${fq}?`}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className={`text-[10px] text-[#9CA3AF] mt-2 block font-medium ${message.type === "user" ? "text-right mr-1" : "ml-1"}`}>
                    {message.timestamp}
                  </span>

                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in">
                <div className="max-w-[75%] order-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-[#FF9501] rounded-lg flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white animate-pulse" />
                    </div>
                    <span className="text-sm font-semibold text-[#1F2937]">AI Assistant</span>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-5 py-4 bg-[#F9FAFB] border border-[#E5E7EB] flex items-center gap-3 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-[#FF9501]" />
                    <p className="text-sm lg:text-[15px] text-[#6B7280] font-medium italic">Searching knowledge base...</p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Panel */}
          <div className="shrink-0 border-t border-[#E5E7EB] p-3 lg:p-6 bg-white">
            <div className="flex gap-2 lg:gap-3 items-center">
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
                  placeholder="Ask a policy question..."
                  className="w-full pl-4 pr-10 py-3 lg:py-[17px] lg:pl-5 lg:pr-12 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-sm lg:text-[15px] text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FF9501] focus:bg-white transition-all resize-none h-[48px] lg:h-[56px] custom-scrollbar"
                  rows={1}
                />
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !query.trim()}
                className="p-3 lg:px-6 lg:py-0 bg-[#FF9501] text-white rounded-xl hover:bg-[#D97E00] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-bold h-[48px] lg:h-[56px] shrink-0 active:scale-95 shadow-md hover:shadow-lg cursor-pointer"
              >
                <Send className="h-5 w-5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}