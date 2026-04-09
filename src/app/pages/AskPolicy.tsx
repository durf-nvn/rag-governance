import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, FileText, ThumbsUp, ThumbsDown } from "lucide-react";

interface Message {
  id: number;
  type: "user" | "ai";
  content: string;
  sources?: { name: string; relevance: number }[];
  timestamp: string;
}

export function AskPolicy() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "ai",
      content: "Hello! I'm your AI Policy Assistant. Ask me anything about institutional policies, procedures, and guidelines. I'll provide accurate answers with source citations.",
      timestamp: "Just now"
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const recentQuestions = [
    "What is the grading system for undergraduate programs?",
    "How do I apply for research grants?",
    "What are the requirements for faculty promotion?",
    "What is the policy on student absences?",
    "How to file a grievance?",
  ];

  const handleSendMessage = () => {
    if (!query.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: query,
      timestamp: "Just now"
    };

    const aiMessage: Message = {
      id: messages.length + 2,
      type: "ai",
      content: `Based on the institutional policies, here's what I found: The grading system follows a weighted average computation where Class Standing (CS) accounts for 60% and Final Examination (FE) accounts for 40% of the final grade. The formula is: Final Grade = (CS × 0.6) + (FE × 0.4). Students must achieve a minimum passing grade of 75% (3.0) to pass a course.`,
      sources: [
        { name: "Student Handbook 2026 - Section 5.2", relevance: 95 },
        { name: "Academic Policies Manual - Chapter 3", relevance: 88 },
        { name: "Grading System Procedure v1.5", relevance: 92 }
      ],
      timestamp: "Just now"
    };

    setMessages([...messages, userMessage, aiMessage]);
    setQuery("");
  };

  const handleQuickQuestion = (question: string) => {
    setQuery(question);
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1F2937]">Ask Policy</h1>
        <p className="text-sm text-[#6B7280] mt-1">Get instant AI-powered answers to your policy and governance questions</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Recent Questions Sidebar */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 h-full overflow-y-auto">
            <h3 className="text-base font-semibold text-[#1F2937] mb-4">Recent Questions</h3>
            <div className="space-y-3">
              {recentQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="w-full text-left px-4 py-3 text-sm text-[#1F2937] hover:bg-[#F5F7FA] rounded-lg transition-colors border border-transparent hover:border-[#E5E7EB]"
                >
                  {question}
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
              <h4 className="text-sm font-medium mb-3 text-[#1F2937]">Popular Topics</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">Grading</span>
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">Research</span>
                <span className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-200">Admissions</span>
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">Faculty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface - Larger and More Prominent */}
        <div className="lg:col-span-9">
          <div className="bg-white rounded-lg border border-[#E5E7EB] flex flex-col h-full">
            {/* Chat Messages - Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-4xl ${message.type === "user" ? "order-2" : "order-1"}`}>
                    {message.type === "ai" && (
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-[#1D6FA3] rounded-lg flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-[#1F2937]">AI Assistant</span>
                      </div>
                    )}
                    
                    <div
                      className={`rounded-lg px-5 py-4 ${
                        message.type === "user"
                          ? "bg-[#1D6FA3] text-white"
                          : "bg-[#F5F7FA] text-[#1F2937] border border-[#E5E7EB]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</p>
                    </div>

                    {message.sources && (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm font-medium text-[#1F2937]">Sources:</p>
                        {message.sources.map((source, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-lg p-4 hover:border-[#1D6FA3] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-[#1D6FA3]" />
                              <span className="text-sm font-medium text-[#1F2937]">{source.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-[#10B981] h-2 rounded-full"
                                  style={{ width: `${source.relevance}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-[#6B7280] min-w-[40px]">{source.relevance}%</span>
                            </div>
                          </div>
                        ))}
                        
                        <div className="flex items-center gap-3 mt-3">
                          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#10B981] hover:bg-green-50 rounded-lg transition-colors border border-[#E5E7EB]">
                            <ThumbsUp className="h-4 w-4" />
                            Helpful
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors border border-[#E5E7EB]">
                            <ThumbsDown className="h-4 w-4" />
                            Not Helpful
                          </button>
                        </div>
                      </div>
                    )}

                    <span className="text-xs text-[#6B7280] mt-3 block">{message.timestamp}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed at Bottom */}
            <div className="border-t border-[#E5E7EB] p-6 bg-white">
              <div className="flex gap-3 items-end">
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
                    placeholder="Ask a question about policies, procedures, or guidelines..."
                    className="w-full px-5 py-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-base text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  className="px-6 py-4 bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] transition-colors flex items-center gap-2 font-medium h-[72px]"
                >
                  <Send className="h-5 w-5" />
                  Send
                </button>
              </div>
              <p className="text-xs text-[#6B7280] mt-3">
                AI responses are generated based on institutional documents. Always verify critical information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
