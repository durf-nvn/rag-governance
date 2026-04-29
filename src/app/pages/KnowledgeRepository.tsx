import { useState, useRef, useEffect } from "react"
import { Search, Filter, Upload, Download, Edit, Archive, Clock, Eye, CheckCircle, FileText, UploadCloud, X, Loader2 } from "lucide-react"
import axios from "axios"
import { useRole } from "../contexts/RoleContext"

export function KnowledgeRepository() {
  const { userRole } = useRole()
  const currentRole = userRole || "STUDENT"

  const canUpload = ["ADMIN", "FACULTY"].includes(currentRole)
  const canEdit = ["ADMIN", "FACULTY"].includes(currentRole)
  const canDelete = currentRole === "ADMIN"

  const [documents, setDocuments] = useState<any[]>([])
  
  // Modals State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDocName, setEditingDocName] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [docToDelete, setDocToDelete] = useState<any>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  // --- NEW: UPDATE VERSION MODAL STATE ---
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [docToUpdate, setDocToUpdate] = useState<any>(null)
  const [updateFormData, setUpdateFormData] = useState({ version: "", effectivityDate: "" })
  const [updateFile, setUpdateFile] = useState<File | null>(null)
  const [isUpdatingVersion, setIsUpdatingVersion] = useState(false)
  const updateFileInputRef = useRef<HTMLInputElement>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedOffice, setSelectedOffice] = useState("all")

  const [formData, setFormData] = useState({
    name: "",
    category: "Policy",
    office: "Academic Affairs",
    version: "",
    effectivityDate: ""
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const res = await axios.get("http://localhost:8000/documents");
        setDocuments(res.data);
      } catch (error) {
        console.error("Failed to fetch documents", error);
      }
    };
    loadDocs();
  }, []);

  const getAccessBadge = () => {
    if (canUpload && canEdit) {
      return { label: "Full Access", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle }
    } else {
      return { label: "View Only", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Eye }
    }
  }

  const accessBadge = getAccessBadge()

  const filteredDocuments = documents.filter((doc) => {
    if (currentRole === "STUDENT" && doc.category === "Accreditation Evidence") {
      return false; 
    }
    // NEW: Hide archived documents from the main view (they will still exist in the database)
    if (doc.status === "Archived") {
      return false;
    }

    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    const matchesOffice = selectedOffice === "all" || doc.office === selectedOffice;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchLower) ||
      doc.category.toLowerCase().includes(searchLower) ||
      doc.office.toLowerCase().includes(searchLower) ||
      (doc.effectivity_date && doc.effectivity_date.toLowerCase().includes(searchLower));
    
    return matchesCategory && matchesOffice && matchesSearch;
  });

  const handleView = (doc: any) => {
    if (doc.file_url) {
      window.open(doc.file_url, "_blank");
    } else {
      alert("Document link not found! Ensure your backend is saving the Supabase Storage public URL.");
    }
  };

  const handleDownload = async (doc: any) => {
    if (!doc.file_url) {
      alert("Document link not found!");
      return;
    }
    try {
      const response = await fetch(doc.file_url);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const safeName = doc.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `${safeName}_v${doc.version || '1.0'}.pdf`; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(doc.file_url, "_blank"); 
    }
  };

  const handleEditClick = (doc: any) => {
    setFormData({
      name: doc.name,
      category: doc.category,
      office: doc.office,
      version: doc.version,
      effectivityDate: doc.effectivity_date !== "N/A" ? doc.effectivity_date : ""
    })
    setEditingDocName(doc.name)
    setShowEditModal(true)
  }

  const handleEditSubmit = async () => {
    if (!formData.name || !formData.version || !formData.effectivityDate) {
      alert("Please fill out all fields.")
      return
    }
    try {
      await axios.put("http://localhost:8000/documents/update", {
        old_name: editingDocName,
        new_name: formData.name,
        category: formData.category,
        office: formData.office,
        version: formData.version,
        effectivity_date: formData.effectivityDate
      })
      setShowEditModal(false)
      setFormData({ name: "", category: "Policy", office: "Academic Affairs", version: "", effectivityDate: "" })
      const res = await axios.get("http://localhost:8000/documents")
      setDocuments(res.data)
    } catch (error) {
      alert("Failed to update document.")
    }
  }

  const handleArchiveClick = (doc: any) => {
    setDocToDelete(doc)
    setDeleteConfirmText("")
    setShowDeleteModal(true)
  }

  const executeArchive = async () => {
    if (!docToDelete) return
    try {
      await axios.delete(`http://localhost:8000/documents/${encodeURIComponent(docToDelete.name)}`)
      setShowDeleteModal(false)
      setDocToDelete(null)
      setDeleteConfirmText("")
      const res = await axios.get("http://localhost:8000/documents")
      setDocuments(res.data)
    } catch (error) {
      alert("Failed to archive document.")
    }
  }

  // --- NEW: UPLOAD NEW VERSION HANDLERS ---
  const handleUpdateVersionClick = (doc: any) => {
    setDocToUpdate(doc)
    setUpdateFormData({ version: "", effectivityDate: "" })
    setUpdateFile(null)
    setShowUpdateModal(true)
  }

  const handleUpdateVersionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateFile || !updateFormData.version || !updateFormData.effectivityDate) {
      alert("Please provide the new file, version, and effectivity date.");
      return;
    }

    setIsUpdatingVersion(true);
    
    // We will build this backend route next!
    const submitData = new FormData();
    submitData.append("file", updateFile);
    submitData.append("old_document_name", docToUpdate.name);
    submitData.append("new_version", updateFormData.version);
    submitData.append("new_effectivity_date", updateFormData.effectivityDate);

    try {
      const response = await axios.post("http://localhost:8000/upload-new-version", submitData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setShowUpdateModal(false);
      setUpdateFile(null);
      setDocToUpdate(null);
      
      // Refresh the table to see the changes
      const res = await axios.get("http://localhost:8000/documents");
      setDocuments(res.data);
    } catch (error) {
      console.error("Failed to update version:", error);
      alert("Failed to upload the new version. Is the backend route ready?");
    } finally {
      setIsUpdatingVersion(false);
    }
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }
  
  const handleDrop = (e: React.DragEvent, isUpdateModal = false) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (isUpdateModal) setUpdateFile(e.dataTransfer.files[0]);
      else setSelectedFile(e.dataTransfer.files[0]);
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isUpdateModal = false) => {
    if (e.target.files && e.target.files.length > 0) {
      if (isUpdateModal) setUpdateFile(e.target.files[0]);
      else setSelectedFile(e.target.files[0]);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleUploadSubmit = async () => {
    if (!selectedFile || !formData.name || !formData.version || !formData.effectivityDate) {
      alert("Please fill out all fields and select a file.")
      return
    }
    setIsUploading(true)
    const submitData = new FormData()
    submitData.append("file", selectedFile)
    submitData.append("name", formData.name)
    submitData.append("category", formData.category)
    submitData.append("office", formData.office)
    submitData.append("version", formData.version)
    submitData.append("effectivity_date", formData.effectivityDate)

    try {
      const response = await axios.post("http://localhost:8000/upload-document", submitData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      setShowUploadModal(false)
      setSelectedFile(null)
      setFormData({ name: "", category: "Policy", office: "Academic Affairs", version: "", effectivityDate: "" })
      const res = await axios.get("http://localhost:8000/documents");
      setDocuments(res.data);
    } catch (error) {
      alert("Upload failed. Please check your connection.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
      
      <div className="flex-none space-y-6">
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

        <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search by document name, category, office, or date..."
                className="w-full pl-11 pr-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                className="sm:w-48 px-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] text-[#374151] cursor-pointer"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="Policy">Policy</option>
                <option value="Procedure / Guideline">Procedure / Guideline</option>
                <option value="Memorandum">Memorandum</option>
                <option value="Resolution">Resolution</option>
                <option value="Accreditation Evidence">Accreditation Evidence</option>
                <option value="Forms / Templates">Forms / Templates</option>
                <option value="Other">Other</option>
              </select>
              
              <select
                className="sm:w-48 px-4 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] text-[#374151] cursor-pointer"
                value={selectedOffice}
                onChange={(e) => setSelectedOffice(e.target.value)}
              >
                <option value="all">All Offices</option>
                <option value="Academic Affairs">Academic Affairs</option>
                <option value="Student Affairs">Student Affairs</option>
                <option value="Research Office">Research Office</option>
                <option value="Quality Assurance">Quality Assurance</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 h-auto bg-white rounded-lg border border-[#E5E7EB] shadow-sm flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 h-auto overflow-auto">
          <table className="w-full whitespace-nowrap relative">
            <thead className="bg-[#1D6FA3] text-white sticky top-0 z-20 shadow-md outline outline-1 outline-[#1D6FA3]">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Document Name</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Category</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Office</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Version</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Effectivity</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="h-auto divide-y divide-[#E5E7EB]">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-[#6B7280]">
                    No documents found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-[#1F2937]">{doc.name}</div>
                      <div className="text-[11px] text-[#6B7280] mt-0.5">Active File</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4B5563]">{doc.category}</td>
                    <td className="px-6 py-4 text-sm text-[#4B5563]">{doc.office}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-[#1D6FA3]">
                        v{doc.version}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4B5563]">
                      {doc.effectivity_date || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-50 text-green-700 border border-green-100">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => handleView(doc)} className="text-[#6B7280] hover:text-[#1D6FA3] transition-colors" title="View Document">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDownload(doc)} className="text-[#6B7280] hover:text-[#1D6FA3] transition-colors" title="Download">
                          <Download className="h-4 w-4" />
                        </button>
                        {canEdit && (
                          <>
                            {/* NEW: Upload New Version Button */}
                            <button onClick={() => handleUpdateVersionClick(doc)} className="text-[#6B7280] hover:text-[#10B981] transition-colors" title="Upload New Version">
                              <UploadCloud className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleEditClick(doc)} className="text-[#6B7280] hover:text-[#1D6FA3] transition-colors" title="Edit Metadata">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleArchiveClick(doc)} className="text-[#6B7280] hover:text-[#EF4444] transition-colors" title="Archive Document">
                              <Archive className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- NEW: UPLOAD NEW VERSION MODAL --- */}
      {showUpdateModal && docToUpdate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-xl w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F5F7FA]">
              <div>
                <h2 className="text-xl font-semibold text-[#1F2937]">Upload New Version</h2>
                <p className="text-sm text-[#6B7280] mt-1">Supersede the active document</p>
              </div>
              <button onClick={() => setShowUpdateModal(false)} className="p-2 hover:bg-[#E5E7EB] rounded-full transition-colors">
                <X className="h-5 w-5 text-[#6B7280]" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateVersionSubmit} className="p-6 space-y-5">
              <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Target Document (Locked)</label>
                <div className="text-sm font-semibold text-[#1D6FA3]">{docToUpdate.name}</div>
                <div className="flex items-center gap-4 mt-2 text-xs text-[#6B7280]">
                  <span>Category: {docToUpdate.category}</span>
                  <span>Office: {docToUpdate.office}</span>
                  <span>Current: v{docToUpdate.version}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">New Version Number</label>
                  <input
                    type="text"
                    required
                    value={updateFormData.version}
                    onChange={(e) => setUpdateFormData({...updateFormData, version: e.target.value})}
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]"
                    placeholder={`e.g., ${(parseFloat(docToUpdate.version) + 1.0).toFixed(1)}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">New Effectivity Date</label>
                  <input
                    type="date"
                    required
                    value={updateFormData.effectivityDate}
                    onChange={(e) => setUpdateFormData({...updateFormData, effectivityDate: e.target.value})}
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-2">Upload New File</label>
                <div 
                  onDragOver={(e) => handleDragOver(e)}
                  onDragLeave={(e) => handleDragLeave(e)}
                  onDrop={(e) => handleDrop(e, true)}
                  onClick={() => updateFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
                    isDragging ? "border-[#1D6FA3] bg-[#E3F2FD]" : "border-[#E5E7EB] hover:border-[#1D6FA3] bg-[#F9FAFB]"
                  }`}
                >
                  {updateFile ? (
                    <div className="flex flex-col items-center">
                      <FileText className="h-10 w-10 text-[#1D6FA3] mb-2" />
                      <p className="text-sm font-semibold text-[#1F2937]">{updateFile.name}</p>
                    </div>
                  ) : (
                    <div>
                      <UploadCloud className="h-8 w-8 mx-auto mb-2 text-[#9CA3AF]" />
                      <p className="text-sm text-[#1F2937] font-medium">Click or drag new PDF, Word, or TXT</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept=".pdf,.docx,.txt"
                    className="hidden" 
                    ref={updateFileInputRef}
                    onChange={(e) => handleFileSelect(e, true)}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="flex-1 px-5 py-2.5 text-sm font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!updateFile || isUpdatingVersion}
                  className="flex-1 px-5 py-2.5 text-sm font-semibold bg-[#1D6FA3] text-white rounded-lg disabled:opacity-50 hover:bg-[#0B3C5D] transition-colors flex justify-center items-center gap-2"
                >
                  {isUpdatingVersion ? <><Loader2 className="h-4 w-4 animate-spin"/> Processing...</> : "Update Version"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EXISTING MODALS (Upload, Edit, Delete) --- */}
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-[#E5E7EB]">
              <h2 className="text-xl font-semibold text-[#1F2937]">Upload New Document</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">Document Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]"
                    placeholder="Enter document name"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-2">Category</label>
                    <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]">
                      <option>Policy</option>
                      <option>Procedure / Guideline</option>
                      <option>Memorandum</option>
                      <option>Resolution</option>
                      <option>Accreditation Evidence</option>
                      <option>Forms / Templates</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-2">Office</label>
                    <select name="office" value={formData.office} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]">
                      <option>Academic Affairs</option>
                      <option>Student Affairs</option>
                      <option>Research Office</option>
                      <option>Quality Assurance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-2">Version</label>
                    <input
                      type="text"
                      name="version"
                      value={formData.version}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]"
                      placeholder="e.g., v1.0, v2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-2">Effectivity Date</label>
                    <input
                      type="date"
                      name="effectivityDate"
                      value={formData.effectivityDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">Upload File</label>
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                      isDragging ? "border-[#1D6FA3] bg-[#E3F2FD]" : "border-[#E5E7EB] hover:border-[#1D6FA3] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    {selectedFile ? (
                      <div className="flex flex-col items-center">
                        <FileText className="h-12 w-12 text-[#1D6FA3] mb-3" />
                        <p className="text-sm font-semibold text-[#1F2937]">{selectedFile.name}</p>
                        <p className="text-xs text-[#6B7280] mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-10 w-10 mx-auto mb-3 text-[#9CA3AF]" />
                        <p className="text-sm text-[#1F2937] mb-1 font-medium">Drag and drop your PDF, Word, or TXT here</p>
                        <p className="text-xs text-[#6B7280]">or click to browse from your computer</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept=".pdf,.docx,.txt"
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={(e) => handleFileSelect(e, false)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#E5E7EB] bg-[#F9FAFB] flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setSelectedFile(null)
                }}
                className="px-5 py-2.5 text-sm font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={!selectedFile || isUploading}
                className="px-5 py-2.5 text-sm font-semibold bg-[#1D6FA3] text-white rounded-lg disabled:opacity-50 hover:bg-[#0B3C5D] transition-colors flex items-center gap-2"
              >
                {isUploading ? "Uploading..." : "Upload Document"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl">
            <div className="p-6 border-b border-[#E5E7EB]">
              <h2 className="text-xl font-semibold text-[#1F2937]">Edit Document Metadata</h2>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-2">Document Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">Category</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]">
                    <option>Policy</option>
                    <option>Procedure / Guideline</option>
                    <option>Memorandum</option>
                    <option>Resolution</option>
                    <option>Accreditation Evidence</option>
                    <option>Forms / Templates</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">Office</label>
                  <select name="office" value={formData.office} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]">
                    <option>Academic Affairs</option>
                    <option>Student Affairs</option>
                    <option>Research Office</option>
                    <option>Quality Assurance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">Version</label>
                  <input
                    type="text"
                    name="version"
                    value={formData.version}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">Effectivity Date</label>
                  <input
                    type="date"
                    name="effectivityDate"
                    value={formData.effectivityDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#E5E7EB] bg-[#F9FAFB] flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2.5 text-sm font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-5 py-2.5 text-sm font-semibold bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Type-to-Confirm Delete Modal */}
      {showDeleteModal && docToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[#E5E7EB] bg-red-50">
              <h2 className="text-xl font-semibold text-red-700 flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Archive Document
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#4B5563]">
                This action will permanently remove this document from the AI's knowledge base. It cannot be undone.
              </p>
              
              <div className="bg-[#F9FAFB] p-3 rounded-md border border-[#E5E7EB]">
                <p className="text-xs text-[#6B7280] mb-1">Document to archive:</p>
                <p className="text-sm font-bold text-[#1F2937]">{docToDelete.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-2">
                  Please type <span className="font-bold select-none">{docToDelete.name}</span> to confirm.
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Type document name here..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-[#E5E7EB] bg-[#F9FAFB] flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDocToDelete(null)
                }}
                className="px-5 py-2.5 text-sm font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeArchive}
                disabled={deleteConfirmText !== docToDelete.name}
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors disabled:bg-red-200 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700"
              >
                Archive Document
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}