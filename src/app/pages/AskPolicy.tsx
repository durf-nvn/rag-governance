import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { Send, Sparkles, FileText, ThumbsUp, ThumbsDown, ChevronDown, Loader2, RotateCcw, AlertTriangle, Lock } from "lucide-react";
import axios, { type CancelTokenSource } from "axios";
import { useRole } from "../contexts/RoleContext";

// Centralize the API origin instead of hardcoding localhost in every call —
// this alone was going to break the first time anyone deployed the frontend.
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const MAX_QUESTION_LENGTH = 1000;

interface Source {
  name: string;
  relevance: number;
  snippet?: string;
}

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  sources?: Source[];
  timestamp: string;
  feedback?: "helpful" | "not-helpful";
  followUps?: string[];
  isError?: boolean;
  isRestricted?: boolean;
  failedQuestion?: string; // lets the "Retry" action resend the exact text that failed
}

const nowLabel = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// Simple, collision-safe id generator. `messages.length + 1` in the original
// breaks the moment messages are ever removed/reordered, and gets worse once
// two responses can be in flight (double-send). A counter tied to a ref is cheap
// and stable across renders.
let idCounter = 0;
const nextId = () => `msg_${Date.now()}_${idCounter++}`;

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  type: "ai",
  content:
    "Hello! I'm your friendly AI Policy Assistant. Ask me anything about institutional policies, procedures, and guidelines. I'll provide accurate answers with source citations.",
  timestamp: nowLabel(),
};

