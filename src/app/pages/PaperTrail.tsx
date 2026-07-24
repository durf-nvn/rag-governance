import { useState, useEffect, useRef } from "react";
import {
  Search, Filter, Plus, FileCheck, Clock, CheckCircle2, AlertCircle,
  FileText, Send, Building, User, Download, Printer, X, Loader2,
  ChevronRight, Eye, History, QrCode, Tag, MessageSquare, ExternalLink
} from "lucide-react";
import axios from "axios";
import { useRole } from "../contexts/RoleContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface PaperTrailLog {
  id: string;
  record_id: string;
  action: string;
  status: string;
  actor_name: string;
  actor_email: string;
  actor_role: string;
  notes?: string;
  timestamp: string;
}

interface PaperTrailRecord {
  id: string;
  tracking_number: string;
  title: string;
  document_type: string;
  office: string;
  sender_name: string;
  sender_email: string;
  sender_role: string;
  recipient_name?: string;
  recipient_email?: string;
  recipient_role?: string;
  status: string;
  remarks?: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
  logs: PaperTrailLog[];
}

export function PaperTrail() {
  const { userRole } = useRole();
  const currentRole = userRole || "FACULTY";

  const userEmail = sessionStorage.getItem("userEmail") || "faculty@ctu.edu.ph";
  const userName = sessionStorage.getItem("userName") || "Faculty Member";

  const [records, setRecords] = useState<PaperTrailRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedOffice, setSelectedOffice] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedRecordForStatus, setSelectedRecordForStatus] = useState<PaperTrailRecord | null>(null);
  const [newStatus, setNewStatus] = useState("Received");
  const [statusNotes, setStatusNotes] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [selectedRecordForTimeline, setSelectedRecordForTimeline] = useState<PaperTrailRecord | null>(null);

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedRecordForReceipt, setSelectedRecordForReceipt] = useState<PaperTrailRecord | null>(null);

  // New Record Form Data
  const [formData, setFormData] = useState({
    title: "",
    document_type: "Syllabus",
    office: "Academic Affairs",
    recipient_name: "",
    recipient_email: "",
    remarks: "",
  });
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Paper Trails
  const fetchPaperTrails = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/paper-trail`, {
        params: {
          role: currentRole,
          email: userEmail,
        },
      });
      setRecords(res.data || []);
    } catch (err) {
      console.error("Failed to load paper trails", err);
      showToast("Failed to fetch paper trail records", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaperTrails();
  }, [currentRole, userEmail]);

  // Create & Release Document
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.office) {
      showToast("Please complete the document title and target office.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedUrl: string | undefined = undefined;

      if (attachedFile) {
        const fileForm = new FormData();
        fileForm.append("file", attachedFile);
        const uploadRes = await axios.post(`${API_BASE}/paper-trail/upload`, fileForm, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedUrl = uploadRes.data.file_url;
      }

      await axios.post(`${API_BASE}/paper-trail`, {
        title: formData.title,
        document_type: formData.document_type,
        office: formData.office,
        sender_name: userName,
        sender_email: userEmail,
        sender_role: currentRole,
        recipient_name: formData.recipient_name || undefined,
        recipient_email: formData.recipient_email || undefined,
        recipient_role: "ADMIN",
        remarks: formData.remarks || undefined,
        file_url: uploadedUrl,
      });

      showToast("Paper trail record released and logged successfully!", "success");
      setShowCreateModal(false);
      setFormData({
        title: "",
        document_type: "Syllabus",
        office: "Academic Affairs",
        recipient_name: "",
        recipient_email: "",
        remarks: "",
      });
      setAttachedFile(null);
      fetchPaperTrails();
    } catch (err) {
      console.error("Failed to release document", err);
      showToast("Failed to create paper trail record.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Update Submit
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForStatus) return;

    setIsUpdatingStatus(true);
    try {
      await axios.put(`${API_BASE}/paper-trail/${selectedRecordForStatus.id}/status`, {
        status: newStatus,
        actor_name: userName,
        actor_email: userEmail,
        actor_role: currentRole,
        notes: statusNotes || undefined,
      });

      showToast(`Status updated to '${newStatus}'!`, "success");
      setShowStatusModal(false);
      setSelectedRecordForStatus(null);
      setStatusNotes("");
      fetchPaperTrails();
    } catch (err) {
      console.error("Failed to update status", err);
      showToast("Failed to update paper trail status.", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Filters & Search
  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.office.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === "all" || rec.status === selectedStatus;
    const matchesOffice = selectedOffice === "all" || rec.office === selectedOffice;
    const matchesType = selectedType === "all" || rec.document_type === selectedType;

    return matchesSearch && matchesStatus && matchesOffice && matchesType;
  });

  // Metrics
  const totalTracked = records.length;
  const pendingReceiving = records.filter((r) => r.status === "Pending Receiving").length;
  const approvedCount = records.filter((r) => r.status === "Approved").length;
  const needsRevisionCount = records.filter((r) => r.status === "Needs Revision").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return { label: "Approved / Paper OK", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 };
      case "Needs Revision":
        return { label: "Needs Revision", bg: "bg-rose-50 text-rose-700 border-rose-200", icon: AlertCircle };
      case "Received":
        return { label: "Received by Office", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: FileCheck };
      case "Under Review":
        return { label: "Under Review", bg: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock };
      case "Released":
        return { label: "Released / Transmitted", bg: "bg-purple-50 text-purple-700 border-purple-200", icon: Send };
      default:
        return { label: "Pending Receiving", bg: "bg-orange-50 text-[#D97E00] border-[#FF9501]/30", icon: Clock };
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)] relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 text-sm font-bold z-[100] transition-all animate-in slide-in-from-bottom-5 ${
            toast.type === "success"
              ? "bg-[#FFF4E5] text-[#D97E00] border-2 border-[#FF9501]/20"
              : "bg-red-50 text-red-700 border-2 border-red-200"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex-none space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#1F2937]">Document Paper Trail</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Official receiving, releasing, and verification history between Faculty & Offices
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#FF9501] text-white rounded-lg hover:bg-[#D97E00] transition-all cursor-pointer shadow-sm active:scale-95 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              <span>Release / Submit Document</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Tracked */}
          <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] border-t-4 border-t-[#1D6FA3] shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Total Tracked</p>
              <h3 className="text-2xl font-bold text-[#1F2937] mt-1">{totalTracked}</h3>
              <p className="text-[11px] text-[#6B7280] mt-0.5">Documents in paper trail</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#1D6FA3]">
              <FileText className="h-6 w-6" />
            </div>
          </div>

          {/* Pending Receiving */}
          <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] border-t-4 border-t-[#FF9501] shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Pending Receiving</p>
              <h3 className="text-2xl font-bold text-[#D97E00] mt-1">{pendingReceiving}</h3>
              <p className="text-[11px] text-[#6B7280] mt-0.5">Awaiting office receipt</p>
            </div>
            <div className="w-12 h-12 bg-[#FFF4E5] rounded-xl flex items-center justify-center text-[#FF9501]">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          {/* Verified / Approved */}
          <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] border-t-4 border-t-emerald-500 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Verified / Approved</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</h3>
              <p className="text-[11px] text-emerald-700 mt-0.5">Verified & paper okay</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>

          {/* Needs Revision */}
          <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] border-t-4 border-t-rose-500 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Needs Revision</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">{needsRevisionCount}</h3>
              <p className="text-[11px] text-rose-700 mt-0.5">Returned to sender</p>
            </div>
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search by Tracking #, Document Title, Sender, or Office..."
                className="w-full pl-11 pr-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9501]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3">
              <select
                className="w-full sm:w-44 px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9501] text-[#374151] cursor-pointer"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Pending Receiving">Pending Receiving</option>
                <option value="Received">Received</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved (Paper OK)</option>
                <option value="Needs Revision">Needs Revision</option>
                <option value="Released">Released</option>
              </select>

              <select
                className="w-full sm:w-44 px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9501] text-[#374151] cursor-pointer"
                value={selectedOffice}
                onChange={(e) => setSelectedOffice(e.target.value)}
              >
                <option value="all">All Offices</option>
                <option value="Academic Affairs">Academic Affairs</option>
                <option value="Student Affairs">Student Affairs</option>
                <option value="Dean's Office">Dean's Office</option>
                <option value="Registrar Office">Registrar Office</option>
                <option value="Research Office">Research Office</option>
                <option value="Quality Assurance">Quality Assurance</option>
              </select>

              <select
                className="w-full sm:w-44 px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9501] text-[#374151] cursor-pointer"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">All Document Types</option>
                <option value="Syllabus">Syllabus</option>
                <option value="Transmittal Sheet">Transmittal Sheet</option>
                <option value="Grade Sheet">Grade Sheet</option>
                <option value="Clearance Form">Clearance Form</option>
                <option value="Accreditation Document">Accreditation Document</option>
                <option value="MOA / MOU">MOA / MOU</option>
                <option value="Administrative Report">Administrative Report</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 bg-white rounded-xl border border-[#E5E7EB] shadow-sm flex flex-col overflow-hidden min-h-[300px]">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#6B7280]">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF9501] mb-3" />
            <p className="text-sm font-medium">Loading paper trail records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#6B7280] text-center">
            <FileCheck className="h-12 w-12 text-[#9CA3AF] mb-3 stroke-[1.5]" />
            <h3 className="text-base font-semibold text-[#1F2937]">No Paper Trail Records Found</h3>
            <p className="text-sm text-[#6B7280] mt-1 max-w-md">
              There are no document movement logs matching your search or filter. Release a new document to start tracking!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-[#FF9501] text-white text-xs font-semibold rounded-lg hover:bg-[#D97E00] transition-colors"
            >
              Release Document
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full whitespace-nowrap text-left border-collapse">
              <thead className="bg-[#FF9501] text-white sticky top-0 z-20 shadow-md">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Tracking #</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Document Title & Type</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Target Office</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Sender</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredRecords.map((rec) => {
                  const badge = getStatusBadge(rec.status);
                  const BadgeIcon = badge.icon;
                  return (
                    <tr key={rec.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Tag className="h-3.5 w-3.5 text-[#FF9501]" />
                          <span className="font-mono font-bold text-xs text-[#1F2937]">{rec.tracking_number}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm text-[#1F2937] truncate max-w-xs" title={rec.title}>
                          {rec.title}
                        </div>
                        <div className="text-xs text-[#6B7280] flex items-center gap-1.5 mt-0.5">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                            {rec.document_type}
                          </span>
                          {rec.file_url && (
                            <a
                              href={rec.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#FF9501] hover:underline flex items-center gap-0.5 text-[11px]"
                            >
                              <ExternalLink className="h-3 w-3" /> File Attachment
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-[#374151] flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-[#6B7280]" />
                          <span>{rec.office}</span>
                        </div>
                        {rec.recipient_name && (
                          <div className="text-[11px] text-[#6B7280] pl-5">To: {rec.recipient_name}</div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-[#374151] flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-[#6B7280]" />
                          <span>{rec.sender_name}</span>
                        </div>
                        <div className="text-[11px] text-[#6B7280] pl-5">{rec.sender_email}</div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full border ${badge.bg}`}>
                          <BadgeIcon className="h-3.5 w-3.5" />
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-[#6B7280]">
                        {new Date(rec.updated_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Timeline / History */}
                          <button
                            onClick={() => {
                              setSelectedRecordForTimeline(rec);
                              setShowTimelineModal(true);
                            }}
                            className="p-1.5 text-[#6B7280] hover:text-[#FF9501] hover:bg-[#FFF4E5] rounded-lg transition-colors cursor-pointer"
                            title="View Timeline History"
                          >
                            <History className="h-4 w-4" />
                          </button>

                          {/* Print Receipt */}
                          <button
                            onClick={() => {
                              setSelectedRecordForReceipt(rec);
                              setShowReceiptModal(true);
                            }}
                            className="p-1.5 text-[#6B7280] hover:text-[#FF9501] hover:bg-[#FFF4E5] rounded-lg transition-colors cursor-pointer"
                            title="Print Transmittal Receipt"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          {/* Update Status */}
                          <button
                            onClick={() => {
                              setSelectedRecordForStatus(rec);
                              setNewStatus(rec.status === "Pending Receiving" ? "Received" : "Approved");
                              setStatusNotes("");
                              setShowStatusModal(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-[#FFF4E5] text-[#D97E00] hover:bg-[#FF9501] hover:text-white border border-[#FF9501]/30 rounded-md transition-all cursor-pointer shadow-sm active:scale-95"
                            title="Update Status"
                          >
                            Update Status
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE & RELEASE DOCUMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border-t-4 border-t-[#FF9501] max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F9FAFB]">
              <div>
                <h2 className="text-xl font-semibold text-[#1F2937]">Release / Submit Document</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Generate a tracking entry for official receiving & releasing
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-[#E5E7EB] rounded-full transition-colors cursor-pointer text-[#6B7280]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BSIT Course Syllabus for CS46 - SY 2026-2027"
                  className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9501]"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">Document Type</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9501] cursor-pointer"
                    value={formData.document_type}
                    onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                  >
                    <option value="Syllabus">Syllabus</option>
                    <option value="Transmittal Sheet">Transmittal Sheet</option>
                    <option value="Grade Sheet">Grade Sheet</option>
                    <option value="Clearance Form">Clearance Form</option>
                    <option value="Accreditation Document">Accreditation Document</option>
                    <option value="MOA / MOU">MOA / MOU</option>
                    <option value="Administrative Report">Administrative Report</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">Target Office / Destination</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9501] cursor-pointer"
                    value={formData.office}
                    onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                  >
                    <option value="Academic Affairs">Academic Affairs</option>
                    <option value="Student Affairs">Student Affairs</option>
                    <option value="Dean's Office">Dean's Office</option>
                    <option value="Registrar Office">Registrar Office</option>
                    <option value="Research Office">Research Office</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">Recipient Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Maria Santos"
                    className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9501]"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">Recipient Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="recipient@ctu.edu.ph"
                    className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9501]"
                    value={formData.recipient_email}
                    onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">Initial Remarks / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Submitted for Dean's signature and verification."
                  className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9501] resize-none"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">Attach Digital Copy (Optional)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#E5E7EB] hover:border-[#FF9501] bg-[#F9FAFB] hover:bg-[#FFF4E5]/40 rounded-lg p-4 text-center cursor-pointer transition-colors"
                >
                  {attachedFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[#FF9501]">
                      <FileText className="h-4 w-4" />
                      <span>{attachedFile.name}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-[#6B7280]">Click to attach PDF, Word, or image copy of the document</p>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold bg-[#FF9501] text-white rounded-lg hover:bg-[#D97E00] transition-colors flex justify-center items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Release & Create Tracking
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {showStatusModal && selectedRecordForStatus && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border-t-4 border-t-[#FF9501] max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F9FAFB]">
              <div>
                <h2 className="text-lg font-semibold text-[#1F2937]">Update Paper Status</h2>
                <p className="text-xs font-mono font-bold text-[#FF9501] mt-0.5">
                  {selectedRecordForStatus.tracking_number}
                </p>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-1.5 hover:bg-[#E5E7EB] rounded-full transition-colors cursor-pointer text-[#6B7280]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                <div className="text-xs font-semibold text-[#1F2937]">{selectedRecordForStatus.title}</div>
                <div className="text-[11px] text-[#6B7280] mt-0.5">
                  Sender: {selectedRecordForStatus.sender_name} | Office: {selectedRecordForStatus.office}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">New Movement Status</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9501] cursor-pointer"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="Received">Received (Acknowledged Receipt)</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved (Paper OK / Verified)</option>
                  <option value="Needs Revision">Needs Revision (Returned to Sender)</option>
                  <option value="Released">Released (Transmitted to Next Office)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">Movement Notes / Action Remarks</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Received by Office Staff. Document verified as complete and accurate."
                  className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9501] resize-none"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold bg-[#FF9501] text-white rounded-lg hover:bg-[#D97E00] flex justify-center items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Status & Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TIMELINE / HISTORY MODAL */}
      {showTimelineModal && selectedRecordForTimeline && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F9FAFB]">
              <div>
                <h2 className="text-lg font-semibold text-[#1F2937]">Document Paper Trail Movement Log</h2>
                <p className="text-xs font-mono font-bold text-[#FF9501] mt-0.5">
                  {selectedRecordForTimeline.tracking_number} - {selectedRecordForTimeline.title}
                </p>
              </div>
              <button
                onClick={() => setShowTimelineModal(false)}
                className="p-1.5 hover:bg-[#E5E7EB] rounded-full transition-colors cursor-pointer text-[#6B7280]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Summary Card */}
              <div className="p-4 bg-[#FFF4E5]/50 border border-[#FF9501]/20 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#D97E00]">Office Destination: {selectedRecordForTimeline.office}</span>
                  <span className="font-semibold text-[#D97E00]">Type: {selectedRecordForTimeline.document_type}</span>
                </div>
                <div className="text-[#374151]">
                  <strong>Sender:</strong> {selectedRecordForTimeline.sender_name} ({selectedRecordForTimeline.sender_email})
                </div>
                {selectedRecordForTimeline.remarks && (
                  <div className="text-[#6B7280] italic pt-1 border-t border-[#FF9501]/20">
                    "{selectedRecordForTimeline.remarks}"
                  </div>
                )}
              </div>

              {/* Timeline Tree */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E7EB]">
                {selectedRecordForTimeline.logs && selectedRecordForTimeline.logs.length > 0 ? (
                  selectedRecordForTimeline.logs.map((log, idx) => {
                    const logBadge = getStatusBadge(log.status);
                    return (
                      <div key={log.id || idx} className="relative flex items-start gap-4">
                        <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-[#FF9501] flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#FF9501]" />
                        </div>

                        <div className="flex-1 bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[#1F2937]">{log.action}</span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${logBadge.bg}`}>
                              {log.status}
                            </span>
                          </div>

                          <div className="text-xs text-[#6B7280] flex items-center gap-2">
                            <span>Actor: <strong>{log.actor_name}</strong> ({log.actor_role})</span>
                            <span>•</span>
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                          </div>

                          {log.notes && (
                            <p className="text-xs text-[#374151] pt-1 bg-white p-2.5 rounded-lg border border-[#E5E7EB] italic">
                              "{log.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-[#6B7280]">No history logs recorded yet.</p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex justify-end">
              <button
                onClick={() => setShowTimelineModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE TRANSMITTAL RECEIPT MODAL */}
      {showReceiptModal && selectedRecordForReceipt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F9FAFB] print:hidden">
              <span className="text-sm font-semibold text-[#1F2937]">Official Transmittal Slip Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReceipt}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF9501] text-white text-xs font-semibold rounded-lg hover:bg-[#D97E00] shadow-sm cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Receipt
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="p-1 hover:bg-[#E5E7EB] rounded-full text-[#6B7280]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Content Area */}
            <div className="p-8 overflow-y-auto space-y-6 print:p-0">
              <div className="border-2 border-[#1F2937] p-6 rounded-lg space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-gray-200 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#1F2937]">CEBU TECHNOLOGICAL UNIVERSITY</h2>
                    <p className="text-xs font-semibold text-gray-600">ARGAO CAMPUS — KNOWLEDGE MANAGEMENT SYSTEM</p>
                    <p className="text-[11px] text-gray-500 mt-1">Official Document Transmittal & Paper Trail Receipt</p>
                  </div>
                  <div className="text-right">
                    <div className="inline-block p-2 bg-gray-100 rounded border border-gray-300 text-center font-mono">
                      <QrCode className="h-8 w-8 mx-auto text-gray-800" />
                      <span className="text-[10px] font-bold block mt-1">{selectedRecordForReceipt.tracking_number}</span>
                    </div>
                  </div>
                </div>

                {/* Details Table */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 block">Tracking Number:</span>
                    <strong className="font-mono text-sm text-[#1F2937]">{selectedRecordForReceipt.tracking_number}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Date Released:</span>
                    <strong className="text-[#1F2937]">{new Date(selectedRecordForReceipt.created_at).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Document Title:</span>
                    <strong className="text-[#1F2937]">{selectedRecordForReceipt.title}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Document Type:</span>
                    <strong className="text-[#1F2937]">{selectedRecordForReceipt.document_type}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Released By (Sender):</span>
                    <strong className="text-[#1F2937]">{selectedRecordForReceipt.sender_name} ({selectedRecordForReceipt.sender_role})</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Destination Office:</span>
                    <strong className="text-[#1F2937]">{selectedRecordForReceipt.office}</strong>
                  </div>
                </div>

                {/* Status Box */}
                <div className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between items-center text-xs">
                  <span>Current Paper Trail Status:</span>
                  <span className="font-bold text-[#FF9501] uppercase tracking-wider">{selectedRecordForReceipt.status}</span>
                </div>

                {/* Signatures Line */}
                <div className="pt-12 grid grid-cols-2 gap-12 text-xs text-center border-t border-gray-200">
                  <div>
                    <div className="border-b border-gray-400 mb-1 pb-1 font-semibold">{selectedRecordForReceipt.sender_name}</div>
                    <span className="text-gray-500 text-[11px]">Releasing Officer / Faculty Signature</span>
                  </div>
                  <div>
                    <div className="border-b border-gray-400 mb-1 pb-1 font-semibold">
                      {selectedRecordForReceipt.recipient_name || "Receiving Office Staff"}
                    </div>
                    <span className="text-gray-500 text-[11px]">Receiving Office Signature & Date</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
