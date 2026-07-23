// src/components/NotificationSidebar.tsx
// ----------------------------------------------------------------
// Receives all data/actions as props from DashboardLayout.
// Updated UI/UX to match the overall CTU Argao KMS design system.
// ----------------------------------------------------------------

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  X, Check, Trash2, CheckCircle2, AlertTriangle,
  Info, Bell, Loader2, RefreshCw, ExternalLink, Sparkles, CheckCheck
} from "lucide-react";
import {
  timeAgo,
  type FilterType,
  type Notification,
  type UseNotificationsReturn,
} from "../utils/useNotifications";

// ─── Props ───────────────────────────────────────────────────────
interface NotificationSidebarProps extends UseNotificationsReturn {
  isOpen:   boolean;
  onClose:  () => void;
}

// ─── Detect special navigation routes from title ──────────────────
function getNotificationRoute(notif: Notification): string | null {
  const titleLower = notif.title.toLowerCase();
  if (titleLower.includes("faculty awaiting verification")) return "/app/users-roles";
  if (titleLower.includes("paper trail") || titleLower.includes("document received")) return "/app/paper-trail";
  if (titleLower.includes("document") || titleLower.includes("repository")) return "/app/knowledge-repository";
  if (titleLower.includes("broadcast") || titleLower.includes("announcement")) return "/app/broadcast-announcement";
  return null;
}

// ─── Icon per type ───────────────────────────────────────────────
function NotifIcon({ type, read }: { type: string; read: boolean }) {
  const base = "h-4 w-4 transition-colors";
  const dim  = read ? "opacity-50" : "";
  switch (type) {
    case "success": return <CheckCircle2 className={`${base} ${dim} text-emerald-500`} />;
    case "warning": return <AlertTriangle className={`${base} ${dim} text-amber-500`}  />;
    case "error":   return <AlertTriangle className={`${base} ${dim} text-rose-500`}  />;
    default:        return <Info         className={`${base} ${dim} text-[#FF9501]`}  />;
  }
}

