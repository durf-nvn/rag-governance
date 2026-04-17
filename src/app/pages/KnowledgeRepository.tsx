import { useState, useRef, useEffect } from "react"
import { Search, Filter, Upload, Download, Edit, Archive, Clock, Eye, CheckCircle, FileText } from "lucide-react"
import axios from "axios"
import { useRole } from "../contexts/RoleContext"

export function KnowledgeRepository() {
  const { userRole } = useRole()
  const currentRole = userRole || "STUDENT"

  // Explicitly allow both Admin and Faculty to upload/edit
  const canUpload = ["ADMIN", "FACULTY"].includes(currentRole)
  const canEdit = ["ADMIN", "FACULTY"].includes(currentRole)
  const canDelete = currentRole === "ADMIN"

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "Policy",
    office: "Academic Affairs",
    version: "",
    effectivityDate: ""
  })

  // File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    const loadDocs = async () => {
      const res = await axios.get("http://localhost:8000/documents");
      setDocuments(res.data);
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

  // Handle Form Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // API Upload Function
  const handleUploadSubmit = async () => {
    if (!selectedFile || !formData.name || !formData.version || !formData.effectivityDate) {
      alert("Please fill out all fields and select a file.")
      return
    }

    setIsUploading(true)
    
    // Bundle the file AND the text fields together
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
      
      // Reset Modal
      setShowUploadModal(false)
      setSelectedFile(null)
      setFormData({ name: "", category: "Policy", office: "Academic Affairs", version: "", effectivityDate: "" })
      
    } catch (error) {
      alert("Upload failed. Please check your connection.")
    } finally {
      setIsUploading(false)
    }
  }

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

      {/* Documents Table */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1D6FA3] text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Document Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Office</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-[#F5F7FA]">
                  <td className="px-6 py-4 text-sm font-medium text-[#1F2937]">{doc.name}</td>
                  <td className="px-6 py-4 text-sm text-[#1F2937]">{doc.category}</td>
                  <td className="px-6 py-4 text-sm text-[#1F2937]">{doc.office}</td>
                  <td className="px-6 py-4">
                    <button className="p-2 text-[#6B7280] hover:text-[#1D6FA3]"><Eye className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal with Full Form */}
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
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]"
                    placeholder="Enter document name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-2">Version</label>
                    <input
                      type="text"
                      name="version"
                      value={formData.version}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]"
                      placeholder="e.g., 1.0, 2.5"
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
                      isDragging ? "border-[#1D6FA3] bg-[#E3F2FD]" : "border-[#E5E7EB] hover:border-[#1D6FA3] hover:bg-[#F5F7FA]"
                    }`}
                  >
                    {selectedFile ? (
                      <div className="flex flex-col items-center">
                        <FileText className="h-12 w-12 text-[#1D6FA3] mb-2" />
                        <p className="text-sm font-medium text-[#1F2937]">{selectedFile.name}</p>
                        <p className="text-xs text-[#6B7280]">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-12 w-12 mx-auto mb-4 text-[#6B7280]" />
                        <p className="text-sm text-[#1F2937] mb-2 font-medium">Drag and drop your PDF here, or click to browse</p>
                        <p className="text-xs text-[#6B7280]">Supported format: PDF</p>
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

            <div className="p-6 border-t border-[#E5E7EB] bg-white flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setSelectedFile(null)
                }}
                className="px-6 py-2.5 text-sm font-medium text-[#6B7280] border border-[#E5E7EB] rounded-lg hover:bg-[#F5F7FA]"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={!selectedFile || isUploading}
                className="px-6 py-2.5 text-sm font-medium bg-[#1D6FA3] text-white rounded-lg disabled:opacity-50 hover:bg-[#0B3C5D]"
              >
                {isUploading ? "Extracting Data..." : "Upload Document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}