export function AskPolicy() {
  const { userRole } = useRole();
  const currentRole = userRole || "STUDENT";

  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cancelSourceRef = useRef<CancelTokenSource | null>(null);
  const isNearBottomRef = useRef(true);

  // sessionStorage can legitimately be empty/absent — treat that as "not signed in"
  // rather than silently emailing a fake guest address to the backend.
  const userEmail = sessionStorage.getItem("userEmail");

  // ── Smart autoscroll ──────────────────────────────────────────────
  // Only force-scroll to the bottom if the user was already near the bottom.
  // Otherwise, someone scrolling up to reread an earlier answer gets yanked
  // back down every time a new message streams in — a common chat-UI complaint.
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 120;
  };

  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // ── Load history ──────────────────────────────────────────────────
  useEffect(() => {
    if (!userEmail) {
      setHistoryLoaded(true);
      return;
    }

    let cancelled = false;

    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE}/chat-history`, {
          params: { email: userEmail },
        });

        if (cancelled) return;

        if (res.data && res.data.length > 0) {
          const formattedHistory: Message[] = res.data.map((msg: any) => ({
            id: msg.id ? `hist_${msg.id}` : nextId(),
            type: msg.role === "ai" ? "ai" : "user",
            content: msg.content ?? "",
            timestamp: msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : nowLabel(),
          }));

          setMessages([WELCOME_MESSAGE, ...formattedHistory]);
        }
      } catch (error) {
        console.error("Failed to load chat history", error);
        // Non-fatal — the assistant still works without prior history,
        // so we don't block the UI or show a scary error for this.
      } finally {
        if (!cancelled) setHistoryLoaded(true);
      }
    };

    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [userEmail]);

  // ── Send ──────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(
    async (quickText?: string) => {
      const textToSend = (typeof quickText === "string" ? quickText : query).trim();
      if (!textToSend || isLoading) return;

      if (textToSend.length > MAX_QUESTION_LENGTH) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            type: "ai",
            content: `That question is a bit long (${textToSend.length} characters). Please shorten it to under ${MAX_QUESTION_LENGTH} characters and try again.`,
            timestamp: nowLabel(),
            isError: true,
          },
        ]);
        return;
      }

      const userMessage: Message = {
        id: nextId(),
        type: "user",
        content: textToSend,
        timestamp: nowLabel(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setQuery("");
      setIsLoading(true);
      isNearBottomRef.current = true;

      // Cancel any previous in-flight request so a slow first answer can't
      // land after a faster second one and clobber the conversation order.
      cancelSourceRef.current?.cancel("New request superseded the previous one");
      const source = axios.CancelToken.source();
      cancelSourceRef.current = source;

      try {
        const response = await axios.post(
          `${API_BASE}/ask-policy`,
          {
            question: textToSend,
            user_email: userEmail || "guest@ctu.edu.ph",
            user_role: currentRole,
          },
          { cancelToken: source.token, timeout: 30000 }
        );

        const formattedSources: Source[] = (response.data?.sources || []).map(
          (src: any) => ({
            name: src.name,
            snippet: src.snippet,
            relevance: src.relevance,
          })
        );

        const aiMessage: Message = {
          id: nextId(),
          type: "ai",
          content: response.data?.answer ?? "I didn't get a usable response — please try again.",
          sources: formattedSources.length > 0 ? formattedSources : undefined,
          followUps: response.data?.follow_ups,
          isRestricted: response.data?.restricted || false,
          timestamp: nowLabel(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        if (axios.isCancel(error)) return; // superseded — don't show an error for this

        const isTimeout = axios.isAxiosError(error) && error.code === "ECONNABORTED";
        const errorMessage: Message = {
          id: nextId(),
          type: "ai",
          content: isTimeout
            ? "That request took too long to answer. Please try again."
            : "Sorry, I had trouble connecting to the AI service. Please check your connection and try again.",
          timestamp: nowLabel(),
          isError: true,
          failedQuestion: textToSend,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        // Return focus to the input so keyboard users can immediately ask a follow-up.
        textareaRef.current?.focus();
      }
    },
    [query, isLoading, userEmail, currentRole]
  );

  const handleRetry = (failedQuestion?: string) => {
    if (failedQuestion) handleSendMessage(failedQuestion);
  };

  // ── Feedback ──────────────────────────────────────────────────────
  const handleFeedback = async (messageId: string, isHelpful: boolean) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    const aiMessage = messages[messageIndex];
    if (aiMessage.feedback) return; // already recorded — guards double-submits

    // Walk backwards for the nearest preceding user message instead of assuming
    // it's always exactly one index back (a follow-up chip or an error message
    // in between breaks that assumption).
    const userMessage = [...messages.slice(0, messageIndex)]
      .reverse()
      .find((m) => m.type === "user");
    if (!userMessage) return;

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, feedback: isHelpful ? "helpful" : "not-helpful" }
          : msg
      )
    );

    try {
      await axios.post(`${API_BASE}/feedback`, {
        question: userMessage.content,
        answer: aiMessage.content,
        is_helpful: isHelpful,
      });
    } catch (error) {
      console.error("Failed to submit feedback", error);
      // Revert on failure so the UI doesn't lie about what was actually recorded.
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, feedback: undefined } : msg))
      );
    }
  };

  // ── Input handling ───────────────────────────────────────────────
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // `nativeEvent.isComposing` guards against sending mid-keystroke while
    // composing IME input (Chinese/Japanese/Korean) — onKeyPress in the
    // original would fire Send on the Enter that confirms a character.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
    if (e.key === "Escape") {
      setQuery("");
    }
  };

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const charCount = query.length;
  const isOverLimit = charCount > MAX_QUESTION_LENGTH;

  return (
    <div className="h-full flex flex-col min-h-0 bg-white overflow-hidden">
      {/* Messages Feed Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-label="Conversation with AI Policy Assistant"
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar"
      >
        {!historyLoaded && (
          <div className="flex justify-center py-6" aria-hidden="true">
            <Loader2 className="h-4 w-4 animate-spin text-[#FF9501]" />
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-[90%] flex flex-col items-start">
              {message.type === "ai" && (
                <div className="flex items-center gap-2 mb-1.5 flex-shrink-0">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center ${
                      message.isError
                        ? "bg-[#EF4444]"
                        : message.isRestricted
                        ? "bg-[#D97E00]"
                        : "bg-[#FF9501]"
                    }`}
                  >
                    {message.isError ? (
                      <AlertTriangle className="h-3 w-3 text-white" />
                    ) : message.isRestricted ? (
                      <Lock className="h-3 w-3 text-white" />
                    ) : (
                      <Sparkles className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-[#1F2937]">
                    {message.isError
                      ? "Connection Issue"
                      : message.isRestricted
                      ? "Access Restricted"
                      : "AI Assistant"}
                  </span>
                </div>
              )}

              <div
                className={`rounded-2xl px-4 py-2.5 text-sm ${
                  message.type === "user"
                    ? "bg-[#FF9501] text-white rounded-tr-sm shadow-sm self-end"
                    : message.isError
                    ? "bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5] rounded-tl-sm shadow-sm"
                    : message.isRestricted
                    ? "bg-[#FFF4E5] text-[#995900] border border-[#FF9501]/30 rounded-tl-sm shadow-sm"
                    : "bg-[#F9FAFB] text-[#1F2937] border border-[#E5E7EB] rounded-tl-sm shadow-sm"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed break-words">
                  {message.content}
                </p>
              </div>

              {message.isError && message.failedQuestion && (
                <button
                  onClick={() => handleRetry(message.failedQuestion)}
                  disabled={isLoading}
                  className="mt-2 flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-[#D97706] border border-[#FCD34D] bg-[#FFFBEB] hover:bg-[#FEF3C7] rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" /> Retry
                </button>
              )}

              {/* Sources & Citations */}
              {message.type === "ai" && message.sources && message.sources.length > 0 && (
                <div className="mt-3 w-full space-y-2 pl-1">
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">
                    Sources & Citations
                  </p>
                  {message.sources.map((source) => (
                    <details
                      key={`${message.id}_${source.name}`}
                      className="group bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm"
                    >
                      <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#FFF4E5] transition-colors list-none">
                        <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                          <FileText className="h-4 w-4 text-[#FF9501] flex-shrink-0" />
                          <span
                            className="text-xs font-semibold text-[#374151] truncate max-w-[180px] sm:max-w-[240px]"
                            title={source.name}
                          >
                            {source.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 bg-gray-200 rounded-full h-1 overflow-hidden hidden xs:block">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  source.relevance >= 80
                                    ? "bg-[#10B981]"
                                    : source.relevance >= 60
                                    ? "bg-[#FF9501]"
                                    : "bg-[#EF4444]"
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, source.relevance))}%` }}
                              />
                            </div>
                            <span
                              className={`text-[10px] font-bold min-w-[28px] text-right ${
                                source.relevance >= 80
                                  ? "text-[#10B981]"
                                  : source.relevance >= 60
                                  ? "text-[#D97E00]"
                                  : "text-[#EF4444]"
                              }`}
                            >
                              {source.relevance}%
                            </span>
                          </div>
                          <ChevronDown className="h-3.5 w-3.5 text-[#6B7280] group-open:rotate-180 transition-transform duration-200 flex-shrink-0" />
                        </div>
                      </summary>
                      {source.snippet && (
                        <div className="p-3 bg-[#F9FAFB] border-t border-[#E5E7EB] text-xs text-[#4B5563] leading-relaxed italic">
                          "{source.snippet}"
                        </div>
                      )}
                    </details>
                  ))}

                  <div className="flex items-center gap-2 mt-1" role="group" aria-label="Was this answer helpful?">
                    <button
                      onClick={() => handleFeedback(message.id, true)}
                      disabled={message.feedback !== undefined}
                      aria-pressed={message.feedback === "helpful"}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-md border transition-colors cursor-pointer disabled:cursor-default
                        ${
                          message.feedback === "helpful"
                            ? "bg-green-100 text-[#10B981] border-green-200"
                            : "text-[#6B7280] border-transparent hover:text-[#10B981] hover:bg-green-50"
                        }`}
                    >
                      <ThumbsUp className="h-3 w-3" /> Helpful
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, false)}
                      disabled={message.feedback !== undefined}
                      aria-pressed={message.feedback === "not-helpful"}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-md border transition-colors cursor-pointer disabled:cursor-default
                        ${
                          message.feedback === "not-helpful"
                            ? "bg-red-100 text-[#EF4444] border-red-200"
                            : "text-[#6B7280] border-transparent hover:text-[#EF4444] hover:bg-red-50"
                        }`}
                    >
                      <ThumbsDown className="h-3 w-3" /> Not helpful
                    </button>
                  </div>
                </div>
              )}

              {/* Follow-up chips */}
              {message.type === "ai" && message.followUps && message.followUps.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 items-start w-full">
                  {message.followUps.map((fq, idx) => (
                    <button
                      key={`${message.id}_fu_${idx}`}
                      onClick={() => handleSendMessage(fq)}
                      disabled={isLoading}
                      className="px-2.5 py-1 bg-white border border-[#E5E7EB] hover:border-[#FF9501] text-[#D97E00] hover:bg-[#FFF4E5] text-[11px] font-base rounded-full transition-all shadow-sm cursor-pointer text-left disabled:opacity-50"
                    >
                      {fq.endsWith("?") ? fq : `${fq}?`}
                    </button>
                  ))}
                </div>
              )}

              <span
                className={`text-[10px] text-[#9CA3AF] mt-1 block font-medium ${
                  message.type === "user" ? "self-end mr-1" : "ml-1"
                }`}
              >
                {message.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-in fade-in" aria-hidden="true">
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

      {/* Input Panel */}
      <div className="shrink-0 border-t border-[#E5E7EB] p-3 bg-white">
        <div className="flex gap-2 items-end">
          <div className="flex-1 flex flex-col">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                autoGrow(e.target);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask a policy question..."
              disabled={isLoading}
              aria-label="Ask a policy question"
              aria-invalid={isOverLimit}
              maxLength={MAX_QUESTION_LENGTH + 50}
              className={`w-full px-3 py-2 bg-[#F5F7FA] border rounded-xl text-sm text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:bg-white transition-all resize-none min-h-[38px] max-h-[120px] disabled:opacity-60 disabled:cursor-not-allowed ${
                isOverLimit
                  ? "border-[#EF4444] focus:ring-[#EF4444]"
                  : "border-[#E5E7EB] focus:ring-[#FF9501]"
              }`}
              rows={1}
            />
            {charCount > MAX_QUESTION_LENGTH * 0.8 && (
              <span
                className={`text-[10px] mt-1 ml-1 ${
                  isOverLimit ? "text-[#EF4444] font-semibold" : "text-[#9CA3AF]"
                }`}
              >
                {charCount}/{MAX_QUESTION_LENGTH}
              </span>
            )}
          </div>
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !query.trim() || isOverLimit}
            aria-label="Send question"
            className="p-2 bg-[#FF9501] text-white rounded-xl hover:bg-[#D97E00] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center h-[38px] w-[38px] shrink-0 active:scale-95 shadow-md cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}