// ─── Type colour tokens ──────────────────────────────────────────
const TYPE_COLORS: Record<string, { bar: string; dot: string; badge: string }> = {
  success: { bar: "bg-emerald-500", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200/60" },
  warning: { bar: "bg-amber-500",   dot: "bg-amber-500",   badge: "bg-amber-50  text-amber-700 border-amber-200/60"   },
  error:   { bar: "bg-rose-500",    dot: "bg-rose-500",    badge: "bg-rose-50   text-rose-700 border-rose-200/60"      },
  info:    { bar: "bg-[#FF9501]",   dot: "bg-[#FF9501]",   badge: "bg-orange-50 text-[#D97E00] border-[#FF9501]/30" },
};

const typeLabel: Record<string, string> = {
  success: "Success", warning: "Warning", error: "Alert", info: "Info",
};

// ─── Filter pill ─────────────────────────────────────────────────
function Pill({
  label, active, count, onClick,
}: { label: string; active: boolean; count?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-4 py-1.5 rounded-full text-xs font-semibold
        transition-all duration-200 select-none cursor-pointer flex items-center gap-1.5
        ${active
          ? "bg-white text-[#D97E00] shadow-sm font-bold"
          : "bg-white/15 text-white/80 hover:bg-white/25 hover:text-white"}
      `}
    >
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`
          inline-flex items-center justify-center
          min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold
          ${active ? "bg-[#FF9501] text-white" : "bg-white/25 text-white"}
        `}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Single notification row ─────────────────────────────────────
function NotifRow({
  notif,
  onRead,
  onNavigate,
}: {
  notif:       Notification;
  onRead:      (id: number) => void;
  onNavigate:  (path: string) => void;
}) {
  const colors = TYPE_COLORS[notif.type] || TYPE_COLORS.info;
  const targetRoute = getNotificationRoute(notif);

  function handleClick() {
    // Mark as read first (optimistic)
    if (!notif.is_read) onRead(notif.id);

    // Navigate if a specific route exists
    if (targetRoute) {
      onNavigate(targetRoute);
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`
        group relative flex gap-3.5 px-4 py-3.5
        border-b border-[#E5E7EB]/60
        cursor-pointer select-none
        transition-all duration-200
        ${notif.is_read
          ? "bg-white hover:bg-[#F9FAFB]"
          : "bg-[#FFF4E5]/40 hover:bg-[#FFF4E5]/80"}
      `}
    >
      {/* Left colour accent bar */}
      <div className={`
        absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full
        transition-all duration-200
        ${notif.is_read ? "bg-gray-200 opacity-60" : colors.bar}
      `} />

      {/* Icon bubble */}
      <div className={`
        flex-shrink-0 mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center
        transition-all duration-200
        ${notif.is_read
          ? "bg-gray-100/80 text-gray-400 group-hover:bg-gray-200/80"
          : "bg-white shadow-sm border border-[#E5E7EB] group-hover:shadow-md group-hover:scale-105"}
      `}>
        <NotifIcon type={notif.type} read={notif.is_read} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Type badge + unread pulse dot */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`
            text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border
            ${notif.is_read ? "bg-gray-100 text-gray-400 border-gray-200/60" : colors.badge}
          `}>
            {typeLabel[notif.type] || notif.type}
          </span>
          {!notif.is_read && (
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`} />
          )}
        </div>

        {/* Title */}
        <p className={`
          text-xs leading-snug
          ${notif.is_read ? "text-[#4B5563] font-normal" : "text-[#1F2937] font-semibold"}
        `}>
          {notif.title}
        </p>

        {/* Message */}
        <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed line-clamp-2">
          {notif.message}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <time className="text-[11px] text-[#9CA3AF] font-medium">
            {timeAgo(notif.created_at)}
          </time>

          {/* Action hint */}
          {targetRoute ? (
            <span className="
              flex items-center gap-1
              text-[11px] font-semibold text-[#D97E00]
              opacity-0 group-hover:opacity-100 transition-opacity duration-150
            ">
              <ExternalLink className="h-3 w-3" />
              View Details
            </span>
          ) : !notif.is_read ? (
            <span className="
              text-[10px] font-medium text-[#FF9501]
              opacity-0 group-hover:opacity-100 transition-opacity duration-150
            ">
              tap to mark read
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────
export function NotificationSidebar({
  isOpen, onClose,
  notifications, unreadCount, filter, isLoading, error,
  setFilter, refresh, markAllRead, markOneRead, deleteAllRead,
}: NotificationSidebarProps) {
  const navigate  = useNavigate();
  const panelRef  = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const readCount = notifications.filter((n: Notification) => n.is_read).length;
  const totalAll  = notifications.length;

  // Navigate + close panel
  function handleNavigate(path: string) {
    onClose();
    navigate(path);
  }

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden
      />

      {/* ── Panel ── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Notifications panel"
        className="fixed right-0 top-0 bottom-0 w-[400px] max-w-[90vw] z-50 flex flex-col bg-white shadow-2xl border-l border-[#E5E7EB]"
        style={{ animation: "notifSlideIn 240ms cubic-bezier(0.22,1,0.36,1) both" }}
      >

        {/* ══ Header (CTU Warm Amber Brand Gradient) ════════════════════ */}
        <div className="flex-shrink-0 bg-gradient-to-br from-[#FF9501] to-[#D97E00] px-5 pt-5 pb-4 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Bell with indicator */}
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-sm">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <span className="w-2.5 h-2.5 bg-[#CE0000] rounded-full animate-ping absolute" />
                    <span className="w-2   h-2   bg-[#CE0000] rounded-full relative" />
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-base font-bold text-white leading-none tracking-tight">
                  Notifications
                </h2>
                <p className="text-xs text-white/80 mt-1 font-medium">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                    : "You're all caught up ✨"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={refresh}
                disabled={isLoading}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer text-white/80 hover:text-white"
                title="Refresh Notifications"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer text-white/80 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2">
            <Pill
              label="All"
              active={filter === "all"}
              onClick={() => setFilter("all" as FilterType)}
            />
            <Pill
              label="Unread"
              active={filter === "unread"}
              count={unreadCount}
              onClick={() => setFilter("unread" as FilterType)}
            />
          </div>
        </div>

        {/* ══ Action bar ══════════════════════════════════════════ */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-[#E5E7EB] bg-[#F9FAFB]">
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                text-xs font-semibold
                border border-[#FF9501]/30 bg-white text-[#D97E00]
                hover:bg-[#FF9501] hover:text-white hover:border-[#FF9501] hover:shadow-sm
                disabled:opacity-40 disabled:cursor-not-allowed
                disabled:hover:bg-white disabled:hover:text-[#D97E00] disabled:hover:shadow-none
                transition-all duration-150 cursor-pointer
              "
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>

            <button
              onClick={deleteAllRead}
              disabled={readCount === 0}
              className="
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                text-xs font-semibold
                border border-[#E5E7EB] bg-white text-[#6B7280]
                hover:bg-red-50 hover:text-red-600 hover:border-red-200 hover:shadow-sm
                disabled:opacity-40 disabled:cursor-not-allowed
                disabled:hover:bg-white disabled:hover:text-[#6B7280] disabled:hover:shadow-none
                transition-all duration-150 cursor-pointer
              "
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear read
            </button>
          </div>

          {isLoading && (
            <Loader2 className="h-4 w-4 text-[#FF9501] animate-spin" />
          )}
        </div>

        {/* ══ List ════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">

          {/* Error */}
          {error && (
            <div className="m-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-center">
              <p className="text-xs font-semibold text-red-700">{error}</p>
              <button
                onClick={refresh}
                className="mt-1 text-xs text-red-600 underline font-medium hover:text-red-800"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#FFF4E5] border border-[#FF9501]/20 flex items-center justify-center mb-3 shadow-sm">
                <Bell className="h-7 w-7 text-[#FF9501]" />
              </div>
              <p className="text-sm font-bold text-[#1F2937]">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed max-w-xs">
                {filter === "unread"
                  ? 'Switch to "All" to view your notification history.'
                  : "We'll alert you here when important updates occur."}
              </p>
            </div>
          )}

          {/* Skeleton */}
          {isLoading && notifications.length === 0 && (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded-md w-1/3" />
                    <div className="h-2.5 bg-gray-100 rounded-md w-4/5" />
                    <div className="h-2 bg-gray-100 rounded-md w-2/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rows */}
          {notifications.map((notif: Notification) => (
            <NotifRow
              key={notif.id}
              notif={notif}
              onRead={markOneRead}
              onNavigate={handleNavigate}
            />
          ))}
        </div>

        {/* ══ Footer ══════════════════════════════════════════════ */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-[#E5E7EB] bg-[#F9FAFB]">
          <p className="text-center text-[11px] text-[#6B7280] font-medium">
            {totalAll} notification{totalAll !== 1 ? "s" : ""}
            {filter === "unread" ? " · unread only" : ""}
            {" · "}
            <button
              onClick={refresh}
              className="text-[#D97E00] font-semibold hover:underline transition-colors cursor-pointer"
            >
              refresh
            </button>
          </p>
        </div>
      </div>

      {/* ── Slide-in animation ── */}
      <style>{`
        @keyframes notifSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}