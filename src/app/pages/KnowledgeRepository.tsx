import { useState } from "react";
import { Search, Filter, Upload, Download, Edit, Archive, Clock, Eye, CheckCircle } from "lucide-react";
import { useRole } from "../contexts/RoleContext";
import { hasPermission } from "../utils/rolePermissions";

export function KnowledgeRepository() {
  const { user } = useRole();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const canUpload = hasPermission(user.role, "canUploadDocuments");
  const canEdit = hasPermission(user.role, "canEditDocuments");
  const canDelete = hasPermission(user.role, "canDeleteDocuments");

  const documents = [
    {
      id: 1,
      name: "Student Handbook 2026",
      category: "Policy",
      office: "Student Affairs",
      version: "3.2",
      effectivityDate: "January 15, 2026",
      status: "Active",
      lastUpdated: "2 days ago"
    },
    {
      id: 2,
      name: "Research Ethics Guidelines",
      category: "Guideline",
      office: "Research Office",
      version: "2.1",
      effectivityDate: "March 1, 2026",
      status: "Active",
      lastUpdated: "1 week ago"
    },
    {
      id: 3,
      name: "Faculty Manual",
      category: "Policy",
      office: "Human Resources",
      version: "4.0",
      effectivityDate: "June 1, 2025",
      status: "Active",
      lastUpdated: "3 weeks ago"
    },
    {
      id: 4,
      name: "Grading System Procedure",
      category: "Procedure",
      office: "Academic Affairs",
      version: "1.5",
      effectivityDate: "August 1, 2025",
      status: "Active",
      lastUpdated: "1 month ago"
    },
    {
      id: 5,
      name: "CHED CMO No. 46 s.2012",
      category: "Memorandum",
      office: "Quality Assurance",
      version: "1.0",
      effectivityDate: "May 20, 2012",
      status: "Reference",
      lastUpdated: "6 months ago"
    },
  ];

  const getAccessBadge = () => {
    if (canUpload && canEdit) {
      return { label: "Full Access", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle };
    } else if (canEdit) {
      return { label: "Limited Access", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Edit };
    } else {
      return { label: "View Only", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Eye };
    }
  };

  const accessBadge = getAccessBadge();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2937]">Knowledge Repository</h1>
          <p className="text-sm text-[#6B7280] mt-1">Centralized storage for institutional documents and policies</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${accessBadge.color}`}>
            <accessBadge.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{accessBadge.label}</span>
          </div>
          {canUpload && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span className="text-sm font-medium">Upload Document</span>
            </button>
          )}
        </div>
      </div>

      {/* Read-only notice for Students */}
      {!canUpload && !canEdit && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">View-Only Access</p>
              <p className="text-sm text-blue-700 mt-1">
                You can view and download documents, but cannot upload or edit them.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search by document name, keyword, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="policy">Policies</option>
              <option value="procedure">Procedures</option>
              <option value="guideline">Guidelines</option>
              <option value="memorandum">Memoranda</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-[#6B7280] hover:bg-[#F5F7FA] rounded-lg transition-colors border border-[#E5E7EB]">
            <Filter className="h-4 w-4" />
            More Filters
          </button>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">Office: All</span>
            <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-200">Status: Active</span>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1D6FA3] text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Document Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Office</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Version</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Effectivity</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-[#F5F7FA] transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-[#1F2937]">{doc.name}</div>
                      <div className="text-xs text-[#6B7280]">{doc.lastUpdated}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#1F2937]">{doc.category}</td>
                  <td className="px-6 py-4 text-sm text-[#1F2937]">{doc.office}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">
                      v{doc.version}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6B7280]">{doc.effectivityDate}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                        doc.status === "Active"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        className="p-2 text-[#6B7280] hover:text-[#1D6FA3] hover:bg-blue-50 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-[#6B7280] hover:text-[#1D6FA3] hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {canEdit && (
                        <button
                          className="p-2 text-[#6B7280] hover:text-[#10B981] hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        className="p-2 text-[#6B7280] hover:text-[#FFC107] hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Version History"
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                      {canDelete && (
                        <button
                          className="p-2 text-[#6B7280] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors"
                          title="Archive"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[#E5E7EB]">
              <h2 className="text-xl font-semibold text-[#1F2937]">Upload New Document</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">Document Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
                    placeholder="Enter document name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-2">Category</label>
                    <select className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent">
                      <option>Policy</option>
                      <option>Procedure</option>
                      <option>Guideline</option>
                      <option>Memorandum</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-2">Office</label>
                    <select className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent">
                      <option>Academic Affairs</option>
                      <option>Student Affairs</option>
                      <option>Research Office</option>
                      <option>Quality Assurance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-2">Version</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
                      placeholder="e.g., 1.0, 2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-2">Effectivity Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">Upload File</label>
                  <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-8 text-center hover:border-[#1D6FA3] hover:bg-[#F5F7FA] transition-all cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-[#6B7280]" />
                    <p className="text-sm text-[#1F2937] mb-2 font-medium">Drag and drop your file here, or click to browse</p>
                    <p className="text-xs text-[#6B7280]">Supported formats: PDF, DOCX, DOC (Max 10MB)</p>
                    <input type="file" className="hidden" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#E5E7EB] bg-white">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-2.5 text-sm font-medium text-[#6B7280] hover:bg-[#F5F7FA] rounded-lg transition-colors border border-[#E5E7EB]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    alert("Document uploaded successfully!");
                  }}
                  className="px-6 py-2.5 text-sm font-medium bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] transition-colors"
                >
                  Upload Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}