// src/components/NotificationSidebar.tsx
// ----------------------------------------------------------------
// Receives all data/actions as props from DashboardLayout.
// NEW: Clicking a "Faculty Awaiting Verification" notification
//      navigates the admin directly to /app/users-roles.
// ----------------------------------------------------------------

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  X, Check, Trash2, CheckCircle, AlertCircle,
  Info, Bell, Loader2, RefreshCw, ExternalLink,
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

// ─── Detect if a notification is a faculty verification alert ────
// Returns true if this notification should navigate to Users & Roles
function isFacultyVerificationNotif(notif: Notification): boolean {
  return notif.title.toLowerCase().includes("faculty awaiting verification");
}

// ─── Icon per type ───────────────────────────────────────────────
function NotifIcon({ type, read }: { type: string; read: boolean }) {
  const base = "h-4 w-4 transition-colors";
  const dim  = read ? "opacity-40" : "";
  switch (type) {
    case "success": return <CheckCircle className={`${base} ${dim} text-emerald-500`} />;
    case "warning": return <AlertCircle className={`${base} ${dim} text-amber-400`}  />;
    case "error":   return <AlertCircle className={`${base} ${dim} text-[#CE0000]`}  />;
    default:        return <Info        className={`${base} ${dim} text-[#1D6FA3]`}  />;
  }
}

