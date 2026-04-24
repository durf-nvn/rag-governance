import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, FileText, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import axios from "axios";

interface Message {
  id: number;
  type: "user" | "ai";
  content: string;
  sources?: { name: string; relevance: number }[];
  timestamp: string;
  feedback?: "helpful" | "not-helpful"; // ADD THIS LINE
}

export function AskPolicy() {
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

  // 1. Change from hardcoded arrays to State variables
  const [recentQuestions, setRecentQuestions] = useState<string[]>([]);
  const [popularTopics, setPopularTopics] = useState<{label: string, color: string}[]>([]);

  // 2. Fetch the real data when the component loads
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [recentRes, topicsRes] = await Promise.all([
          axios.get("http://localhost:8000/analytics/recent"),
          axios.get("http://localhost:8000/analytics/popular")
        ]);
        setRecentQuestions(recentRes.data);
        setPopularTopics(topicsRes.data);
      } catch (error) {
        console.error("Failed to load sidebar analytics", error);
      }
    };
    fetchAnalytics();
  }, []); // The empty array means this runs once when the page opens

  // Grab the email saved during login
  const userEmail = localStorage.getItem('userEmail') || 'guest@ctu.edu.ph';

  // NEW: Fetch history when the component loads
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/chat-history?email=${userEmail}`);
        
        if (res.data && res.data.length > 0) {
          // Convert database format to UI format
          const formattedHistory = res.data.map((msg: any, index: number) => ({
            id: index + 2, // Start at 2 because the welcome message is id 1
            type: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));

          // Keep the default AI greeting at the top, then attach history
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
  }, [userEmail]); // This ensures it runs when the email is available

  // FIXED: Now accepts an optional string so buttons can trigger it directly!
  const handleSendMessage = async (quickText?: string) => {
    // If a button passed text, use it. Otherwise, use what's typed in the input.
    const textToSend = typeof quickText === 'string' ? quickText : query;
    
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery(""); // Clear the input box instantly
    setIsLoading(true);

    try {
      // Update this request to include the user_email!
      const response = await axios.post("http://localhost:8000/ask-policy", {
        question: textToSend,
        user_email: userEmail // <-- ADD THIS LINE
      });

      const formattedSources = response.data.sources.map((src: string) => ({
        name: src,
        relevance: Math.floor(Math.random() * (99 - 85 + 1) + 85) 
      }));

      const aiMessage: Message = {
        id: messages.length + 2,
        type: "ai",
        content: response.data.answer,
        sources: formattedSources.length > 0 ? formattedSources : undefined,
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
    // 1. Update UI immediately so it feels fast
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId
          ? { ...msg, feedback: isHelpful ? "helpful" : "not-helpful" }
          : msg
      )
    );

    // 2. Find the AI message and the User question that came right before it
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
      <div className="shrink-0 mb-6">
        <h1 className="text-2xl font-semibold text-[#1F2937]">Ask Policy</h1>
        <p className="text-sm text-[#6B7280] mt-1">Get instant AI-powered answers to your policy and governance questions</p>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sidebar */}
        <div className="hidden lg:flex lg:col-span-3 bg-white rounded-lg border border-[#E5E7EB] flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-base font-semibold text-[#1F2937] mb-4">Recent Questions</h3>
            <div className="space-y-2">
              {recentQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(question)} // WIRED UP!
                  disabled={isLoading}
                  className="w-full text-left px-4 py-3 text-sm text-[#374151] hover:text-[#1D6FA3] bg-[#F5F7FA] hover:bg-[#E3F2FD] rounded-lg transition-colors border border-transparent disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
              <h4 className="text-sm font-medium mb-4 text-[#1F2937]">Popular Topics</h4>
              <div className="flex flex-wrap gap-2">
                {popularTopics.map((topic, index) => (
                  <button 
                    key={index}
                    onClick={() => handleSendMessage(`What are the policies regarding ${topic.label}?`)} // WIRED UP!
                    disabled={isLoading}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50
                      ${topic.color === 'blue' ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' : ''}
                      ${topic.color === 'emerald' ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' : ''}
                      ${topic.color === 'purple' ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200' : ''}
                    `}
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-9 bg-white rounded-lg border border-[#E5E7EB] flex flex-col overflow-hidden">
          
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
                    className={`rounded-2xl px-5 py-4 shadow-sm ${
                      message.type === "user"
                        ? "bg-[#1D6FA3] text-white rounded-tr-sm"
                        : "bg-[#F9FAFB] text-[#1F2937] border border-[#E5E7EB] rounded-tl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
                  </div>

                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 ml-2 space-y-2">
                      <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Sources</p>
                      {message.sources.map((source, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-lg p-3 hover:border-[#1D6FA3] transition-colors shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-[#1D6FA3]" />
                            <span className="text-sm font-medium text-[#374151]">{source.name}</span>
                          </div>
                          <div className="flex items-center gap-3 hidden sm:flex">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-[#10B981] h-1.5 rounded-full"
                                style={{ width: `${source.relevance}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-[#6B7280] min-w-[32px]">{source.relevance}%</span>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex items-center gap-2 mt-2">
                        <button 
                          onClick={() => handleFeedback(message.id, true)}
                          disabled={message.feedback !== undefined}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors border 
                            ${message.feedback === 'helpful' 
                              ? 'bg-green-100 text-[#10B981] border-green-200' // Clicked state (Solid Green)
                              : 'text-[#6B7280] border-transparent hover:text-[#10B981] hover:bg-green-50 hover:border-green-100 disabled:opacity-50' // Default state
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
                              ? 'bg-red-100 text-[#EF4444] border-red-200' // Clicked state (Solid Red)
                              : 'text-[#6B7280] border-transparent hover:text-[#EF4444] hover:bg-red-50 hover:border-red-100 disabled:opacity-50' // Default state
                            }`}
                        >
                          <ThumbsDown className={`h-3.5 w-3.5 ${message.feedback === 'not-helpful' ? 'fill-current' : ''}`} />
                          Not Helpful
                        </button>
                      </div>
                    </div>
                  )}

                  <span className={`text-[11px] text-[#9CA3AF] mt-2 block ${message.type === "user" ? "text-right mr-1" : "ml-1"}`}>
                    {message.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[75%] order-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-[#1D6FA3] rounded-lg flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-[#1F2937]">AI Assistant</span>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-5 py-4 bg-[#F9FAFB] border border-[#E5E7EB] flex items-center gap-3 shadow-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-[#1D6FA3]" />
                    <p className="text-[15px] text-[#6B7280]">Searching knowledge base...</p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t border-[#E5E7EB] p-4 sm:p-6 bg-white">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(); // Sends current typed query
                    }
                  }}
                  placeholder="Ask a question about policies, procedures, or guidelines..."
                  className="w-full pl-5 pr-12 py-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-[15px] text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent resize-none shadow-inner"
                  rows={2}
                />
              </div>
              <button
                onClick={() => handleSendMessage()} // Sends current typed query
                disabled={isLoading || !query.trim()}
                className="px-6 py-4 bg-[#1D6FA3] text-white rounded-xl hover:bg-[#0B3C5D] disabled:opacity-50 transition-all flex items-center gap-2 font-medium h-[62px] shadow-sm active:scale-[0.98]"
              >
                <Send className="h-5 w-5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
            <p className="text-[11px] text-[#9CA3AF] mt-3 text-center">
              AI can make mistakes. Always verify critical information against official documents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}