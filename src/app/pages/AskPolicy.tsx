import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, FileText, ThumbsUp, ThumbsDown, ChevronDown, Loader2 } from "lucide-react";
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
    <div className="h-full flex flex-col min-h-0 bg-white overflow-hidden">
      
      {/* Messages Feed Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[90%]">

              {message.type === "ai" && (
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 bg-[#FF9501] rounded-md flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-bold text-[#1F2937]">AI Assistant</span>
                </div>
              )}

              <div
                className={`rounded-2xl px-4 py-2.5 text-sm ${
                  message.type === "user"
                    ? "bg-[#FF9501] text-white rounded-tr-sm shadow-sm"
                    : "bg-[#F9FAFB] text-[#1F2937] border border-[#E5E7EB] rounded-tl-sm shadow-sm"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>

              {/* Sources Integration */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {message.sources.map((source, index) => (
                    <details
                      key={index}
                      className="group bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-sm"
                    >
                      <summary className="flex items-center justify-between p-2 cursor-pointer hover:bg-[#FFF4E5] transition-colors list-none">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-3.5 w-3.5 text-[#FF9501] flex-shrink-0" />
                          <span className="text-xs font-semibold text-[#374151] truncate max-w-[200px]">{source.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] font-bold text-[#D97E00]">{source.relevance}%</span>
                          <ChevronDown className="h-3 w-3 text-[#6B7280] group-open:rotate-180 transition-transform" />
                        </div>
                      </summary>
                      {source.snippet && (
                        <div className="p-2.5 bg-[#F9FAFB] border-t border-[#E5E7EB] text-[11px] text-[#4B5563] leading-relaxed italic">
                          "{source.snippet}"
                        </div>
                      )}
                    </details>
                  ))}

                  {/* Feedback Interaction */}
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => handleFeedback(message.id, true)}
                      disabled={message.feedback !== undefined}
                      className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md border transition-colors cursor-pointer
                        ${message.feedback === 'helpful'
                          ? 'bg-green-100 text-[#10B981] border-green-200'
                          : 'text-[#6B7280] border-transparent hover:text-[#10B981] hover:bg-green-50'
                        }`}
                    >
                      <ThumbsUp className="h-3 w-3" /> Helpful
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, false)}
                      disabled={message.feedback !== undefined}
                      className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md border transition-colors cursor-pointer
                        ${message.feedback === 'not-helpful'
                          ? 'bg-red-100 text-[#EF4444] border-red-200'
                          : 'text-[#6B7280] border-transparent hover:text-[#EF4444] hover:bg-red-50'
                        }`}
                    >
                      <ThumbsDown className="h-3 w-3" /> Revision
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic Follow-up Options */}
              {message.followUps && message.followUps.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 items-start">
                  {message.followUps.map((fq, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(fq)}
                      disabled={isLoading}
                      className="px-2.5 py-1 bg-white border border-[#E5E7EB] hover:border-[#FF9501] text-[#D97E00] hover:bg-[#FFF4E5] text-[11px] font-bold rounded-full transition-all shadow-sm cursor-pointer text-left"
                    >
                      {fq.endsWith('?') ? fq : `${fq}?`}
                    </button>
                  ))}
                </div>
              )}

              <span className={`text-[10px] text-[#9CA3AF] mt-1 block font-medium ${message.type === "user" ? "text-right mr-1" : "ml-1"}`}>
                {message.timestamp}
              </span>

            </div>
          </div>
        ))}

        {/* Dynamic Loading State Indicator */}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 bg-[#FF9501] rounded-md flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-white animate-pulse" />
                </div>
                <span className="text-xs font-bold text-[#1F2937]">AI Assistant</span>
              </div>
              <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] flex items-center gap-2 shadow-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF9501]" />
                <p className="text-xs text-[#6B7280] font-medium italic">Searching knowledge base...</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Handling Action Panel */}
      <div className="shrink-0 border-t border-[#E5E7EB] p-3 bg-white">
        <div className="flex gap-2 items-center">
          <div className="flex-1">
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
              className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-sm text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FF9501] focus:bg-white transition-all resize-none h-[38px] max-h-[38px]"
              rows={1}
            />
          </div>
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !query.trim()}
            className="p-2 bg-[#FF9501] text-white rounded-xl hover:bg-[#D97E00] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center h-[38px] w-[38px] shrink-0 active:scale-95 shadow-md cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

    </div>
  );
}