// ─── Type colour tokens ──────────────────────────────────────────
const TYPE_COLORS: Record<string, { bar: string; dot: string; badge: string }> = {
  success: { bar: "bg-emerald-500", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700" },
  warning: { bar: "bg-amber-400",   dot: "bg-amber-400",   badge: "bg-amber-50  text-amber-700"   },
  error:   { bar: "bg-[#CE0000]",   dot: "bg-[#CE0000]",   badge: "bg-red-50   text-red-700"      },
  info:    { bar: "bg-[#1D6FA3]",   dot: "bg-[#1D6FA3]",   badge: "bg-blue-50  text-blue-700"     },
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
        transition-all duration-200 select-none
        ${active
          ? "bg-white text-[#CE0000] shadow-md"
          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"}
      `}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={`
          ml-1.5 inline-flex items-center justify-center
          min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold
          ${active ? "bg-[#CE0000] text-white" : "bg-white/20 text-white"}
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
  const colors    = TYPE_COLORS[notif.type] || TYPE_COLORS.info;
  const isFaculty = isFacultyVerificationNotif(notif);

  function handleClick() {
    // Mark as read first (optimistic)
    if (!notif.is_read) onRead(notif.id);

    // Navigate to Users & Roles if this is a faculty verification alert
    if (isFaculty) {
      onNavigate("/app/users-roles");
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`
        group relative flex gap-3 px-4 py-3.5
        border-b border-gray-100/80
        cursor-pointer select-none
        transition-all duration-150
        ${notif.is_read
          ? "bg-white hover:bg-gray-50/80"
          : "bg-gradient-to-r from-slate-50 to-white hover:from-blue-50/40 hover:to-white"}
      `}
    >
      {/* Left colour bar */}
      <div className={`
        absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full
        transition-all duration-200
        ${notif.is_read ? "bg-gray-200" : colors.bar}
      `} />

      {/* Icon bubble */}
      <div className={`
        flex-shrink-0 mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center
        transition-all duration-150
        ${notif.is_read
          ? "bg-gray-100 group-hover:bg-gray-200"
          : "bg-white shadow-sm border border-gray-200/60 group-hover:shadow-md"}
      `}>
        <NotifIcon type={notif.type} read={notif.is_read} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Type badge + unread dot */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`
            text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md
            ${notif.is_read ? "bg-gray-100 text-gray-400" : colors.badge}
          `}>
            {typeLabel[notif.type] || notif.type}
          </span>
          {!notif.is_read && (
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`} />
          )}
        </div>

        {/* Title */}
        <p className={`
          text-sm leading-snug
          ${notif.is_read ? "text-gray-500 font-normal" : "text-gray-900 font-semibold"}
        `}>
          {notif.title}
        </p>

        {/* Message */}
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
          {notif.message}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-1.5">
          <time className="text-[11px] text-gray-400 tabular-nums">
            {timeAgo(notif.created_at)}
          </time>

          {/* Action hint */}
          {isFaculty ? (
            <span className="
              flex items-center gap-1
              text-[10px] font-semibold text-[#CE0000]
              opacity-0 group-hover:opacity-100 transition-opacity duration-150
            ">
              <ExternalLink className="h-3 w-3" />
              Go to Users &amp; Roles
            </span>
          ) : !notif.is_read ? (
            <span className="
              text-[10px] font-medium text-[#1D6FA3]/70
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
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
        onClick={onClose}
        aria-hidden
      />

      {/* ── Panel ── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Notifications panel"
        className="fixed right-0 top-0 bottom-0 w-[400px] z-50 flex flex-col bg-white shadow-2xl"
        style={{ animation: "notifSlideIn 240ms cubic-bezier(0.22,1,0.36,1) both" }}
      >

        {/* ══ Header ══════════════════════════════════════════════ */}
        <div className="flex-shrink-0 bg-gradient-to-br from-[#CE0000] to-[#a80000] px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Bell with ping indicator */}
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <span className="w-2.5 h-2.5 bg-[#CE0000] rounded-full animate-ping absolute" />
                    <span className="w-2   h-2   bg-[#CE0000] rounded-full relative" />
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-base font-bold text-white leading-none tracking-tight">
                  Notifications
                </h2>
                <p className="text-xs text-white/65 mt-0.5">
                  {unreadCount > 0
                    ? `${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}`
                    : "You're all caught up ✓"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={refresh}
                disabled={isLoading}
                className="p-1.5 hover:bg-white/15 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 text-white/70 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/15 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-white" />
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
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/80">
          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              text-xs font-semibold
              border border-[#CE0000]/30 text-[#CE0000]
              hover:bg-[#CE0000] hover:text-white hover:border-[#CE0000] hover:shadow-md
              disabled:opacity-35 disabled:cursor-not-allowed
              disabled:hover:bg-transparent disabled:hover:text-[#CE0000] disabled:hover:shadow-none
              transition-all duration-150
            "
          >
            <Check className="h-3.5 w-3.5" />
            Mark all read
          </button>

          <button
            onClick={deleteAllRead}
            disabled={readCount === 0}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              text-xs font-semibold
              border border-gray-200 text-gray-400
              hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-md
              disabled:opacity-35 disabled:cursor-not-allowed
              disabled:hover:bg-transparent disabled:hover:text-gray-400 disabled:hover:shadow-none
              transition-all duration-150
            "
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete read
          </button>

          {isLoading && (
            <Loader2 className="h-3.5 w-3.5 text-gray-300 animate-spin ml-auto" />
          )}
        </div>

        {/* ══ List ════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* Error */}
          {error && (
            <div className="m-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-xs font-medium text-red-600">{error}</p>
              <button
                onClick={refresh}
                className="mt-1 text-xs text-red-500 underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 shadow-inner">
                <Bell className="h-7 w-7 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-400">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                {filter === "unread"
                  ? 'Switch to "All" to see your history.'
                  : "We'll notify you when something happens."}
              </p>
            </div>
          )}

          {/* Skeleton */}
          {isLoading && notifications.length === 0 && (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 bg-gray-100 rounded-full w-1/3" />
                    <div className="h-2   bg-gray-100 rounded-full w-4/5" />
                    <div className="h-2   bg-gray-100 rounded-full w-3/5" />
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
        <div className="flex-shrink-0 px-4 py-2.5 border-t border-gray-100 bg-gray-50/60">
          <p className="text-center text-[11px] text-gray-400">
            {totalAll} notification{totalAll !== 1 ? "s" : ""}
            {filter === "unread" ? " · unread only" : ""}
            {" · "}
            <button
              onClick={refresh}
              className="text-[#1D6FA3] hover:underline underline-offset-2 transition-colors"
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