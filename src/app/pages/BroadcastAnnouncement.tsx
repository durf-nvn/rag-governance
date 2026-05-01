import { useState, useEffect } from "react";
import { Send, Users, Calendar, CheckCircle, Clock, Eye, Loader2, Save, Radio, Search, Filter, X, Trash2, BarChart3 } from "lucide-react";
import axios from "axios";

interface Announcement {
  id: string;
  title: string;
  content: string;
  recipients: string;
  sent_date: string;
  sent_by: string;
  status: "Sent" | "Scheduled" | "Draft";
  read_count: number;
  total_recipients: number;
}

export function BroadcastAnnouncement() {
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // Real-time Database Counts
  const [userCounts, setUserCounts] = useState({ all: 0, students: 0, faculty: 0 });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Sent" | "Scheduled" | "Draft">("All");

  // Modals
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const userEmail = localStorage.getItem("userEmail") || "admin@ctu.edu.ph";

  const recipientOptions = [
    { value: "All Users", label: "All Users", count: userCounts.all },
    { value: "All Students", label: "All Students", count: userCounts.students },
    { value: "All Faculty", label: "All Faculty", count: userCounts.faculty },
  ];

  useEffect(() => {
    fetchAnnouncements();
    fetchUserCounts();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get("http://localhost:8000/announcements");
      setAnnouncements(response.data);
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const fetchUserCounts = async () => {
    try {
      const response = await axios.get("http://localhost:8000/users/counts");
      setUserCounts(response.data);
    } catch (error) {
      console.error("Failed to fetch user counts:", error);
    }
  };

  const calculateTotalTargets = (selections: string[]) => {
    let totalTargets = 0;
    if (selections.includes("All Users")) {
      totalTargets = userCounts.all;
    } else {
      if (selections.includes("All Students")) totalTargets += userCounts.students;
      if (selections.includes("All Faculty")) totalTargets += userCounts.faculty;
    }
    return totalTargets;
  };

  const handleRecipientToggle = (value: string, currentSelections: string[], setFunction: (val: string[]) => void) => {
    setFunction(
      (() => {
        if (value === "All Users") return ["All Users"];
        const newSelection = currentSelections.filter(r => r !== "All Users");
        return currentSelections.includes(value) 
          ? newSelection.filter(r => r !== value) 
          : [...newSelection, value];
      })()
    );
  };

  // Create New Announcement
  const handleSendAnnouncement = async (statusOverride: "Sent" | "Scheduled" | "Draft" = "Sent") => {
    if (!title || !content || selectedRecipients.length === 0) {
      alert("Please fill in all required fields and select at least one recipient group.");
      return;
    }
    setIsLoading(true);
    const payload = {
      title,
      content,
      recipients: selectedRecipients.join(", "),
      schedule_date: scheduleDate || null,
      status: statusOverride === "Draft" ? "Draft" : (scheduleDate ? "Scheduled" : "Sent"),
      sent_by: userEmail,
      total_recipients: calculateTotalTargets(selectedRecipients)
    };

    try {
      await axios.post("http://localhost:8000/announcements", payload);
      setTitle(""); setContent(""); setSelectedRecipients([]); setScheduleDate("");
      fetchAnnouncements();
    } catch (error) {
      alert("Failed to create broadcast. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Update Existing Draft/Scheduled
  const handleUpdateAnnouncement = async (id: string, action: "Save" | "Send Now") => {
    if (!editingAnnouncement) return;
    if (!editingAnnouncement.title || !editingAnnouncement.content || editingAnnouncement.recipients.length === 0) {
      alert("Fields cannot be empty."); return;
    }

    setIsModalLoading(true);
    const isSendingNow = action === "Send Now";
    
    const payload = {
      title: editingAnnouncement.title,
      content: editingAnnouncement.content,
      recipients: editingAnnouncement.recipients,
      schedule_date: isSendingNow ? null : (editingAnnouncement.schedule_date || null),
      status: isSendingNow ? "Sent" : editingAnnouncement.status,
      total_recipients: calculateTotalTargets(editingAnnouncement.recipients.split(", "))
    };

    try {
      await axios.put(`http://localhost:8000/announcements/${id}`, payload);
      setEditingAnnouncement(null);
      fetchAnnouncements();
    } catch (error) {
      alert("Failed to update announcement.");
    } finally {
      setIsModalLoading(false);
    }
  };

  // Delete Draft/Scheduled
  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement? This cannot be undone.")) return;
    setIsModalLoading(true);
    try {
      await axios.delete(`http://localhost:8000/announcements/${id}`);
      setEditingAnnouncement(null);
      fetchAnnouncements();
    } catch (error) {
      alert("Failed to delete announcement.");
    } finally {
      setIsModalLoading(false);
    }
  };

  // Format Helpers
  const formatDate = (isoString: string) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Filter Logic
  const filteredAnnouncements = announcements.filter(a => {
    const matchesStatus = statusFilter === "All" || a.status === statusFilter;
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Statistics
  const totalSent = announcements.filter(a => a.status === "Sent").length;
  const totalScheduled = announcements.filter(a => a.status === "Scheduled").length;
  let globalReadCount = 0; let globalTotalRecipients = 0;
  announcements.filter(a => a.status === "Sent").forEach(a => { globalReadCount += a.read_count; globalTotalRecipients += a.total_recipients; });
  const avgReadRate = globalTotalRecipients === 0 ? 0 : Math.round((globalReadCount / globalTotalRecipients) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2937]">Broadcast Announcement</h1>
          <p className="text-sm text-[#6B7280] mt-1">Send announcements to all students and faculty</p>
        </div>
      </div>

      {/* CREATE ANNOUNCEMENT FORM */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1F2937] mb-6">Create New Announcement</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-[#1F2937]">Announcement Title *</label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] transition-all"
              placeholder="Enter announcement title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[#1F2937]">Message Content *</label>
            <textarea
              value={content} onChange={(e) => setContent(e.target.value)} rows={5}
              className="w-full px-4 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] transition-all resize-none"
              placeholder="Type your announcement message here..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-3 text-[#1F2937]">Select Recipients *</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recipientOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRecipientToggle(option.value, selectedRecipients, setSelectedRecipients)}
                  className={`p-5 rounded-lg border-2 transition-all text-left cursor-pointer ${
                    selectedRecipients.includes(option.value) ? "border-[#1D6FA3] bg-blue-50/50" : "border-[#E5E7EB] hover:border-[#1D6FA3]/50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedRecipients.includes(option.value) ? "bg-[#1D6FA3]" : "bg-[#F5F7FA]"}`}>
                      <Users className={`h-5 w-5 ${selectedRecipients.includes(option.value) ? "text-white" : "text-[#1D6FA3]"}`} />
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
                type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                className="flex-1 px-4 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] transition-all cursor-pointer"
              />
            </div>
            <p className="text-xs text-[#6B7280] mt-2">Leave empty to send immediately</p>
          </div>
          <div className="flex gap-3 pt-4 border-t border-[#E5E7EB]">
            <button
              onClick={() => handleSendAnnouncement("Sent")} disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] transition-colors font-medium disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              {scheduleDate ? "Schedule Announcement" : "Send Broadcast Now"}
            </button>
            <button 
              onClick={() => handleSendAnnouncement("Draft")} disabled={isLoading}
              className="px-6 py-3 text-[#6B7280] border border-[#E5E7EB] bg-white rounded-lg hover:bg-[#F5F7FA] transition-colors font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="h-5 w-5" /> Save as Draft
            </button>
          </div>
        </div>
      </div>

      {/* STATISTICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-[#10B981]" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#10B981]">{totalSent}</h3>
              <p className="text-sm text-[#6B7280] font-medium">Total Sent</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-[#FFC107]" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#FFC107]">{totalScheduled}</h3>
              <p className="text-sm text-[#6B7280] font-medium">Scheduled</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Eye className="h-6 w-6 text-[#1D6FA3]" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#1D6FA3]">{avgReadRate}%</h3>
              <p className="text-sm text-[#6B7280] font-medium">Avg. Read Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* PREVIOUS ANNOUNCEMENTS LIST */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-[#1F2937]">Announcement History</h2>
          
          {/* NEW: Filtering Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text" placeholder="Search broadcasts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1D6FA3]"
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full sm:w-auto pl-9 pr-8 py-2 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1D6FA3] cursor-pointer appearance-none"
              >
                <option value="All">All Statuses</option>
                <option value="Sent">Sent</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Draft">Drafts</option>
              </select>
            </div>
          </div>
        </div>
        
        {isFetching ? (
          <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-[#1D6FA3]" /></div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Radio className="h-10 w-10 mx-auto text-gray-400 mb-2" />
            <p>No announcements found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <div 
                key={announcement.id} 
                onClick={() => {
                  if (announcement.status === "Sent") setViewingAnnouncement(announcement);
                  else setEditingAnnouncement(announcement);
                }}
                className="border border-[#E5E7EB] rounded-lg p-5 hover:shadow-md hover:border-[#1D6FA3]/30 transition-all bg-white cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-[#1F2937] font-bold text-base group-hover:text-[#1D6FA3] transition-colors">{announcement.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        announcement.status === "Sent" ? "bg-green-100 text-green-700"
                        : announcement.status === "Scheduled" ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600"
                      }`}>
                        {announcement.status}
                      </span>
                    </div>
                    <p className="text-[#4B5563] text-sm mb-3 line-clamp-2">{announcement.content}</p>
                    <div className="flex items-center gap-4 text-xs font-medium text-[#6B7280]">
                      <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {announcement.recipients}</span>
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDate(announcement.sent_date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Edit Draft / Scheduled */}
      {editingAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB] bg-gray-50">
              <div className="flex items-center gap-2">
                {editingAnnouncement.status === "Draft" ? <Save className="h-5 w-5 text-[#1D6FA3]" /> : <Clock className="h-5 w-5 text-yellow-500" />}
                <h3 className="font-bold text-gray-900">Edit {editingAnnouncement.status}</h3>
              </div>
              <button onClick={() => setEditingAnnouncement(null)} className="text-gray-400 hover:text-gray-900 p-1"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text" value={editingAnnouncement.title} onChange={(e) => setEditingAnnouncement({...editingAnnouncement, title: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-1 focus:ring-[#1D6FA3] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <textarea
                  value={editingAnnouncement.content} onChange={(e) => setEditingAnnouncement({...editingAnnouncement, content: e.target.value})} rows={5}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-1 focus:ring-[#1D6FA3] outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Recipients</label>
                <div className="flex flex-wrap gap-2">
                  {recipientOptions.map(opt => {
                    const isSelected = editingAnnouncement.recipients.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          const current = editingAnnouncement.recipients ? editingAnnouncement.recipients.split(", ") : [];
                          handleRecipientToggle(opt.value, current, (newVals) => setEditingAnnouncement({...editingAnnouncement, recipients: newVals.join(", ")}))
                        }}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                          isSelected ? "bg-[#1D6FA3] text-white border-[#1D6FA3]" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              {editingAnnouncement.status === "Scheduled" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Schedule Date</label>
                  <input
                    type="datetime-local" 
                    value={editingAnnouncement.schedule_date ? new Date(editingAnnouncement.schedule_date).toISOString().slice(0, 16) : ""} 
                    onChange={(e) => setEditingAnnouncement({...editingAnnouncement, schedule_date: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-1 focus:ring-[#1D6FA3] outline-none"
                  />
                </div>
              )}
            </div>

            <div className="p-5 border-t border-[#E5E7EB] bg-gray-50 flex items-center justify-between">
              <button 
                onClick={() => handleDeleteAnnouncement(editingAnnouncement.id)} disabled={isModalLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleUpdateAnnouncement(editingAnnouncement.id, "Save")} disabled={isModalLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => handleUpdateAnnouncement(editingAnnouncement.id, "Send Now")} disabled={isModalLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] transition-colors"
                >
                  {isModalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: View Sent Analytics */}
      {viewingAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB] bg-gray-50">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <h3 className="font-bold text-gray-900">Broadcast Analytics</h3>
              </div>
              <button onClick={() => setViewingAnnouncement(null)} className="text-gray-400 hover:text-gray-900 p-1"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{viewingAnnouncement.title}</h4>
                <div className="flex flex-wrap gap-2 text-xs font-medium text-gray-500 mb-4">
                  <span className="bg-gray-100 px-2 py-1 rounded">Sent: {formatDate(viewingAnnouncement.sent_date)}</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">By: {viewingAnnouncement.sent_by}</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">To: {viewingAnnouncement.recipients}</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap">
                  {viewingAnnouncement.content}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <h5 className="text-sm font-bold text-gray-900 mb-3">Delivery Performance</h5>
                <div className="flex items-end gap-3 mb-2">
                  <span className="text-3xl font-black text-[#10B981]">{viewingAnnouncement.read_count}</span>
                  <span className="text-sm font-medium text-gray-500 mb-1">out of {viewingAnnouncement.total_recipients} read</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                  <div
                    className="h-full bg-[#10B981] transition-all duration-1000"
                    style={{ width: viewingAnnouncement.total_recipients > 0 ? `${(viewingAnnouncement.read_count / viewingAnnouncement.total_recipients) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-[#E5E7EB] bg-gray-50 flex justify-end">
              <button onClick={() => setViewingAnnouncement(null)} className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}