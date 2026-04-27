import { useState, useEffect, useRef } from "react";
import { Search, CheckCircle, AlertCircle, FileText, Download, Award, Target, Upload, ChevronDown, X, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import axios from "axios";

export function AccreditationSupport() {
  const [selectedProgram, setSelectedProgram] = useState("BSIT");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // --- UPLOAD MODAL STATE ---
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTargetArea, setUploadTargetArea] = useState<any>(null);
  const [uploadForm, setUploadForm] = useState({ fileName: "" });
  const [isUploading, setIsUploading] = useState(false);

  // --- NEW: REAL FILE UPLOAD STATE ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentData, setCurrentData] = useState<any>({
    level: "Loading...",
    overall: 0,
    gaps: 0,
    evidence: 0,
    recentEvidence: [],
    areas: []
  });

  const fetchAccreditationData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/accreditation-status/${selectedProgram}`);
      setCurrentData(response.data);
    } catch (error) {
      console.error("Failed to fetch accreditation data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccreditationData();
  }, [selectedProgram]);

  const filteredAreas = currentData.areas.filter((area: any) => 
    area.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    area.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- NEW: DRAG AND DROP HANDLERS ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // --- UPDATED: SENDING REAL FILES ---
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.fileName || !selectedFile) {
      alert("Please provide a name and select a file.");
      return;
    }
    
    setIsUploading(true);

    // Using FormData because we are sending a real physical file now
    const submitData = new FormData();
    submitData.append("file", selectedFile);
    submitData.append("document_name", uploadForm.fileName);
    submitData.append("program", selectedProgram);
    submitData.append("area_code", uploadTargetArea.code);

    try {
      await axios.post("http://localhost:8000/upload-accreditation-evidence", submitData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      await fetchAccreditationData();

      setShowUploadModal(false);
      setUploadForm({ fileName: "" });
      setSelectedFile(null); // Reset the file state
      
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to save evidence. Is the backend running?");
    } finally {
      setIsUploading(false);
    }
  };

  const openUploadModal = (area: any) => {
    setUploadTargetArea(area);
    setShowUploadModal(true);
    setSelectedFile(null); // Clear previous files when opening
  };

  if (isLoading && currentData.areas.length === 0) {
    return <div className="flex justify-center items-center h-64 text-gray-500"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 relative">
      <div>
        <h1 className="text-3xl text-gray-900 mb-2">QA & Accreditation Support</h1>
        <p className="text-gray-600">Comprehensive quality assurance tracking across AACCUP, ISO, CHED monitoring, and accreditation results</p>
      </div>

      <Tabs defaultValue="aaccup" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1">
          <TabsTrigger value="aaccup" className="data-[state=active]:bg-[#CE0000] data-[state=active]:text-white">AACCUP</TabsTrigger>
          <TabsTrigger value="iso" className="data-[state=active]:bg-[#CE0000] data-[state=active]:text-white">ISO Standards</TabsTrigger>
          <TabsTrigger value="ched" className="data-[state=active]:bg-[#CE0000] data-[state=active]:text-white">CHED Monitoring</TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:bg-[#CE0000] data-[state=active]:text-white">Accreditation Results</TabsTrigger>
        </TabsList>

        <TabsContent value="aaccup" className="space-y-6 mt-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Program Evaluation Context</h2>
              <p className="text-sm text-gray-500">Tracking compliance templates per degree program.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-64">
                <select 
                  value={selectedProgram}
                  onChange={(e) => {
                    setSelectedProgram(e.target.value);
                    setSearchQuery(""); 
                  }}
                  className="appearance-none w-full px-4 py-3 bg-[#F5F7FA] border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#CE0000] pr-10 cursor-pointer"
                >
                  <option value="BSIT">BS Information Technology</option>
                  <option value="BSCE">BS Civil Engineering</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>

              <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#D4AF37] to-[#FDB913] text-white rounded-lg shadow-md border border-[#D4AF37]/50 w-full sm:w-auto justify-center">
                <Award className="h-5 w-5 drop-shadow-sm" />
                <span className="font-semibold tracking-wide text-shadow-sm">{currentData.level}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-[#006837]">
              <h3 className="text-4xl font-semibold text-[#006837] mb-2">{currentData.overall}%</h3>
              <p className="text-gray-600 text-sm">Overall Compliance</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-[#CE0000]">
              <h3 className="text-4xl font-semibold text-[#CE0000] mb-2">{currentData.gaps}</h3>
              <p className="text-gray-600 text-sm">Total Gaps Identified</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-[#1D6FA3]">
              <h3 className="text-4xl font-semibold text-[#1D6FA3] mb-2">{currentData.evidence}</h3>
              <p className="text-gray-600 text-sm">Evidence Documents</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-[#D4AF37]">
              <h3 className="text-4xl font-semibold text-[#D4AF37] mb-2">{currentData.areas.length}</h3>
              <p className="text-gray-600 text-sm">Active Areas Monitored</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
              <h2 className="text-xl font-semibold text-[#CE0000]">Evidence Locator</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search areas by keyword..."
                className="w-full pl-12 pr-4 py-4 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FDB913] text-gray-900 transition-all"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6 text-[#CE0000]">AACCUP Area Compliance</h2>
            
            {filteredAreas.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-500 font-medium">No requirements template found.</p>
                <p className="text-sm text-gray-400 mt-1">Make sure the database template is configured for this program.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredAreas.map((area: any) => (
                  <div key={area.id} className="border border-gray-200 rounded-xl p-5 hover:border-[#D4AF37] hover:shadow-md transition-all flex flex-col justify-between bg-white">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="pr-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1 leading-tight">
                            {area.code}: {area.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                            {area.compliance === 100 ? (
                              <CheckCircle className="h-4 w-4 text-[#006837]" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-[#CE0000]" />
                            )}
                            <span className={`text-sm font-medium ${area.compliance === 100 ? "text-[#006837]" : "text-[#CE0000]"}`}>
                              {area.gaps > 0 ? `${area.gaps} Missing Requirements` : "Fully Compliant"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-semibold ${area.compliance === 100 ? "text-[#006837]" : "text-[#CE0000]"}`}>
                            {area.compliance}%
                          </div>
                        </div>
                      </div>

                      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            area.compliance >= 85 ? "bg-[#006837]" : area.compliance >= 50 ? "bg-[#FDB913]" : "bg-[#CE0000]"
                          }`}
                          style={{ width: `${area.compliance}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{area.evidenceCount} / {area.required} Uploaded</span>
                      </div>
                      
                      <button 
                        onClick={() => openUploadModal(area)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1D6FA3]/10 text-[#1D6FA3] rounded-lg hover:bg-[#1D6FA3] hover:text-white transition-all text-sm font-semibold"
                      >
                        <Upload className="h-4 w-4" />
                        Add Evidence
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-[#CE0000]">Recent Evidence Log</h2>
            <div className="space-y-3">
              {currentData.recentEvidence.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">No evidence uploaded yet.</div>
              ) : (
                currentData.recentEvidence.map((evidence: any, index: number) => (
                  <div key={index} className="flex items-start justify-between p-4 border border-gray-100 bg-[#F5F7FA] rounded-xl hover:border-[#1D6FA3]/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <FileText className="h-6 w-6 text-[#1D6FA3]" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">{evidence.name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{evidence.date}</span>
                          <span>•</span>
                          <span className="text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full text-xs font-medium">{evidence.area}</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-[#1D6FA3] transition-colors bg-white shadow-sm rounded-lg hover:shadow-md">
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="iso" className="space-y-6 mt-6">
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
             <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
             <h3 className="text-lg font-semibold text-gray-900 mb-2">ISO Standards Module</h3>
             <p className="text-gray-500">ISO institutional tracking will be available in Phase 2 deployment.</p>
          </div>
        </TabsContent>
        <TabsContent value="ched" className="space-y-6 mt-6">
           <div className="bg-white rounded-xl shadow-sm p-12 text-center">
             <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
             <h3 className="text-lg font-semibold text-gray-900 mb-2">CHED Monitoring Module</h3>
             <p className="text-gray-500">CHED reporting and submissions will be available in Phase 2 deployment.</p>
          </div>
        </TabsContent>
        <TabsContent value="results" className="space-y-6 mt-6">
           <div className="bg-white rounded-xl shadow-sm p-12 text-center">
             <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
             <h3 className="text-lg font-semibold text-gray-900 mb-2">Accreditation Results Module</h3>
             <p className="text-gray-500">Historical accreditation results viewing will be available in Phase 2 deployment.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* --- UPDATED SMART UPLOAD MODAL --- */}
      {showUploadModal && uploadTargetArea && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F5F7FA]">
              <div>
                <h2 className="text-xl font-semibold text-[#1F2937]">Upload Accreditation Evidence</h2>
                <p className="text-sm text-gray-500 mt-1">Tagging evidence for {selectedProgram}</p>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Target Area (Locked)</label>
                  <div className="text-sm font-medium text-[#1D6FA3]">{uploadTargetArea.code}</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Category (Locked)</label>
                  <div className="text-sm font-medium text-[#1D6FA3]">Accreditation Evidence</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Document Name</label>
                <input
                  type="text"
                  required
                  value={uploadForm.fileName}
                  onChange={(e) => setUploadForm({...uploadForm, fileName: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] transition-all"
                  placeholder="e.g., Faculty Credentials Summary 2026.pdf"
                />
              </div>

              {/* REAL DRAG AND DROP ZONE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File Upload</label>
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    isDragging ? "border-[#1D6FA3] bg-[#E3F2FD]" : "border-gray-300 hover:border-[#1D6FA3] bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <FileText className="h-10 w-10 text-[#1D6FA3] mb-3" />
                      <p className="text-sm font-semibold text-[#1F2937]">{selectedFile.name}</p>
                      <p className="text-xs text-[#6B7280] mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-700">Click to browse or drag PDF here</p>
                      <p className="text-xs text-gray-500 mt-1">Maximum file size: 50MB</p>
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

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-5 py-3 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadForm.fileName || !selectedFile || isUploading}
                  className="flex-1 px-5 py-3 text-sm font-semibold bg-[#006837] text-white rounded-xl hover:bg-[#00542c] disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                >
                  {isUploading ? <><Loader2 className="h-4 w-4 animate-spin"/> Processing...</> : "Upload & Verify"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}