import { useState } from "react";
import { Send, Users, Calendar, CheckCircle, Clock, Eye } from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  content: string;
  recipients: string;
  sentDate: string;
  sentBy: string;
  status: "Sent" | "Scheduled" | "Draft";
  readCount: number;
  totalRecipients: number;
}

export function BroadcastAnnouncement() {
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const recipientOptions = [
    { value: "all", label: "All Users", count: 244 },
    { value: "students", label: "All Students", count: 155 },
    { value: "faculty", label: "All Faculty", count: 89 },
  ];

  const previousAnnouncements: Announcement[] = [
    {
      id: 1,
      title: "Midterm Examination Schedule Released",
      content: "The midterm examination schedule for all programs has been posted. Please check your respective course sections...",
      recipients: "All Students, All Faculty",
      sentDate: "March 24, 2026",
      sentBy: "Admin User",
      status: "Sent",
      readCount: 198,
      totalRecipients: 244
    },
    {
      id: 2,
      title: "Library Extended Hours This Week",
      content: "The university library will be open until 10 PM this week to accommodate students preparing for examinations...",
      recipients: "All Students",
      sentDate: "March 20, 2026",
      sentBy: "Admin User",
      status: "Sent",
      readCount: 142,
      totalRecipients: 155
    },
    {
      id: 3,
      title: "Faculty Development Workshop",
      content: "A workshop on innovative teaching methodologies will be conducted next month. Registration is now open...",
      recipients: "All Faculty",
      sentDate: "March 28, 2026",
      sentBy: "Admin User",
      status: "Scheduled",
      readCount: 0,
      totalRecipients: 89
    }
  ];

  const handleRecipientToggle = (value: string) => {
    setSelectedRecipients(prev =>
      prev.includes(value)
        ? prev.filter(r => r !== value)
        : [...prev, value]
    );
  };

  const handleSendAnnouncement = () => {
    if (!title || !content || selectedRecipients.length === 0) {
      alert("Please fill in all required fields and select at least one recipient group.");
      return;
    }

    const action = scheduleDate ? "scheduled" : "sent";
    alert(`Announcement ${action} successfully!\n\nTitle: ${title}\nRecipients: ${selectedRecipients.join(", ")}`);

    setTitle("");
    setContent("");
    setSelectedRecipients([]);
    setScheduleDate("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Sent": return "bg-[#006837] text-white";
      case "Scheduled": return "bg-[#FDB913] text-gray-900";
      case "Draft": return "bg-gray-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2937]">Broadcast Announcement</h1>
          <p className="text-sm text-[#6B7280] mt-1">Send announcements to all students and faculty</p>
        </div>
      </div>

      {/* Create Announcement */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
        <h2 className="text-lg font-semibold text-[#1F2937] mb-6">Create New Announcement</h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-[#1F2937]">Announcement Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
              placeholder="Enter announcement title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[#1F2937]">Message Content *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
              placeholder="Type your announcement message here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 text-[#1F2937]">Select Recipients *</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recipientOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRecipientToggle(option.value)}
                  className={`p-5 rounded-lg border-2 transition-all text-left ${
                    selectedRecipients.includes(option.value)
                      ? "border-[#1D6FA3] bg-blue-50"
                      : "border-[#E5E7EB] hover:border-[#1D6FA3]/50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedRecipients.includes(option.value) ? "bg-[#1D6FA3]" : "bg-[#F5F7FA]"
                    }`}>
                      <Users className={`h-5 w-5 ${
                        selectedRecipients.includes(option.value) ? "text-white" : "text-[#1D6FA3]"
                      }`} />
                    </div>
                    <h3 className="text-sm font-semibold text-[#1F2937]">{option.label}</h3>
                  </div>
                  <p className="text-sm text-[#6B7280]">{option.count} recipients</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[#1F2937]">Schedule Delivery (Optional)</label>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-[#6B7280]" />
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="flex-1 px-4 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
              />
            </div>
            <p className="text-sm text-[#6B7280] mt-2">Leave empty to send immediately</p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#E5E7EB]">
            <button
              onClick={handleSendAnnouncement}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] transition-colors font-medium"
            >
              <Send className="h-5 w-5" />
              {scheduleDate ? "Schedule Announcement" : "Send Now"}
            </button>
            <button className="px-6 py-3 text-[#6B7280] border border-[#E5E7EB] rounded-lg hover:bg-[#F5F7FA] transition-colors font-medium">
              Save as Draft
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-[#10B981]" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#10B981]">28</h3>
              <p className="text-sm text-[#6B7280]">Total Sent</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-[#FFC107]" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#FFC107]">3</h3>
              <p className="text-sm text-[#6B7280]">Scheduled</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Eye className="h-6 w-6 text-[#1D6FA3]" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#1D6FA3]">85%</h3>
              <p className="text-sm text-[#6B7280]">Avg. Read Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Previous Announcements */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
        <h2 className="text-lg font-semibold text-[#1F2937] mb-6">Previous Announcements</h2>
        <div className="space-y-4">
          {previousAnnouncements.map((announcement) => (
            <div key={announcement.id} className="border border-[#E5E7EB] rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-[#1F2937] font-semibold text-base">{announcement.title}</h3>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      announcement.status === "Sent" 
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : announcement.status === "Scheduled"
                        ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                        : "bg-gray-100 text-gray-700 border border-gray-200"
                    }`}>
                      {announcement.status}
                    </span>
                  </div>
                  <p className="text-[#1F2937] text-sm mb-3 leading-relaxed">{announcement.content}</p>
                  <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {announcement.recipients}
                    </span>
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {announcement.sentDate}
                    </span>
                  </div>
                </div>
              </div>

              {announcement.status === "Sent" && (
                <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#6B7280]">Read by:</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[#1F2937]">
                        {announcement.readCount} / {announcement.totalRecipients}
                      </span>
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#10B981]"
                          style={{ width: `${(announcement.readCount / announcement.totalRecipients) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-[#10B981] font-medium min-w-[45px]">
                        {Math.round((announcement.readCount / announcement.totalRecipients) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}