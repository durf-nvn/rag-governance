import { X, Check, AlertCircle, Info, CheckCircle } from "lucide-react";

interface Notification {
  id: number;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationSidebar({ isOpen, onClose }: NotificationSidebarProps) {
  const notifications: Notification[] = [
    {
      id: 1,
      type: "success",
      title: "Document Uploaded",
      message: "Your document 'Student Handbook 2026' has been successfully uploaded.",
      time: "2 hours ago",
      read: false
    },
    {
      id: 2,
      type: "info",
      title: "New Announcement",
      message: "Midterm examination schedule has been released. Check your courses.",
      time: "5 hours ago",
      read: false
    },
    {
      id: 3,
      type: "warning",
      title: "Document Pending Review",
      message: "Your document is pending approval from the administrator.",
      time: "1 day ago",
      read: true
    },
    {
      id: 4,
      type: "success",
      title: "Query Answered",
      message: "Your policy question has been answered by the AI assistant.",
      time: "2 days ago",
      read: true
    },
    {
      id: 5,
      type: "info",
      title: "System Maintenance",
      message: "Scheduled system maintenance on March 30, 2026 from 2:00 AM to 4:00 AM.",
      time: "3 days ago",
      read: true
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-[#006837]" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-[#FDB913]" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-[#CE0000]" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationBgColor = (type: string, read: boolean) => {
    if (read) return "bg-gray-50";
    switch (type) {
      case "success":
        return "bg-[#006837]/5";
      case "warning":
        return "bg-[#FDB913]/5";
      case "error":
        return "bg-[#CE0000]/5";
      default:
        return "bg-blue-50";
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#CE0000] text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-sm text-white/80">{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Actions */}
        <div className="p-4 border-b border-gray-200 flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm text-[#CE0000] border border-[#CE0000] rounded-lg hover:bg-[#CE0000] hover:text-white transition-colors">
            <Check className="h-4 w-4" />
            Mark all as read
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${getNotificationBgColor(notification.type, notification.read)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className={`text-sm font-medium text-gray-900 ${!notification.read ? 'font-semibold' : ''}`}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-[#CE0000] rounded-full flex-shrink-0 ml-2 mt-1"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  <p className="text-xs text-gray-500">{notification.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button className="w-full text-center text-sm text-[#CE0000] hover:text-[#b50000] transition-colors">
            View all notifications
          </button>
        </div>
      </div>
    </>
  );
}
