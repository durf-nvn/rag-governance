import { useState, useEffect, useRef } from "react";
import { Search, CheckCircle, AlertCircle, FileText, Award, Target, Upload, ChevronDown, X, Loader2, ArrowLeft, Archive, Eye, ShieldAlert } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import axios from "axios";

export function AccreditationSupport() {
  const [selectedProgram, setSelectedProgram] = useState("BSIT");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // --- TOAST NOTIFICATIONS ---
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- UPLOAD MODAL STATE ---
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTargetArea, setUploadTargetArea] = useState<any>(null);
  const [uploadForm, setUploadForm] = useState({ fileName: "" });
  const [isUploading, setIsUploading] = useState(false);

  // --- DELETE MODAL STATE ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- REAL FILE UPLOAD STATE ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DRILL-DOWN STATE ---
  const [expandedArea, setExpandedArea] = useState<any>(null);
  const [areaDetails, setAreaDetails] = useState({ requirements: [], uploadedFiles: [] });
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [currentData, setCurrentData] = useState<any>({
    level: "Loading...",
    overall: 0,
    gaps: 0,
    evidence: 0,
    recentEvidence: [],
    areas: []
  });

  // --- THE FIX: MASTER REFRESH FUNCTION ---
  // This ensures both the Grid and the Drill-Down Header sync perfectly
  const refreshData = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/accreditation-status/${selectedProgram}`);
      setCurrentData(response.data);

      if (expandedArea) {
        const detailsRes = await axios.get(`http://localhost:8000/accreditation-details/${selectedProgram}/${expandedArea.code}`);
        setAreaDetails(detailsRes.data);
        
        // Update the expandedArea object itself so the Header stats change immediately
        const updatedArea = response.data.areas.find((a: any) => a.code === expandedArea.code);
        if (updatedArea) setExpandedArea(updatedArea);
      }
    } catch (error) {
      console.error("Failed to refresh data", error);
    }
  };

  const fetchAccreditationData = async () => {
    setIsLoading(true);
    await refreshData();
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAccreditationData();
    setExpandedArea(null);
  }, [selectedProgram]);

  const handleViewDetails = async (area: any) => {
    setExpandedArea(area);
    setIsLoadingDetails(true);
    try {
      const response = await axios.get(`http://localhost:8000/accreditation-details/${selectedProgram}/${area.code}`);
      setAreaDetails(response.data);
    } catch (error) {
      console.error("Failed to fetch area details:", error);
      showToast("Failed to load area details.", "error");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const filteredAreas = currentData.areas.filter((area: any) => 
    area.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    area.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
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

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.fileName || !selectedFile) {
      showToast("Please provide a name and select a file.", "error");
      return;
    }
    
    setIsUploading(true);
    const submitData = new FormData();
    submitData.append("file", selectedFile);
    submitData.append("document_name", uploadForm.fileName);
    submitData.append("program", selectedProgram);
    submitData.append("area_code", uploadTargetArea.code);

    try {
      await axios.post("http://localhost:8000/upload-accreditation-evidence", submitData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      await refreshData();
      
      setUploadForm({ fileName: "" });
      setSelectedFile(null); 
      setShowUploadModal(false);
      showToast("Evidence successfully uploaded and linked!", "success");
      
    } catch (error) {
      console.error("Upload failed:", error);
      showToast("Failed to save evidence.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const openUploadModal = (area: any) => {
    setUploadTargetArea(area);
    setShowUploadModal(true);
    setSelectedFile(null); 
  };

  const openDeleteModal = (docName: string) => {
    setDocToDelete(docName);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`http://localhost:8000/documents/${encodeURIComponent(docToDelete)}`);
      await refreshData();
      setShowDeleteModal(false);
      setDocToDelete(null);
      showToast("Document archived successfully!", "success");
    } catch (error) {
      console.error("Failed to archive:", error);
      showToast("Failed to archive document.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && currentData.areas.length === 0) {
    return <div className="flex justify-center items-center h-64 text-gray-500"><Loader2 className="h-8 w-8 animate-spin text-[#1D6FA3]" /></div>;
  }

  return (
    <div className="space-y-6 relative">
      
      {/* --- TOAST NOTIFICATION --- */}
      {toast && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-bold z-[100] transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${
          toast.type === 'success' ? 'bg-[#E6F7ED] text-[#006837] border-2 border-[#006837]/20' : 'bg-red-50 text-red-700 border-2 border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {toast.message}
        </div>
      )}

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
          
          {/* Top Context Bar */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Program Evaluation Context</h2>
              <p className="text-sm text-gray-500">Tracking compliance templates per degree program.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-64">
                <select 
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="appearance-none w-full px-4 py-3 bg-[#F5F7FA] border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#CE0000] pr-10 cursor-pointer"
                >
                  <option value="BEED">Bachelor of Elementary Education</option>
                  <option value="BSED_MATH">BSEd major in Mathematics</option>
                  <option value="BSED_ENGLISH">BSEd major in English</option>
                  <option value="BTLED_HE">BTLEd major in Home Economics</option>
                  <option value="AB_ELS">BA in English Language Studies</option>
                  <option value="AB_LIT">BA in Literature</option>
                  <option value="AB_PSYCH">BA in Psychology</option>
                  <option value="BSIE">BS in Industrial Engineering</option>
                  <option value="BSIT">BS in Information Technology</option>
                  <option value="BIT_AUTO">BIT major in Automotive Technology</option>
                  <option value="BIT_COMP">BIT major in Computer Technology</option>
                  <option value="BIT_DRAFT">BIT major in Drafting Technology</option>
                  <option value="BIT_ELEC">BIT major in Electronics Technology</option>
                  <option value="BIT_GARM">BIT major in Garments Technology</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>

              <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#D4AF37] to-[#FDB913] text-white rounded-lg shadow-md border border-[#D4AF37]/50 w-full sm:w-auto justify-center">
                <Award className="h-5 w-5 drop-shadow-sm" />
                <span className="font-semibold tracking-wide text-shadow-sm">{currentData.level}</span>
              </div>
            </div>
          </div>

          {!expandedArea ? (
            <>
              {/* Stats Row */}
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

              {/* Areas Grid */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <h2 className="text-xl font-semibold text-[#CE0000]">AACCUP Area Compliance</h2>
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search areas..."
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913] text-sm"
                    />
                  </div>
                </div>
                
                {filteredAreas.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <p className="text-gray-500 font-medium">No requirements template found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredAreas.map((area: any) => (
                      <div 
                        key={area.id} 
                        onClick={() => handleViewDetails(area)}
                        className="border border-gray-200 rounded-xl p-5 hover:border-[#1D6FA3] hover:shadow-lg transition-all duration-200 flex flex-col justify-between bg-white group cursor-pointer active:scale-[0.99]"
                      >
                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div className="pr-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1 leading-tight group-hover:text-[#1D6FA3] transition-colors">
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
                          
                          <div className="flex items-center gap-1.5 text-sm font-bold text-[#1D6FA3] group-hover:text-[#0B3C5D]">
                            View Details 
                            <span className="transform transition-transform duration-300 group-hover:translate-x-1">→</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              
              {/* Header Navigation */}
              <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-[#1D6FA3]">
                <button 
                  onClick={() => setExpandedArea(null)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1D6FA3] font-medium mb-4 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Area Overview
                </button>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{expandedArea.code}: {expandedArea.title}</h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><FileText className="h-4 w-4"/> {expandedArea.evidenceCount} / {expandedArea.required} Requirements Met</span>
                      <span className="flex items-center gap-1"><AlertCircle className="h-4 w-4 text-[#CE0000]"/> {expandedArea.gaps} Gaps Remaining</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Area Compliance</p>
                    <div className={`text-4xl font-bold ${expandedArea.compliance === 100 ? "text-[#006837]" : "text-[#1D6FA3]"}`}>
                      {expandedArea.compliance}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1: The Checklist */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-[#F9FAFB] border-b border-gray-200">
                      <h3 className="font-bold text-gray-900">Required Documents</h3>
                    </div>
                    
                    {isLoadingDetails ? (
                       <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#1D6FA3]" /></div>
                    ) : (
                      <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                        {areaDetails.requirements.length === 0 ? (
                           <p className="p-4 text-sm text-gray-500 italic">No specific requirements templated yet.</p>
                        ) : (
                          areaDetails.requirements.map((req: any, index: number) => (
                            <div key={index} className="p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                              <div className="mt-0.5">
                                {req.is_met ? (
                                  <CheckCircle className="h-5 w-5 text-[#006837]" />
                                ) : (
                                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                )}
                              </div>
                              <p className={`text-sm ${req.is_met ? "text-gray-500 line-through decoration-gray-300" : "text-gray-900 font-medium"}`}>
                                {req.text}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: Uploaded Evidence Table */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                    <div className="p-4 bg-[#F9FAFB] border-b border-gray-200 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900">Uploaded Evidence</h3>
                      <button 
                        onClick={() => openUploadModal(expandedArea)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] transition-all text-xs font-semibold cursor-pointer shadow-sm active:scale-95"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload File
                      </button>
                    </div>
                    
                    {isLoadingDetails ? (
                       <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#1D6FA3]" /></div>
                    ) : (
                      <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left whitespace-nowrap">
                          <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase font-semibold">
                            <tr>
                              <th className="px-4 py-3">Document Name</th>
                              <th className="px-4 py-3">Upload Date</th>
                              <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {areaDetails.uploadedFiles.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                                  No evidence files uploaded for this area yet.
                                </td>
                              </tr>
                            ) : (
                              areaDetails.uploadedFiles.map((file: any, index: number) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-[#1D6FA3]" />
                                      <span className="text-sm font-medium text-gray-900">{file.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">{file.date}</td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      {/* UPDATED TO USE THE EYE ICON FOR VIEW */}
                                      <button 
                                        onClick={() => window.open(file.url, "_blank")}
                                        className="p-1.5 text-gray-400 hover:text-[#1D6FA3] transition-colors cursor-pointer" 
                                        title="View File"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </button>
                                      {/* WIRED TO THE NEW DELETE MODAL */}
                                      <button 
                                        onClick={() => openDeleteModal(file.name)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors cursor-pointer" 
                                        title="Remove Evidence"
                                      >
                                        <Archive className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
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

      {/* --- UPLOAD MODAL --- */}
      {showUploadModal && uploadTargetArea && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F5F7FA]">
              <div>
                <h2 className="text-xl font-semibold text-[#1F2937]">Upload Accreditation Evidence</h2>
                <p className="text-sm text-gray-500 mt-1">Tagging evidence for {selectedProgram}</p>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer">
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
                      <p className="text-sm font-medium text-gray-700">Click to browse or drag your PDF, Word, or TXT here</p>
                      <p className="text-xs text-gray-500 mt-1">Maximum file size: 50MB</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept=".pdf,.docx,.txt"
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
                  className="flex-1 px-5 py-3 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadForm.fileName || !selectedFile || isUploading}
                  className="flex-1 px-5 py-3 text-sm font-semibold bg-[#006837] text-white rounded-xl hover:bg-[#00542c] disabled:opacity-50 transition-colors flex justify-center items-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  {isUploading ? <><Loader2 className="h-4 w-4 animate-spin"/> Processing...</> : "Upload & Verify"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- NEW DELETE MODAL --- */}
      {showDeleteModal && docToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-red-100 bg-red-50 flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-bold text-red-700">Archive Evidence</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-gray-900">"{docToDelete}"</span> from this accreditation area?
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                This action will archive the file. It will no longer count towards your compliance progress, but it will remain in the database for auditing purposes.
              </p>
            </div>

            <div className="p-6 border-t border-gray-100 bg-[#F9FAFB] flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                disabled={isDeleting}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete} 
                disabled={isDeleting}
                className="px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
              >
                {isDeleting ? <><Loader2 className="h-4 w-4 animate-spin"/> Archiving...</> : "Yes, Archive Evidence"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}