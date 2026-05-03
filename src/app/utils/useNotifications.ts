// src/utils/useNotifications.ts
// ----------------------------------------------------------------
// Single source of truth for all notification state.
// Call this ONCE in DashboardLayout and pass data down via props.
// Features: polling, optimistic updates, new-notif sound alert.
// ----------------------------------------------------------------

import { useState, useCallback, useEffect, useRef } from "react";

const API_BASE = "http://localhost:8000";
const POLL_INTERVAL_MS = 20_000; // poll every 20 seconds

export type NotificationType = "info" | "success" | "warning" | "error";
export type FilterType = "all" | "unread";

export interface Notification {
  id: number;
  user_email: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  filter: FilterType;
  isLoading: boolean;
  error: string | null;
  setFilter: (f: FilterType) => void;
  refresh: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markOneRead: (id: number) => Promise<void>;
  deleteAllRead: () => Promise<void>;
}

// ------------------------------------------------------------------
// Time-ago helper
// ------------------------------------------------------------------
export function timeAgo(isoString: string): string {
  const diff  = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days  < 7)  return `${days} day${days !== 1 ? "s" : ""} ago`;
  return new Date(isoString).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ------------------------------------------------------------------
// Soft two-note chime via Web Audio API — no external files needed
// ------------------------------------------------------------------
export function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playTone = (freq: number, start: number, duration: number, vol: number) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };

    const t = ctx.currentTime;
    playTone(659.25, t,        0.18, 0.22); // E5
    playTone(783.99, t + 0.16, 0.28, 0.18); // G5
  } catch {
    // Silently ignore — AudioContext may be blocked before a user gesture
  }
}

// ------------------------------------------------------------------
// Hook — call ONCE in DashboardLayout, pass return value as props
// ------------------------------------------------------------------
export function useNotifications(): UseNotificationsReturn {
  const userEmail = localStorage.getItem("userEmail") ?? "";

  // allNotifications always holds the FULL list regardless of filter
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [filter,           setFilterState]      = useState<FilterType>("all");
  const [isLoading,        setIsLoading]        = useState(false);
  const [error,            setError]            = useState<string | null>(null);

  const highestIdRef = useRef<number>(-1);
  const pollingRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFirstFetch = useRef(true);

  // unreadCount is always derived from the full list — never stale
  const unreadCount = allNotifications.filter((n: Notification) => !n.is_read).length;

  // The filtered view the sidebar displays
  const notifications: Notification[] =
    filter === "unread"
      ? allNotifications.filter((n: Notification) => !n.is_read)
      : allNotifications;

  // ── fetch (always fetches ALL — filter is client-side) ───────────
  const fetchNotifications = useCallback(async () => {
    if (!userEmail) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/notifications?email=${encodeURIComponent(userEmail)}&filter=all`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` } }
      );
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: Notification[] = await res.json();

      // Detect new unread notifications and play sound
      if (data.length > 0) {
        const maxId = Math.max(...data.map((n: Notification) => n.id));
        if (!isFirstFetch.current && maxId > highestIdRef.current) {
          const hasNewUnread = data.some(
            (n: Notification) => n.id > highestIdRef.current && !n.is_read
          );
          if (hasNewUnread) playNotificationSound();
        }
        if (isFirstFetch.current) isFirstFetch.current = false;
        highestIdRef.current = Math.max(highestIdRef.current, maxId);
      }

      setAllNotifications(data);
    } catch (err) {
      setError("Could not load notifications.");
      console.error("[useNotifications] fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userEmail]);

  const refresh = useCallback(() => fetchNotifications(), [fetchNotifications]);

  // Filter switch — no refetch, just changes the derived view
  const setFilter = useCallback((f: FilterType) => setFilterState(f), []);

  // ── mark all read (optimistic) ───────────────────────────────────
  const markAllRead = useCallback(async () => {
    if (!userEmail) return;
    setAllNotifications((prev) =>
      prev.map((n: Notification) => ({ ...n, is_read: true }))
    );
    try {
      await fetch(`${API_BASE}/notifications/mark-all-read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
        },
        body: JSON.stringify({ email: userEmail }),
      });
    } catch {
      refresh();
    }
  }, [userEmail, refresh]);

  // ── mark one read (optimistic) ───────────────────────────────────
  const markOneRead = useCallback(async (id: number) => {
    setAllNotifications((prev) =>
      prev.map((n: Notification) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
      });
    } catch {
      refresh();
    }
  }, [refresh]);

  // ── delete read (optimistic) ─────────────────────────────────────
  const deleteAllRead = useCallback(async () => {
    if (!userEmail) return;
    setAllNotifications((prev) =>
      prev.filter((n: Notification) => !n.is_read)
    );
    try {
      await fetch(`${API_BASE}/notifications/delete-read`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
        },
        body: JSON.stringify({ email: userEmail }),
      });
    } catch {
      refresh();
    }
  }, [userEmail, refresh]);

  // ── initial fetch + polling ──────────────────────────────────────
  useEffect(() => {
    fetchNotifications();
    pollingRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    filter,
    isLoading,
    error,
    setFilter,
    refresh,
    markAllRead,
    markOneRead,
    deleteAllRead,
  };
}