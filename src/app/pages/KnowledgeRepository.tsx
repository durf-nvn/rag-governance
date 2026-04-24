import { useState, useRef, useEffect } from "react"
import { Search, Filter, Upload, Download, Edit, Archive, Clock, Eye, CheckCircle, FileText } from "lucide-react"
import axios from "axios"
import { useRole } from "../contexts/RoleContext"

export function KnowledgeRepository() {
  const { userRole } = useRole()
  const currentRole = userRole || "STUDENT"

  const canUpload = ["ADMIN", "FACULTY"].includes(currentRole)
  const canEdit = ["ADMIN", "FACULTY"].includes(currentRole)
  const canDelete = currentRole === "ADMIN"

  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDocName, setEditingDocName] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedOffice, setSelectedOffice] = useState("all") // NEW: Office Filter State

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

  const [documents, setDocuments] = useState<any[]>([]);

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

  // --- SUPERCHARGED FILTERING LOGIC ---
  const filteredDocuments = documents.filter((doc) => {
    // 1. Check Category Dropdown
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    
    // 2. Check Office Dropdown
    const matchesOffice = selectedOffice === "all" || doc.office === selectedOffice;
    
    // 3. Deep Search (Checks Name, Category, Office, and Date)
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchLower) ||
      doc.category.toLowerCase().includes(searchLower) ||
      doc.office.toLowerCase().includes(searchLower) ||
      (doc.effectivity_date && doc.effectivity_date.toLowerCase().includes(searchLower));
    
    return matchesCategory && matchesOffice && matchesSearch;
  });

  // --- ACTION HANDLERS ---
  const handleView = (doc: any) => {
    if (doc.file_url) {
      // Opens the PDF in a new browser tab
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
      // 1. Fetch the actual file data from Supabase
      const response = await fetch(doc.file_url);
      
      if (!response.ok) throw new Error("Network response was not ok");
      
      // 2. Convert the data into a local Blob
      const blob = await response.blob();
      
      // 3. Create a temporary local URL for this blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // 4. Force the download using the local URL
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Clean up the document name so it saves nicely
      const safeName = doc.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `${safeName}_v${doc.version || '1.0'}.pdf`; 
      
      document.body.appendChild(link);
      link.click();
      
      // 5. Clean up the temporary URL and element
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: If the fetch fails (sometimes due to strict CORS rules), 
      // just open it in a new tab like it used to.
      window.open(doc.file_url, "_blank"); 
    }
  };

  const handleEditClick = (doc: any) => {
    // Pre-fill the form with the document's current data
    setFormData({
      name: doc.name,
      category: doc.category,
      office: doc.office,
      version: doc.version,
      effectivityDate: doc.effectivity_date !== "N/A" ? doc.effectivity_date : ""
    })
    setEditingDocName(doc.name) // Save the original name so the backend knows which one to update
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
      alert("Document updated successfully!")
      setShowEditModal(false)
      setFormData({ name: "", category: "Policy", office: "Academic Affairs", version: "", effectivityDate: "" })
      
      // Refresh table
      const res = await axios.get("http://localhost:8000/documents")
      setDocuments(res.data)
    } catch (error) {
      alert("Failed to update document.")
    }
  }

  const handleArchive = async (doc: any) => {
    // Native browser confirmation popup
    if (window.confirm(`Are you sure you want to archive "${doc.name}"? This will permanently remove it from the AI's knowledge base.`)) {
      try {
        await axios.delete(`http://localhost:8000/documents/${encodeURIComponent(doc.name)}`)
        alert("Document successfully archived!")
        
        // Refresh table
        const res = await axios.get("http://localhost:8000/documents")
        setDocuments(res.data)
      } catch (error) {
        alert("Failed to archive document.")
      }
    }
  }

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
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
      alert(response.data.message)
      
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
      
      {/* FIXED TOP SECTION (Title + Filters) */}
      <div className="flex-none space-y-6">
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

        {/* Search and Filter Bar */}
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
                <option value="Procedure">Procedure</option>
                <option value="Guideline">Guideline</option>
                <option value="Memorandum">Memorandum</option>
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

      {/* SCROLLABLE TABLE SECTION */}
      <div className="flex-1 h-auto bg-white rounded-lg border border-[#E5E7EB] shadow-sm flex flex-col min-h-0 overflow-hidden">
        {/* This inner div handles the vertical scrolling! */}
        <div className="flex-1 h-auto overflow-auto">
          <table className="w-full whitespace-nowrap relative">
            
            {/* STICKY TABLE HEADER */}
            {/* Added: sticky, top-0, z-20, and a shadow-md so the rows slide beautifully underneath */}
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
                      <div className="text-[11px] text-[#6B7280] mt-0.5">Uploaded recently</div>
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
                        <button 
                          onClick={() => handleView(doc)}
                          className="text-[#6B7280] hover:text-[#1D6FA3] transition-colors" 
                          title="View Document"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        <button 
                          onClick={() => handleDownload(doc)}
                          className="text-[#6B7280] hover:text-[#1D6FA3] transition-colors" 
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button 
                              onClick={() => handleEditClick(doc)}
                              className="text-[#6B7280] hover:text-[#1D6FA3] transition-colors" 
                              title="Edit Metadata"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleArchive(doc)}
                              className="text-[#6B7280] hover:text-[#EF4444] transition-colors" 
                              title="Archive Document"
                            >
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {/* ... Your existing modal code remains exactly the same ... */}
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
                      <option>Procedure</option>
                      <option>Guideline</option>
                      <option>Memorandum</option>
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
                    onDrop={handleDrop}
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
                        <p className="text-sm text-[#1F2937] mb-1 font-medium">Drag and drop your PDF here</p>
                        <p className="text-xs text-[#6B7280]">or click to browse from your computer</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept=".pdf"
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileSelect}
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
                    <option>Procedure</option>
                    <option>Guideline</option>
                    <option>Memorandum</option>
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
      
    </div>
  )
}