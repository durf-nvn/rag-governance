import { useState, useEffect, useRef } from "react";
import { Search, CheckCircle, CheckCircle2, AlertCircle, FileText, Award, Target, Upload, ChevronDown, ChevronUp, X, Loader2, ArrowLeft, Archive, Eye, ShieldAlert, Lock, Check, FileCheck, MessageSquareWarning, Clock, BarChart2, Calendar, Plus, Edit, Trash2, Download, ExternalLink, FileBadge, History, TrendingUp, Building } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import axios from "axios";

export function AccreditationSupport() {
  const userRole = sessionStorage.getItem('userRole') || 'STUDENT';
  const userDept = sessionStorage.getItem('userDepartment') || 'BSIT';
  const userName = sessionStorage.getItem('userName') || 'Faculty User';

  const [selectedProgram, setSelectedProgram] = useState(userRole === 'FACULTY' ? userDept : "BSIT");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [activeTab, setActiveTab] = useState("aaccup");

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTargetArea, setUploadTargetArea] = useState<any>(null);
  const [uploadForm, setUploadForm] = useState({ fileName: "", requirementTarget: "" });
  const [isUploading, setIsUploading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expandedArea, setExpandedArea] = useState<any>(null);
  const [areaDetails, setAreaDetails] = useState({ requirements: [], uploadedFiles: [] });
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [isAdminQueueOpen, setIsAdminQueueOpen] = useState(true);
  const [pendingDocs, setPendingDocs] = useState<any[]>([]); // Handles AACCUP
  const [isReviewing, setIsReviewing] = useState(false);
  
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackDoc, setFeedbackDoc] = useState<any>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const [currentData, setCurrentData] = useState<any>({
    level: "Loading...", overall: 0, gaps: 0, evidence: 0, areas: []
  });

  const [chedRequirements, setChedRequirements] = useState<any[]>([]);
  const [isLoadingChed, setIsLoadingChed] = useState(false);
  const [showChedUploadModal, setShowChedUploadModal] = useState(false);
  const [selectedChedReq, setSelectedChedReq] = useState<any>(null);
  
  // Admin specific CHED states
  const [showAddChedReqModal, setShowAddChedReqModal] = useState(false);
  const [newChedReq, setNewChedReq] = useState({ cmo_name: "", description: "" });
  const [isAddingReq, setIsAddingReq] = useState(false);
  
  // Edit CHED states
  const [showEditChedModal, setShowEditChedModal] = useState(false);
  const [editingChedReq, setEditingChedReq] = useState<any>(null);
  const [isEditingReq, setIsEditingReq] = useState(false);

  // Custom Delete Modals for CHED
  const [showDeleteChedReqModal, setShowDeleteChedReqModal] = useState(false);
  const [chedReqToDelete, setChedReqToDelete] = useState<string | null>(null);
  const [showDeleteChedEvidenceModal, setShowDeleteChedEvidenceModal] = useState(false);
  const [chedEvidenceToDelete, setChedEvidenceToDelete] = useState<any>(null);

  // --- ISO 9001:2015 QMS STATES ---
  const [isoRequirements, setIsoRequirements] = useState<any[]>([]);
  const [isLoadingIso, setIsLoadingIso] = useState(false);
  const [showIsoUploadModal, setShowIsoUploadModal] = useState(false);
  const [selectedIsoReq, setSelectedIsoReq] = useState<any>(null);
  const [isoOfficeFilter, setIsoOfficeFilter] = useState("all");

  // Add ISO Requirement States
  const [showAddIsoReqModal, setShowAddIsoReqModal] = useState(false);
  const [newIsoReq, setNewIsoReq] = useState({
    iso_clause: "Clause 6.1",
    title: "",
    description: "",
    auditee_office: "Director of Instruction (DOI) & SAO",
    risk_level: "Medium"
  });
  const [isAddingIsoReq, setIsAddingIsoReq] = useState(false);

  // Edit & Delete ISO Requirement States
  const [showEditIsoModal, setShowEditIsoModal] = useState(false);
  const [editingIsoReq, setEditingIsoReq] = useState<any>(null);
  const [isEditingIsoReq, setIsEditingIsoReq] = useState(false);
  const [showDeleteIsoReqModal, setShowDeleteIsoReqModal] = useState(false);
  const [isoReqToDelete, setIsoReqToDelete] = useState<any>(null);

  // Dynamic IQA Schedule & Days States
  const [iqaSchedule, setIqaSchedule] = useState<any>(null);
  const [showEditIqaModal, setShowEditIqaModal] = useState(false);
  const [iqaFormData, setIqaFormData] = useState({ academic_year: "" });
  const [isSavingIqa, setIsSavingIqa] = useState(false);

  const [iqaDays, setIqaDays] = useState<any[]>([]);
  const [isLoadingIqaDays, setIsLoadingIqaDays] = useState(false);
  const [showAddIqaDayModal, setShowAddIqaDayModal] = useState(false);
  const [showEditIqaDayModal, setShowEditIqaDayModal] = useState(false);
  const [showDeleteIqaDayModal, setShowDeleteIqaDayModal] = useState(false);
  const [editingIqaDay, setEditingIqaDay] = useState<any>(null);
  const [deletingIqaDay, setDeletingIqaDay] = useState<any>(null);

  const [iqaDayForm, setIqaDayForm] = useState({
    day_number: 1,
    day_date: "",
    title: "",
    scope: ""
  });
  const [isSavingIqaDay, setIsSavingIqaDay] = useState(false);

  const refreshData = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/accreditation-status/${selectedProgram}`);
      setCurrentData(response.data);

      if (expandedArea) {
        const detailsRes = await axios.get(`http://localhost:8000/accreditation-details/${selectedProgram}/${expandedArea.code}`);
        setAreaDetails(detailsRes.data);
        const updatedArea = response.data.areas.find((a: any) => a.code === expandedArea.code);
        if (updatedArea) setExpandedArea(updatedArea);
      }
      
      if (userRole === "ADMIN") fetchPendingQueue();
      fetchChedData(); 
      fetchIsoData();
      fetchIqaSchedule();
      fetchIqaDays();
      
    } catch (error) {
      console.error("Failed to refresh data", error);
    }
  };

  const fetchIqaDays = async () => {
    setIsLoadingIqaDays(true);
    try {
      const res = await axios.get("http://localhost:8000/iso/schedule-days");
      setIqaDays(res.data || []);
    } catch (error) {
      console.error("Failed to fetch IQA schedule days", error);
    } finally {
      setIsLoadingIqaDays(false);
    }
  };

  const fetchIqaSchedule = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/iso/schedule/GLOBAL`);
      setIqaSchedule(res.data);
      if (res.data) {
        setIqaFormData({
          academic_year: res.data.academic_year || "IQA Audit Cycle 2025-2026",
          day1_date: res.data.day1_date || "", day1_title: res.data.day1_title || "", day1_scope: res.data.day1_scope || "",
          day2_date: res.data.day2_date || "", day2_title: res.data.day2_title || "", day2_scope: res.data.day2_scope || "",
          day3_date: res.data.day3_date || "", day3_title: res.data.day3_title || "", day3_scope: res.data.day3_scope || ""
        });
      }
    } catch (error) {
      console.error("Failed to fetch IQA schedule", error);
    }
  };

  const fetchPendingQueue = async () => {
    try {
      const res = await axios.get("http://localhost:8000/admin/accreditation-pending");
      setPendingDocs(res.data);
    } catch (error) {
      console.error("Failed to fetch pending queue");
    }
  };

  const fetchChedData = async () => {
    setIsLoadingChed(true);
    try {
      const res = await axios.get(`http://localhost:8000/ched/requirements/${selectedProgram}`);
      setChedRequirements(res.data);
    } catch (error) {
      console.error("Failed to fetch CHED requirements");
    } finally {
      setIsLoadingChed(false);
    }
  };

  const fetchIsoData = async () => {
    setIsLoadingIso(true);
    try {
      const res = await axios.get(`http://localhost:8000/iso/requirements/GLOBAL`);
      setIsoRequirements(res.data || []);
    } catch (error) {
      console.error("Failed to fetch ISO 9001:2015 requirements");
    } finally {
      setIsLoadingIso(false);
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
      showToast("Failed to load area details.", "error");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const openUploadModal = (area: any) => {
    setUploadTargetArea(area);
    setUploadForm({ fileName: "", requirementTarget: "" });
    setSelectedFile(null);
    setShowUploadModal(true);
  };

  const openDeleteModal = (docName: string) => {
    setDocToDelete(docName);
    setShowDeleteModal(true);
  };

  const filteredAreas = currentData.areas.filter((area: any) => 
    area.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    area.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) setSelectedFile(e.dataTransfer.files[0]);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.fileName || !selectedFile) {
      showToast("Please provide a name and select a file.", "error"); return;
    }
    
    setIsUploading(true);
    const submitData = new FormData();
    submitData.append("file", selectedFile);
    submitData.append("document_name", uploadForm.fileName);
    submitData.append("program", selectedProgram);
    submitData.append("area_code", uploadTargetArea.code);
    submitData.append("requirement_target", uploadForm.requirementTarget);
    submitData.append("uploaded_by", userName);

    try {
      await axios.post("http://localhost:8000/upload-accreditation-evidence", submitData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      await refreshData();
      setUploadForm({ fileName: "", requirementTarget: "" });
      setSelectedFile(null); setShowUploadModal(false);
      showToast("Evidence uploaded! It is now pending Admin approval.", "success");
    } catch (error) {
      showToast("Failed to save evidence.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const executeDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`http://localhost:8000/documents/${encodeURIComponent(docToDelete)}`);
      await refreshData();
      setShowDeleteModal(false); setDocToDelete(null);
      showToast("Document archived successfully!", "success");
    } catch (error) {
      showToast("Failed to archive document.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewDocument = (fileUrl: string, fileName: string) => {
    axios.post("http://localhost:8000/audit/access", {
      document_name: fileName, action_type: "View", user_email: sessionStorage.getItem('userEmail'), user_role: userRole
    }).catch(() => {});
    window.open(fileUrl, "_blank");
  };

  const handleAdminReview = async (docName: string, status: "Approved" | "Needs Revision", feedbackText: string = "") => {
    setIsReviewing(true);
    try {
      await axios.post("http://localhost:8000/admin/accreditation-review", {
        document_name: docName,
        status: status,
        feedback: feedbackText
      });
      showToast(`Document marked as ${status}!`, "success");
      setShowFeedbackModal(false);
      setFeedbackText("");
      await refreshData();
    } catch (error) {
      showToast("Failed to process review.", "error");
    } finally {
      setIsReviewing(false);
    }
  };

  const handleChedUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.fileName || !selectedFile || !selectedChedReq) {
      showToast("Please provide all required fields.", "error"); return;
    }
    
    setIsUploading(true);
    const submitData = new FormData();
    submitData.append("file", selectedFile);
    submitData.append("requirement_id", selectedChedReq.id);
    submitData.append("document_name", uploadForm.fileName);
    submitData.append("uploaded_by", userName);
    submitData.append("program", selectedProgram);

    try {
      await axios.post("http://localhost:8000/ched/upload-evidence", submitData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      await fetchChedData();
      setUploadForm({ fileName: "", requirementTarget: "" });
      setSelectedFile(null); 
      setShowChedUploadModal(false);
      showToast("CHED Evidence uploaded! Pending Admin Review.", "success");
    } catch (error) {
      showToast("Failed to upload CHED evidence.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddChedRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingReq(true);
    try {
      await axios.post("http://localhost:8000/ched/requirements", {
        program: selectedProgram,
        cmo_name: newChedReq.cmo_name,
        description: newChedReq.description
      });
      showToast("New CHED requirement added to the checklist!", "success");
      setNewChedReq({ cmo_name: "", description: "" });
      setShowAddChedReqModal(false);
      fetchChedData();
    } catch (error) {
      showToast("Failed to add requirement.", "error");
    } finally {
      setIsAddingReq(false);
    }
  };

  const handleEditChedRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingReq(true);
    try {
      await axios.put(`http://localhost:8000/ched/requirements/${editingChedReq.id}`, {
        program: selectedProgram,
        cmo_name: editingChedReq.cmo_name,
        description: editingChedReq.description
      });
      showToast("Requirement updated!", "success");
      setShowEditChedModal(false);
      fetchChedData();
    } catch (error) {
      showToast("Failed to update requirement.", "error");
    } finally {
      setIsEditingReq(false);
    }
  };

  const confirmDeleteChedRequirement = (reqId: string) => {
    setChedReqToDelete(reqId);
    setShowDeleteChedReqModal(true);
  };

  const executeDeleteChedRequirement = async () => {
    if (!chedReqToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`http://localhost:8000/ched/requirements/${chedReqToDelete}`);
      showToast("Requirement deleted.", "success");
      setShowDeleteChedReqModal(false);
      setChedReqToDelete(null);
      fetchChedData();
    } catch (error) {
      showToast("Failed to delete requirement.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeleteChedEvidence = (evidence: any) => {
    setChedEvidenceToDelete(evidence);
    setShowDeleteChedEvidenceModal(true);
  };

  const executeDeleteChedEvidence = async () => {
    if (!chedEvidenceToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`http://localhost:8000/ched/evidence/${chedEvidenceToDelete.id}`);
      showToast("Evidence removed.", "success");
      setShowDeleteChedEvidenceModal(false);
      setChedEvidenceToDelete(null);
      fetchChedData();
    } catch (error) {
      showToast("Failed to remove evidence.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChedAdminReview = async (reqId: string, status: string) => {
    try {
      await axios.put(`http://localhost:8000/ched/requirements/${reqId}/status`, { status });
      showToast(`Requirement marked as ${status}!`, "success");
      fetchChedData();
    } catch (error) {
      showToast("Failed to update status.", "error");
    }
  };

  // --- ISO HANDLERS ---
  const handleIsoUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.fileName || !selectedFile || !selectedIsoReq) {
      showToast("Please provide document name and file.", "error"); return;
    }
    
    setIsUploading(true);
    const submitData = new FormData();
    submitData.append("file", selectedFile);
    submitData.append("requirement_id", selectedIsoReq.id);
    submitData.append("document_name", uploadForm.fileName);
    submitData.append("uploaded_by", userName);
    submitData.append("program", "GLOBAL");

    try {
      await axios.post("http://localhost:8000/iso/upload-evidence", submitData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      await fetchIsoData();
      setUploadForm({ fileName: "", requirementTarget: "" });
      setSelectedFile(null); 
      setShowIsoUploadModal(false);
      showToast("ISO Evidence uploaded successfully!", "success");
    } catch (error) {
      showToast("Failed to upload ISO evidence.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleIsoStatusUpdate = async (reqId: string, status: string) => {
    try {
      await axios.put(`http://localhost:8000/iso/requirements/${reqId}/status`, { status });
      showToast(`ISO Clause marked as ${status}!`, "success");
      fetchIsoData();
    } catch (error) {
      showToast("Failed to update status.", "error");
    }
  };

  const handleDeleteIsoEvidence = async (evidenceId: string) => {
    try {
      await axios.delete(`http://localhost:8000/iso/evidence/${evidenceId}`);
      showToast("ISO evidence removed.", "success");
      fetchIsoData();
    } catch (error) {
      showToast("Failed to remove evidence.", "error");
    }
  };

  const handleAddIsoRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIsoReq.title.trim() || !newIsoReq.description.trim()) {
      showToast("Please fill out all required fields.", "error"); return;
    }
    setIsAddingIsoReq(true);
    try {
      await axios.post("http://localhost:8000/iso/requirements", {
        program: "GLOBAL",
        iso_clause: newIsoReq.iso_clause,
        title: newIsoReq.title,
        description: newIsoReq.description,
        auditee_office: newIsoReq.auditee_office,
        risk_level: newIsoReq.risk_level
      });
      showToast("New ISO Clause Requirement added!", "success");
      setNewIsoReq({
        iso_clause: "Clause 6.1",
        title: "",
        description: "",
        auditee_office: "Director of Instruction (DOI) & SAO",
        risk_level: "Medium"
      });
      setShowAddIsoReqModal(false);
      fetchIsoData();
    } catch (error) {
      showToast("Failed to add ISO requirement.", "error");
    } finally {
      setIsAddingIsoReq(false);
    }
  };

  const handleDeleteIsoRequirement = async (reqId: string) => {
    const req = isoRequirements.find(r => r.id === reqId);
    if (req) {
      setIsoReqToDelete(req);
      setShowDeleteIsoReqModal(true);
    }
  };

  const handleEditIsoRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIsoReq || !editingIsoReq.title.trim() || !editingIsoReq.description.trim()) {
      showToast("Please fill out all required fields.", "error"); return;
    }
    setIsEditingIsoReq(true);
    try {
      await axios.put(`http://localhost:8000/iso/requirements/${editingIsoReq.id}`, {
        program: "GLOBAL",
        iso_clause: editingIsoReq.iso_clause,
        title: editingIsoReq.title,
        description: editingIsoReq.description,
        auditee_office: editingIsoReq.auditee_office,
        risk_level: editingIsoReq.risk_level
      });
      showToast("ISO Clause requirement updated!", "success");
      setShowEditIsoModal(false);
      setEditingIsoReq(null);
      fetchIsoData();
    } catch (error) {
      showToast("Failed to update ISO requirement.", "error");
    } finally {
      setIsEditingIsoReq(false);
    }
  };

  const executeDeleteIsoRequirement = async () => {
    if (!isoReqToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`http://localhost:8000/iso/requirements/${isoReqToDelete.id}`);
      showToast("ISO requirement deleted.", "success");
      setShowDeleteIsoReqModal(false);
      setIsoReqToDelete(null);
      fetchIsoData();
    } catch (error) {
      showToast("Failed to delete ISO requirement.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveIqaSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingIqa(true);
    try {
      await axios.put(`http://localhost:8000/iso/schedule/GLOBAL`, iqaFormData);
      showToast("IQA Audit Schedule updated for upcoming cycle!", "success");
      setShowEditIqaModal(false);
      fetchIqaSchedule();
    } catch (error) {
      showToast("Failed to update IQA schedule.", "error");
    } finally {
      setIsSavingIqa(false);
    }
  };

  const handleAddIqaDaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iqaDayForm.title.trim() || !iqaDayForm.day_date.trim()) {
      showToast("Please fill out all required fields.", "error"); return;
    }
    setIsSavingIqaDay(true);
    try {
      await axios.post("http://localhost:8000/iso/schedule-days", iqaDayForm);
      showToast("New IQA Audit Day added!", "success");
      setShowAddIqaDayModal(false);
      setIqaDayForm({ day_number: iqaDays.length + 1, day_date: "", title: "", scope: "" });
      fetchIqaDays();
    } catch (error) {
      showToast("Failed to add IQA Audit Day.", "error");
    } finally {
      setIsSavingIqaDay(false);
    }
  };

  const handleEditIqaDaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIqaDay || !editingIqaDay.title.trim() || !editingIqaDay.day_date.trim()) {
      showToast("Please fill out all required fields.", "error"); return;
    }
    setIsSavingIqaDay(true);
    try {
      await axios.put(`http://localhost:8000/iso/schedule-days/${editingIqaDay.id}`, editingIqaDay);
      showToast("IQA Audit Day updated!", "success");
      setShowEditIqaDayModal(false);
      setEditingIqaDay(null);
      fetchIqaDays();
    } catch (error) {
      showToast("Failed to update IQA Audit Day.", "error");
    } finally {
      setIsSavingIqaDay(false);
    }
  };

  const executeDeleteIqaDay = async () => {
    if (!deletingIqaDay) return;
    setIsDeleting(true);
    try {
      await axios.delete(`http://localhost:8000/iso/schedule-days/${deletingIqaDay.id}`);
      showToast("IQA Audit Day removed.", "success");
      setShowDeleteIqaDayModal(false);
      setDeletingIqaDay(null);
      fetchIqaDays();
    } catch (error) {
      showToast("Failed to remove IQA Audit Day.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate ISO Compliance Math
  const isoCompliantCount = isoRequirements.filter(r => r.status === 'Compliant').length;
  const isoTotalCount = isoRequirements.length;
  const isoCompliancePercentage = isoTotalCount === 0 ? 0 : Math.round((isoCompliantCount / isoTotalCount) * 100);

  // Calculate CHED Compliance Math
  const chedCompliantCount = chedRequirements.filter(r => r.status === 'Compliant').length;
  const chedTotalCount = chedRequirements.length;
  const chedCompliancePercentage = chedTotalCount === 0 ? 0 : Math.round((chedCompliantCount / chedTotalCount) * 100);
  
  // COMBINE AACCUP AND CHED PENDING DOCS FOR THE TOP QUEUE
  const chedPendingDocs = chedRequirements.filter(r => r.status === 'Pending').map(r => ({
    id: r.id,
    type: 'CHED',
    name: r.evidences && r.evidences.length > 0 ? r.evidences[0].document_name : 'Attached Evidence',
    target: r.description,
    program: r.program,
    area_code: r.cmo_name,
    uploaded_by: r.evidences && r.evidences.length > 0 ? r.evidences[0].uploaded_by : 'Unknown',
    date: r.evidences && r.evidences.length > 0 ? r.evidences[0].upload_date.split('T')[0] : 'Recently',
    url: r.evidences && r.evidences.length > 0 ? r.evidences[0].file_url : '#'
  }));
  
  const allPendingReviews = [...pendingDocs.map(d => ({...d, type: 'AACCUP'})), ...chedPendingDocs];

  if (isLoading && currentData.areas.length === 0) {
    return <div className="flex justify-center items-center h-64 text-gray-500"><Loader2 className="h-8 w-8 animate-spin text-[#FF9501]" /></div>;
  }

  return (
    <div className="space-y-6 relative pb-10">
      
      {toast && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-bold z-[100] transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${
          toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-50 text-red-700 border-2 border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-400" /> : <AlertCircle className="h-5 w-5" />}
          {toast.message}
        </div>
      )}

      <div>
        <h1 className="text-xl text-gray-900 mb-2 font-semibold">QA & Accreditation Support</h1>
        <p className="text-sm text-[#6B7280] mt-1">Comprehensive quality assurance tracking across AACCUP, ISO, CHED monitoring, and accreditation results</p>
      </div>

      {/* --- GLOBAL ADMIN REVIEW QUEUE --- */}
      {userRole === "ADMIN" && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden mb-6 transition-all duration-300">
          <button
            onClick={() => setIsAdminQueueOpen(!isAdminQueueOpen)}
            className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-[#FFF4E5] to-white hover:from-[#FFB84D]/20 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#FF9501]">
                <ShieldAlert className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-[#1F2937]">Admin Review Queue</h2>
                <p className="text-xs text-[#6B7280]">
                  {allPendingReviews.length} {allPendingReviews.length === 1 ? 'document requires' : 'documents require'} your approval
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {allPendingReviews.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                  {allPendingReviews.length} PENDING
                </span>
              )}
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200 shadow-sm">
                {isAdminQueueOpen ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
              </div>
            </div>
          </button>

          {isAdminQueueOpen && (
            <div className="p-6 border-t border-[#E5E7EB] bg-gray-50/50 animate-in slide-in-from-top-2 fade-in duration-300">
              {allPendingReviews.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3 opacity-50" />
                  <p className="text-gray-500 font-medium">All caught up! No pending documents in the queue.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allPendingReviews.map((doc, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-orange-100 text-[#D97E00] text-[10px] font-bold uppercase rounded tracking-wider">
                            {doc.type} Pending
                          </span>
                          <span className="text-xs text-gray-500">{doc.date}</span>
                        </div>
                        <button onClick={() => handleViewDocument(doc.url, doc.name)} className="text-[#D97E00] hover:text-[#995900] text-xs font-bold flex items-center gap-1 cursor-pointer bg-orange-50 px-2 py-1 rounded">
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                      </div>
                      
                      <h4 className="font-bold text-gray-900 mb-1 line-clamp-1" title={doc.name}>{doc.name}</h4>
                      <p className="text-xs font-medium text-[#D97E00] mb-3 line-clamp-2 leading-snug">Target: {doc.target}</p>
                      
                      <div className="mt-auto pt-3 border-t border-gray-100 space-y-1.5 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Program:</span>
                          <span className="font-semibold text-gray-900">{doc.program} ({doc.area_code})</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Uploaded by:</span>
                          <span className="font-semibold text-gray-900">{doc.uploaded_by}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-auto">
                        {doc.type === 'AACCUP' ? (
                          <>
                            <button 
                              onClick={() => { setFeedbackDoc(doc); setShowFeedbackModal(true); }}
                              disabled={isReviewing}
                              className="flex-1 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                            >
                              Request Revision
                            </button>
                            <button 
                              onClick={() => handleAdminReview(doc.name, "Approved")}
                              disabled={isReviewing}
                              className="flex-1 py-2 bg-[#FF9501] text-white text-xs font-bold rounded-lg hover:bg-[#D97E00] transition-colors cursor-pointer shadow-sm"
                            >
                              Approve
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleChedAdminReview(doc.id, "Not Compliant")}
                              className="flex-1 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                            >
                              Request Revision
                            </button>
                            <button 
                              onClick={() => handleChedAdminReview(doc.id, "Compliant")}
                              className="flex-1 py-2 bg-[#FF9501] text-white text-xs font-bold rounded-lg hover:bg-[#D97E00] transition-colors cursor-pointer shadow-sm"
                            >
                              Approve
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1">
          <TabsTrigger value="aaccup" className="data-[state=active]:bg-[#FF9501] data-[state=active]:text-white cursor-pointer transition-all">AACCUP</TabsTrigger>
          <TabsTrigger value="iso" className="data-[state=active]:bg-[#FF9501] data-[state=active]:text-white cursor-pointer transition-all">ISO Standards</TabsTrigger>
          <TabsTrigger value="ched" className="data-[state=active]:bg-[#FF9501] data-[state=active]:text-white cursor-pointer transition-all">CHED Monitoring</TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:bg-[#FF9501] data-[state=active]:text-white cursor-pointer transition-all">Accreditation Results</TabsTrigger>
        </TabsList>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === 'iso' ? 'Institutional Quality Management System' : 'Program Evaluation Context'}
            </h2>
            <p className="text-sm text-gray-500">
              {activeTab === 'iso' ? 'Campus-wide ISO 9001:2015 QMS (Applies to the entire CTU Argao Campus).' : 'Tracking compliance templates per degree program.'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-80">
              {activeTab === 'iso' ? (
                <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 flex items-center justify-between shadow-inner cursor-not-allowed opacity-85 select-none" title="Disabled: ISO 9001:2015 is an Institutional Campus-Wide QMS and does not depend on degree programs.">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="truncate">CTU Argao Institutional Campus-Wide</span>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black uppercase rounded border border-blue-200">Global</span>
                </div>
              ) : (
                <>
                  <select 
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    disabled={userRole === 'FACULTY'}
                    className={`appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501] pr-10 ${
                      userRole === 'FACULTY' ? 'bg-gray-100 opacity-80 cursor-not-allowed' : 'bg-[#F5F7FA] cursor-pointer'
                    }`}
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
                  </select>
                  {userRole === 'FACULTY' ? (
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                  ) : (
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                  )}
                </>
              )}
            </div>

            {activeTab !== 'iso' && (
              <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#FF9501] to-[#D97E00] text-white rounded-lg shadow-md border border-[#FF9501]/50 w-full sm:w-auto justify-center">
                <Award className="h-5 w-5 drop-shadow-sm" />
                <span className="font-bold tracking-wide text-shadow-sm uppercase text-xs">{currentData.level || "Level II"}</span>
              </div>
            )}
          </div>
        </div>

        <TabsContent value="aaccup" className="space-y-6 mt-6">
          {!expandedArea ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-[#006837]">
                  <h3 className="text-4xl font-bold text-[#006837] mb-2">{currentData.overall}%</h3>
                  <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Overall Compliance</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-red-500">
                  <h3 className="text-4xl font-bold text-red-500 mb-2">{currentData.gaps}</h3>
                  <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Total Gaps Identified</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-[#FF9501]">
                  <h3 className="text-4xl font-bold text-[#FF9501] mb-2">{currentData.evidence}</h3>
                  <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Approved Documents</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-[#995900]">
                  <h3 className="text-4xl font-bold text-[#995900] mb-2">{currentData.areas.length}</h3>
                  <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Active Areas</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <h2 className="text-xl font-bold text-[#1F2937]">AACCUP Area Compliance</h2>
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search areas..."
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9501] text-sm"
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
                        className="border border-gray-200 rounded-xl p-5 hover:border-[#FF9501] hover:shadow-lg transition-all duration-200 flex flex-col justify-between bg-white group cursor-pointer active:scale-[0.99]"
                      >
                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div className="pr-4">
                              <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight group-hover:text-[#FF9501] transition-colors">
                                {area.code}: {area.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-2">
                                {area.compliance === 100 ? <CheckCircle className="h-4 w-4 text-[#006837]" /> : <AlertCircle className="h-4 w-4 text-[#D97E00]" />}
                                <span className={`text-xs font-bold uppercase tracking-wider ${area.compliance === 100 ? "text-[#006837]" : "text-[#D97E00]"}`}>
                                  {area.gaps > 0 ? `${area.gaps} Missing Requirements` : "Fully Compliant"}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-3xl font-bold ${area.compliance === 100 ? "text-[#006837]" : "text-[#FF9501]"}`}>
                                {area.compliance}%
                              </div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${area.compliance >= 85 ? "bg-[#006837]" : area.compliance >= 50 ? "bg-[#FF9501]" : "bg-red-500"}`}
                              style={{ width: `${area.compliance}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span>{area.evidenceCount} / {area.required} Approved Files</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF9501] group-hover:text-[#D97E00] uppercase tracking-wider">
                            View Details <span className="transform transition-transform duration-300 group-hover:translate-x-1">→</span>
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
              <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-[#FF9501] border-x border-b border-gray-200">
                <button 
                  onClick={() => setExpandedArea(null)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#FF9501] font-bold mb-4 transition-colors cursor-pointer w-max uppercase tracking-wider"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Area Overview
                </button>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{expandedArea.code}: {expandedArea.title}</h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1 font-medium"><CheckCircle className="h-4 w-4 text-[#006837]"/> {expandedArea.evidenceCount} / {expandedArea.required} Approved</span>
                      <span className="flex items-center gap-1 font-medium"><AlertCircle className="h-4 w-4 text-red-500"/> {expandedArea.gaps} Gaps Remaining</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Area Compliance</p>
                    <div className={`text-4xl font-bold ${expandedArea.compliance === 100 ? "text-[#006837]" : "text-[#FF9501]"}`}>
                      {expandedArea.compliance}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Requirements List */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-[#FFF4E5] border-b border-gray-200">
                      <h3 className="font-bold text-[#1F2937] text-sm uppercase tracking-wider">Required Documents</h3>
                    </div>
                    {isLoadingDetails ? (
                       <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#FF9501]" /></div>
                    ) : (
                      <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {areaDetails.requirements.length === 0 ? (
                           <p className="p-4 text-sm text-gray-500 italic">No specific requirements templated yet.</p>
                        ) : (
                          areaDetails.requirements.map((req: any, index: number) => (
                            <div key={index} className="p-4 flex items-start gap-3 hover:bg-orange-50/30 transition-colors">
                              <div className="mt-0.5">
                                {req.is_met ? <CheckCircle className="h-5 w-5 text-[#006837]" /> : <div className="h-5 w-5 rounded-full border-2 border-gray-300" />}
                              </div>
                              <p className={`text-sm ${req.is_met ? "text-gray-400 line-through decoration-gray-300 font-medium" : "text-gray-900 font-semibold"}`}>
                                {req.text}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Uploaded Evidence Table */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                    <div className="p-4 bg-[#F9FAFB] border-b border-gray-200 flex justify-between items-center">
                      <h3 className="font-bold text-[#1F2937] text-sm uppercase tracking-wider">Uploaded Evidence</h3>
                      <button 
                        onClick={() => openUploadModal(expandedArea)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#FF9501] text-white rounded-lg hover:bg-[#D97E00] transition-all text-xs font-bold cursor-pointer shadow-sm active:scale-95"
                      >
                        <Upload className="h-3.5 w-3.5" /> Upload File
                      </button>
                    </div>
                    
                    {isLoadingDetails ? (
                       <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#FF9501]" /></div>
                    ) : (
                      <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left whitespace-nowrap">
                          <thead className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                            <tr>
                              <th className="px-6 py-4">Document & Target</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {areaDetails.uploadedFiles.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-500 italic">
                                  No evidence files uploaded for this area yet.
                                </td>
                              </tr>
                            ) : (
                              areaDetails.uploadedFiles.map((file: any, index: number) => (
                                <tr key={index} className="hover:bg-orange-50/20 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-start gap-3">
                                      <div className="p-2 bg-orange-50 rounded-lg">
                                        <FileText className="h-4 w-4 text-[#FF9501]" />
                                      </div>
                                      <div>
                                        <div className="text-sm font-bold text-gray-900 truncate max-w-[300px]">{file.name}</div>
                                        <div className="text-[11px] text-[#D97E00] font-semibold mt-1 max-w-[250px] truncate" title={file.target}>
                                          Fulfills: {file.target}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    {file.status === "Approved" ? (
                                      <span className="flex items-center w-max gap-1.5 px-2.5 py-1 bg-green-100 text-[#006837] text-[10px] font-bold rounded-md uppercase tracking-wider">
                                        <Check className="h-3 w-3" /> Approved
                                      </span>
                                    ) : file.status === "Needs Revision" ? (
                                      <div className="flex flex-col gap-1">
                                        <span className="flex items-center w-max gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                                          <AlertCircle className="h-3 w-3" /> Needs Revision
                                        </span>
                                        {file.feedback && (
                                          <span className="text-[10px] text-red-500 font-medium italic max-w-[150px] truncate" title={file.feedback}>
                                            "{file.feedback}"
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="flex items-center w-max gap-1.5 px-2.5 py-1 bg-orange-50 text-[#D97E00] text-[10px] font-bold rounded-md uppercase tracking-wider border border-[#FF9501]/20">
                                        <Clock className="h-3 w-3" /> Pending Review
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-3">
                                      <button onClick={() => handleViewDocument(file.url, file.name)} className="p-2 text-gray-400 hover:text-[#FF9501] hover:bg-orange-50 rounded-lg transition-all cursor-pointer" title="View File">
                                        <Eye className="h-4 w-4" />
                                      </button>
                                      <button onClick={() => openDeleteModal(file.name)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="Remove Evidence">
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

        <TabsContent value="ched" className="mt-6 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-[#FF9501]" />
                  CHED Program Compliance
                </h2>
                <p className="text-sm text-gray-500 mt-1">Monitoring of CMO requirements and mandatory submissions for {selectedProgram}.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Overall Compliance</p>
                  <div className={`text-2xl font-bold ${chedCompliancePercentage === 100 ? "text-[#006837]" : "text-[#FF9501]"}`}>
                    {chedCompliancePercentage}%
                  </div>
                </div>
                {userRole === "ADMIN" && (
                  <button 
                    onClick={() => setShowAddChedReqModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#FF9501] text-white rounded-lg hover:bg-[#D97E00] transition-all text-xs font-bold cursor-pointer shadow-sm active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Requirement
                  </button>
                )}
              </div>
            </div>

            <div className="w-full bg-gray-100 h-1 overflow-hidden">
              <div className={`h-full transition-all duration-1000 ease-out ${chedCompliancePercentage >= 85 ? "bg-[#006837]" : "bg-[#FF9501]"}`} style={{ width: `${chedCompliancePercentage}%` }}></div>
            </div>
            
            <div className="p-0">
              {isLoadingChed ? (
                <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#FF9501]" /></div>
              ) : chedRequirements.length === 0 ? (
                <div className="text-center py-16 border-b border-gray-100 bg-white">
                  <FileCheck className="h-12 w-12 text-gray-300 mx-auto mb-3 opacity-50" />
                  <h3 className="text-lg font-bold text-gray-900">No Checklist Found</h3>
                  <p className="text-sm text-gray-500 mt-1 mb-4">There are no CHED requirements configured for {selectedProgram}.</p>
                  {userRole === "ADMIN" && (
                    <button onClick={() => setShowAddChedReqModal(true)} className="px-5 py-2 bg-orange-50 text-[#FF9501] text-sm font-bold rounded-lg border border-[#FF9501]/30 hover:bg-orange-100 transition-colors">
                      Configure First Requirement
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200 text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                      <tr>
                        <th className="px-6 py-4 w-1/3">Requirement & CMO</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 w-1/4">Attached Evidence</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {chedRequirements.map((req: any, index: number) => (
                        <tr key={index} className="hover:bg-orange-50/20 transition-colors group">
                          <td className="px-6 py-4 whitespace-normal min-w-[250px]">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {req.status === "Compliant" ? <CheckCircle className="h-5 w-5 text-[#006837]" /> : <div className="h-5 w-5 rounded-full border-2 border-gray-300" />}
                              </div>
                              <div>
                                <p className={`text-sm ${req.status === "Compliant" ? "text-gray-900 font-medium" : "text-gray-900 font-bold"}`}>
                                  {req.description}
                                </p>
                                <p className="text-[11px] text-[#FF9501] font-bold mt-1 uppercase tracking-wider">
                                  {req.cmo_name}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              {req.status === "Compliant" ? (
                                <span className="flex items-center w-max gap-1.5 px-3 py-1.5 bg-green-100 text-[#006837] text-[10px] font-bold rounded-md uppercase tracking-wider shadow-sm border border-green-200">
                                  <Check className="h-3 w-3" /> Compliant
                                </span>
                              ) : req.status === "Pending" ? (
                                <span className="flex items-center w-max gap-1.5 px-3 py-1.5 bg-orange-100 text-[#D97E00] text-[10px] font-bold rounded-md uppercase tracking-wider shadow-sm border border-orange-200">
                                  <Clock className="h-3 w-3" /> Pending Review
                                </span>
                              ) : (
                                <span className="flex items-center w-max gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-md uppercase tracking-wider shadow-sm border border-red-100">
                                  <AlertCircle className="h-3 w-3" /> Not Compliant
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-normal">
                            {req.evidences && req.evidences.length > 0 ? (
                              <div className="space-y-2">
                                {req.evidences.map((ev: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100">
                                    <FileText className="h-3.5 w-3.5 text-[#FF9501] shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-gray-900 truncate" title={ev.document_name}>{ev.document_name}</p>
                                      <p className="text-[9px] text-gray-500 uppercase mt-0.5">By {ev.uploaded_by}</p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button onClick={() => window.open(ev.file_url, "_blank")} className="p-1.5 text-gray-400 hover:text-[#FF9501] bg-white rounded shadow-sm shrink-0">
                                        <Eye className="h-3 w-3" />
                                      </button>
                                      {/* Allow user who uploaded it or ADMIN to delete it */}
                                      {(userRole === 'ADMIN' || ev.uploaded_by === userName) && (
                                        <button onClick={() => confirmDeleteChedEvidence(ev)} className="p-1.5 text-gray-400 hover:text-red-500 bg-white rounded shadow-sm shrink-0">
                                          <Archive className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No files attached</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* If Not Compliant, anyone can upload evidence */}
                              {req.status === "Not Compliant" && (
                                <button 
                                  onClick={() => { setSelectedChedReq(req); setUploadForm({ fileName: "", requirementTarget: "" }); setSelectedFile(null); setShowChedUploadModal(true); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF9501] text-white text-[10px] font-bold uppercase tracking-wider rounded hover:bg-[#D97E00] transition-colors shadow-sm"
                                >
                                  <Upload className="h-3 w-3" /> Upload
                                </button>
                              )}

                              {/* Admin Controls (Moved Approve/Reject to Top Queue, kept Edit/Delete/Revoke here) */}
                              {userRole === "ADMIN" && (
                                <>
                                  {req.status === "Compliant" && (
                                     <button onClick={() => handleChedAdminReview(req.id, "Not Compliant")} className="px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 text-[10px] font-bold uppercase tracking-wider rounded transition-colors" title="Revoke Compliance">
                                       Revoke
                                     </button>
                                  )}
                                  
                                  {/* Only show Edit/Delete if no evidence is attached or it's not compliant */}
                                  {(req.status === "Not Compliant" || req.status === "Pending") && (
                                    <>
                                      <button 
                                        onClick={() => { setEditingChedReq(req); setShowEditChedModal(true); }}
                                        className="p-1.5 text-gray-400 hover:text-[#FF9501] transition-colors rounded" title="Edit Requirement"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                      <button 
                                        onClick={() => confirmDeleteChedRequirement(req.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded" title="Delete Requirement"
                                      >
                                        <Archive className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="iso" className="mt-6 space-y-6">

          {/* --- 100% ISO 9001:2015 COMPLIANCE SUCCESS BANNER --- */}
          {isoTotalCount > 0 && isoCompliantCount === isoTotalCount && (
            <div className="p-6 bg-gradient-to-r from-[#006837] via-emerald-600 to-teal-700 text-white rounded-2xl shadow-xl border-2 border-emerald-400 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/30 shadow-lg">
                    <Award className="h-10 w-10 text-amber-300 drop-shadow" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-amber-400 text-gray-900 text-[10px] font-black uppercase rounded-full tracking-widest shadow-sm">
                        🏆 100% Fully Compliant
                      </span>
                      <span className="text-xs font-semibold text-emerald-100">ISO 9001:2015 Certified Audit Status</span>
                    </div>
                    <h3 className="text-xl font-black mt-1 tracking-tight">
                      Institutional Quality Management System (QMS) Verified for CTU Argao Campus!
                    </h3>
                    <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed font-medium">
                      All {isoTotalCount} Internal Quality Audit (IQA) clauses have been successfully audited, verified, and approved with complete documented evidence. CTU Argao Campus is fully ready for External Audit certification!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => showToast("Official ISO Compliance Audit Summary Report generated!", "success")}
                    className="px-5 py-3 bg-amber-400 text-gray-900 font-bold text-xs rounded-xl hover:bg-amber-300 transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-2 uppercase tracking-wider"
                  >
                    <Download className="h-4 w-4" /> Download ISO Audit Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ISO 9001:2015 Summary Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 border-t-4 border-t-[#FF9501] overflow-hidden">
            <div className="border-b border-gray-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#FF9501]" />
                    ISO 9001:2015 Quality Management System (QMS) & IQA Framework
                  </h2>
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full uppercase tracking-wider border border-blue-200">
                    Institutional Campus-Wide
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Official CTU Argao Campus-Wide Internal Quality Audit (IQA) clauses, risk assessments, and auditee office compliance.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">ISO QMS Compliance</p>
                  <div className={`text-2xl font-bold ${isoCompliancePercentage >= 85 ? "text-[#006837]" : "text-[#FF9501]"}`}>
                    {isoCompliancePercentage}%
                  </div>
                </div>

                {userRole === "ADMIN" && (
                  <button
                    onClick={() => setShowAddIsoReqModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#FF9501] text-white rounded-lg hover:bg-[#D97E00] transition-all text-xs font-bold cursor-pointer shadow-sm active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add ISO Clause
                  </button>
                )}

                <span className="px-3 py-1 bg-[#FFF4E5] text-[#D97E00] text-[10px] font-bold rounded-full uppercase tracking-widest flex items-center gap-1.5 border border-[#FF9501]/20 shadow-sm">
                  <CheckCircle2 className="w-3 h-3 text-[#FF9501]" />
                  Active QMS Matrix
                </span>
              </div>
            </div>

            <div className="w-full bg-gray-100 h-1.5 overflow-hidden">
              <div className={`h-full transition-all duration-1000 ease-out ${isoCompliancePercentage >= 85 ? "bg-[#006837]" : "bg-[#FF9501]"}`} style={{ width: `${isoCompliancePercentage}%` }}></div>
            </div>

            {/* Metric Summary Cards */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-gray-100 bg-white">
              <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total ISO Clauses</p>
                  <h3 className="text-2xl font-bold text-[#1F2937] mt-0.5">{isoTotalCount} Clauses</h3>
                  <p className="text-[11px] text-[#6B7280]">Covering 8 Auditee Offices</p>
                </div>
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#FF9501] shadow-sm">
                  <FileBadge className="h-5 w-5" />
                </div>
              </div>

              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Verified Compliant</p>
                  <h3 className="text-2xl font-bold text-[#006837] mt-0.5">{isoCompliantCount} / {isoTotalCount}</h3>
                  <p className="text-[11px] text-emerald-700">Passed IQA Clause Audit</p>
                </div>
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>

              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-[#D97E00] uppercase tracking-wider">Pending Evidence</p>
                  <h3 className="text-2xl font-bold text-[#D97E00] mt-0.5">{isoTotalCount - isoCompliantCount} Clauses</h3>
                  <p className="text-[11px] text-[#D97E00]">Requires office proof</p>
                </div>
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#FF9501] shadow-sm">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Auditee Office Dropdown Filter Bar */}
            <div className="px-6 py-4 bg-[#F9FAFB] border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-[#FF9501]" />
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Auditee Office Filter:</label>
                <select
                  value={isoOfficeFilter}
                  onChange={(e) => setIsoOfficeFilter(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF9501] shadow-sm cursor-pointer min-w-[260px]"
                >
                  <option value="all">All Auditee Offices (8 Offices)</option>
                  <option value="Director of Instruction (DOI) & SAO">Director of Instruction (DOI) & SAO</option>
                  <option value="Human Resources Management Office (HRMO)">Human Resources Management Office (HRMO)</option>
                  <option value="Document Controller & Registrar">Document Controller & Registrar</option>
                  <option value="College Deans & Program Chairs">College Deans & Program Chairs</option>
                  <option value="BAC / Procurement & Supply">BAC / Procurement & Supply</option>
                  <option value="Property Custodian & Finance">Property Custodian & Finance</option>
                  <option value="Registrar & MIS">Registrar & MIS</option>
                  <option value="Quality Assurance & Deans">Quality Assurance & Deans</option>
                  <option value="Library Services">Library Services</option>
                  <option value="Student Affairs Office (SAO)">Student Affairs Office (SAO)</option>
                </select>
              </div>

              <div className="text-xs text-gray-500 font-semibold">
                Showing {isoRequirements.filter((req) => isoOfficeFilter === "all" || req.auditee_office === isoOfficeFilter).length} of {isoTotalCount} ISO Clauses
              </div>
            </div>

            {/* Clauses List */}
            <div className="p-6">
              {isLoadingIso ? (
                <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#FF9501]" /></div>
              ) : isoRequirements.length === 0 ? (
                <div className="text-center py-12 text-gray-500 font-medium">No ISO clauses loaded.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {isoRequirements
                    .filter((req) => isoOfficeFilter === "all" || req.auditee_office === isoOfficeFilter)
                    .map((req, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 hover:border-[#FF9501] rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <span className="px-2.5 py-1 bg-orange-100 text-[#D97E00] text-[10px] font-bold uppercase rounded tracking-wider border border-[#FF9501]/30">
                                {req.iso_clause}
                              </span>
                              <h3 className="font-bold text-gray-900 text-base mt-2 group-hover:text-[#FF9501] transition-colors">{req.title}</h3>
                            </div>
                            <div>
                              {req.status === "Compliant" ? (
                                <span className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-[#006837] text-[10px] font-bold rounded uppercase tracking-wider border border-green-200 shadow-sm">
                                  <Check className="h-3 w-3" /> Compliant
                                </span>
                              ) : req.status === "Pending" ? (
                                <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-[#D97E00] text-[10px] font-bold rounded uppercase tracking-wider border border-orange-200 shadow-sm">
                                  <Clock className="h-3 w-3" /> Pending Review
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded uppercase tracking-wider border border-red-100 shadow-sm">
                                  <AlertCircle className="h-3 w-3" /> Not Compliant
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-gray-600 mt-2 mb-3 leading-relaxed">{req.description}</p>

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-[11px]">
                            <span className="font-semibold text-gray-500 flex items-center gap-1">
                              <Building className="h-3.5 w-3.5 text-[#FF9501]" /> Auditee:
                            </span>
                            <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{req.auditee_office}</span>
                            <span className={`ml-auto font-bold text-[10px] uppercase px-2 py-0.5 rounded ${
                              req.risk_level === 'High' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {req.risk_level} Risk
                            </span>
                          </div>

                          {/* Attached Evidence List */}
                          <div className="mt-4 space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Attached Clause Evidence:</p>
                            {req.evidences && req.evidences.length > 0 ? (
                              req.evidences.map((ev: any, evIdx: number) => (
                                <div key={evIdx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="h-4 w-4 text-[#FF9501] shrink-0" />
                                    <span className="font-bold text-gray-900 truncate" title={ev.document_name}>{ev.document_name}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    <button onClick={() => window.open(ev.file_url, "_blank")} className="p-1 text-gray-400 hover:text-[#FF9501] bg-white rounded shadow-sm">
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>
                                    {(userRole === 'ADMIN' || ev.uploaded_by === userName) && (
                                      <button onClick={() => handleDeleteIsoEvidence(ev.id)} className="p-1 text-gray-400 hover:text-red-600 bg-white rounded shadow-sm">
                                        <Archive className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-gray-400 italic">No proof attached yet</p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => { setSelectedIsoReq(req); setUploadForm({ fileName: "", requirementTarget: "" }); setSelectedFile(null); setShowIsoUploadModal(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF9501] text-white text-xs font-bold rounded hover:bg-[#D97E00] transition-colors shadow-sm cursor-pointer"
                          >
                            <Upload className="h-3.5 w-3.5" /> Upload Evidence
                          </button>

                          {userRole === "ADMIN" && (
                            <div className="flex items-center gap-1.5">
                              {req.status !== "Compliant" ? (
                                <button onClick={() => handleIsoStatusUpdate(req.id, "Compliant")} className="px-2.5 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 text-[10px] font-bold uppercase rounded border border-green-200 transition-colors cursor-pointer">
                                  Approve
                                </button>
                              ) : (
                                <button onClick={() => handleIsoStatusUpdate(req.id, "Not Compliant")} className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-[10px] font-bold uppercase rounded border border-red-200 transition-colors cursor-pointer">
                                  Revoke
                                </button>
                              )}

                              <button
                                onClick={() => { setEditingIsoReq(req); setShowEditIsoModal(true); }}
                                className="p-1.5 text-gray-400 hover:text-[#FF9501] transition-colors rounded cursor-pointer" title="Edit Requirement"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteIsoRequirement(req.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded cursor-pointer" title="Delete Requirement"
                              >
                                <Archive className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Internal Quality Audit (IQA) Program Schedule */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 border-t-4 border-t-[#FF9501] overflow-hidden p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#FF9501]" />
                  CTU Argao Internal Quality Audit (IQA) Program Schedule
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Configured campus-wide audit dates and focus scope for CTU Argao (Institutional QMS)</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-orange-50 text-[#D97E00] text-xs font-bold rounded-lg border border-[#FF9501]/20">
                  {iqaSchedule?.academic_year || "IQA Audit Cycle 2025-2026"}
                </span>

                {userRole === "ADMIN" && (
                  <button
                    onClick={() => { setIqaDayForm({ day_number: iqaDays.length + 1, day_date: "", title: "", scope: "" }); setShowAddIqaDayModal(true); }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FF9501] text-white text-xs font-bold rounded-lg hover:bg-[#D97E00] transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Audit Day
                  </button>
                )}
              </div>
            </div>

            {isLoadingIqaDays ? (
              <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#FF9501]" /></div>
            ) : iqaDays.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">No IQA audit days configured. Click "+ Add Audit Day" to add one.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {iqaDays.map((day, idx) => (
                  <div key={day.id || idx} className="p-5 bg-white border border-gray-200 hover:border-[#FF9501] rounded-xl space-y-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                    <div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="px-2.5 py-0.5 bg-[#FF9501] text-white text-[10px] font-extrabold uppercase rounded shadow-2xs">
                          Day {day.day_number}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                          <Calendar className="h-3.5 w-3.5 text-[#FF9501]" />
                          <span>{day.day_date || "TBD"}</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-gray-900 text-sm mt-3 group-hover:text-[#FF9501] transition-colors">{day.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed mt-1.5">{day.scope}</p>
                    </div>

                    {userRole === "ADMIN" && (
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setEditingIqaDay(day); setShowEditIqaDayModal(true); }}
                          className="p-1.5 text-gray-400 hover:text-[#FF9501] transition-colors rounded cursor-pointer" title="Edit Day"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setDeletingIqaDay(day); setShowDeleteIqaDayModal(true); }}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded cursor-pointer" title="Delete Day"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="results" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Left Column: Timeline & History */}
            <div className="w-full lg:w-2/3 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-100 p-6 bg-[#F9FAFB] flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <History className="w-5 h-5 text-[#FF9501]" />
                      Accreditation Timeline
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Historical milestones for {selectedProgram}</p>
                  </div>
                  <button className="flex items-center gap-2 text-[#D97E00] hover:text-[#995900] text-xs font-bold bg-[#FFF4E5] px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                    <Download className="w-3.5 h-3.5" /> Export Report
                  </button>
                </div>
                
                <div className="p-6 relative">
                  {/* Vertical Line */}
                  <div className="absolute left-10 top-10 bottom-10 w-0.5 bg-gray-100 z-0"></div>
                  
                  <div className="space-y-8 relative z-10">
                    {[
                      { year: "2024", title: "AACCUP Level III Re-accredited", type: "Active", date: "Valid until Oct 2027", icon: Award, color: "text-[#006837]", bg: "bg-green-100", ring: "ring-[#006837]/20" },
                      { year: "2021", title: "AACCUP Level II Re-accredited", type: "Expired", date: "Valid until Oct 2024", icon: Check, color: "text-gray-400", bg: "bg-gray-100", ring: "ring-gray-200" },
                      { year: "2019", title: "CHED Certificate of Program Compliance (COPC)", type: "Active", date: "Indefinite Validity", icon: FileCheck, color: "text-[#FF9501]", bg: "bg-orange-100", ring: "ring-[#FF9501]/20" },
                      { year: "2018", title: "AACCUP Level I Accredited", type: "Expired", date: "Valid until Oct 2021", icon: Check, color: "text-gray-400", bg: "bg-gray-100", ring: "ring-gray-200" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className={`w-8 h-8 rounded-full ${item.bg} flex items-center justify-center shrink-0 ring-4 ring-white shadow-sm mt-1`}>
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div className="flex-1 bg-white border border-gray-100 hover:border-[#FF9501]/30 hover:shadow-md transition-all p-4 rounded-xl group cursor-pointer">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-[#FF9501] uppercase tracking-wider">{item.year}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${item.type === 'Active' ? 'bg-green-50 text-[#006837]' : 'bg-gray-100 text-gray-500'}`}>
                              {item.type}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#FF9501] transition-colors">{item.title}</h3>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Certificates & Metrics */}
            <div className="w-full lg:w-1/3 space-y-6">
              
              {/* Metrics Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-5">
                  <TrendingUp className="w-4 h-4 text-[#FF9501]" /> Program Excellence
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "Faculty with Master's/PhD", value: "85%", trend: "+12% from 2021" },
                    { label: "Licensure Passing Rate", value: "92.4%", trend: "Top 5 in Region VII" },
                    { label: "Employability (1 yr)", value: "88%", trend: "Industry Aligned" }
                  ].map((metric, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{metric.label}</p>
                      <div className="flex items-end justify-between mt-1">
                        <span className="text-xl font-black text-gray-900">{metric.value}</span>
                        <span className="text-[10px] font-bold text-[#006837] bg-green-100 px-2 py-0.5 rounded">{metric.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Official Certificates */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-5">
                  <FileBadge className="w-4 h-4 text-[#FF9501]" /> Official Certificates
                </h3>
                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-br from-[#FFF4E5] to-orange-50/30 rounded-xl border border-[#FF9501]/20 group cursor-pointer hover:shadow-md transition-all relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-16 h-16 bg-[#FF9501]/10 rounded-full blur-2xl -mr-5 -mt-5"></div>
                    <div className="flex items-center gap-3 relative z-10">
                      <Award className="w-8 h-8 text-[#D97E00]" />
                      <div>
                        <p className="text-xs font-bold text-gray-900 group-hover:text-[#FF9501] transition-colors">AACCUP Level III Certificate.pdf</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Issued: Oct 12, 2024 • 2.4 MB</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 group cursor-pointer hover:border-[#FF9501]/40 hover:bg-[#FFF4E5]/50 transition-all">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-8 h-8 text-gray-400 group-hover:text-[#FF9501] transition-colors" />
                      <div>
                        <p className="text-xs font-bold text-gray-900 group-hover:text-[#FF9501] transition-colors">CHED COPC Document.pdf</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Issued: Mar 05, 2019 • 1.1 MB</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button className="w-full mt-4 py-2 flex items-center justify-center gap-2 text-xs font-bold text-[#D97E00] hover:text-[#995900] bg-orange-50 rounded-lg transition-colors cursor-pointer">
                  View Full Registry <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* --- AACCUP UPLOAD MODAL --- */}
      {showUploadModal && uploadTargetArea && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F5F7FA]">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">Upload Accreditation Evidence</h2>
                <p className="text-xs font-semibold text-[#D97E00] mt-1 uppercase tracking-wider">Tagging evidence for {selectedProgram}</p>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-orange-50/50 rounded-xl border border-[#FF9501]/10">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Target Area (Locked)</label>
                  <div className="text-sm font-bold text-[#D97E00]">{uploadTargetArea.code}</div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Category (Locked)</label>
                  <div className="text-sm font-bold text-[#D97E00]">Accreditation Evidence</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Document Name</label>
                <input
                  type="text" required value={uploadForm.fileName} onChange={(e) => setUploadForm({...uploadForm, fileName: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF9501] transition-all font-medium text-sm"
                  placeholder="e.g., Faculty Credentials Summary 2026.pdf"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Fulfills Requirement</label>
                <select
                  required value={uploadForm.requirementTarget} onChange={(e) => setUploadForm({...uploadForm, requirementTarget: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF9501] transition-all cursor-pointer font-medium text-sm"
                >
                  <option value="" disabled>Select the specific checklist requirement...</option>
                  {areaDetails.requirements.map((req: any) => (
                    <option key={req.id} value={req.text}>{req.text}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">File Upload</label>
                <div 
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    isDragging ? "border-[#FF9501] bg-[#FFF4E5]" : "border-gray-200 hover:border-[#FF9501] bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <FileText className="h-10 w-10 text-[#FF9501] mb-3" />
                      <p className="text-sm font-bold text-gray-900">{selectedFile.name}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-gray-700">Drag or click to upload PDF/DOCX</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Max 50MB</p>
                    </div>
                  )}
                  <input type="file" accept=".pdf,.docx,.txt" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 px-5 py-3 text-sm font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer uppercase tracking-wider">
                  Cancel
                </button>
                <button type="submit" disabled={!uploadForm.fileName || !uploadForm.requirementTarget || !selectedFile || isUploading} className="flex-1 px-5 py-3 text-sm font-bold bg-[#FF9501] text-white rounded-xl hover:bg-[#D97E00] disabled:opacity-50 transition-all flex justify-center items-center gap-2 cursor-pointer active:scale-95 shadow-md uppercase tracking-wider">
                  {isUploading ? <><Loader2 className="h-4 w-4 animate-spin"/> Processing...</> : "Submit Evidence"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- NEW CHED UPLOAD MODAL --- */}
      {showChedUploadModal && selectedChedReq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F5F7FA]">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">Upload CHED Evidence</h2>
                <p className="text-xs font-semibold text-[#D97E00] mt-1 uppercase tracking-wider">Tagging for {selectedProgram}</p>
              </div>
              <button onClick={() => setShowChedUploadModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleChedUploadSubmit} className="p-6 space-y-5">
              <div className="p-4 bg-orange-50/50 rounded-xl border border-[#FF9501]/10">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Target Requirement (Locked)</label>
                <div className="text-sm font-bold text-gray-900">{selectedChedReq.description}</div>
                <div className="text-[10px] font-bold text-[#D97E00] uppercase tracking-wider mt-1">{selectedChedReq.cmo_name}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Document Name</label>
                <input
                  type="text" required value={uploadForm.fileName} onChange={(e) => setUploadForm({...uploadForm, fileName: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF9501] transition-all font-medium text-sm"
                  placeholder="e.g., Dean's Transcript of Records 2026.pdf"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">File Upload</label>
                <div 
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    isDragging ? "border-[#FF9501] bg-[#FFF4E5]" : "border-gray-200 hover:border-[#FF9501] bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <FileText className="h-10 w-10 text-[#FF9501] mb-3" />
                      <p className="text-sm font-bold text-gray-900">{selectedFile.name}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-gray-700">Drag or click to upload PDF/DOCX</p>
                    </div>
                  )}
                  <input type="file" accept=".pdf,.docx,.txt" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowChedUploadModal(false)} className="flex-1 px-5 py-3 text-sm font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer uppercase tracking-wider">
                  Cancel
                </button>
                <button type="submit" disabled={!uploadForm.fileName || !selectedFile || isUploading} className="flex-1 px-5 py-3 text-sm font-bold bg-[#FF9501] text-white rounded-xl hover:bg-[#D97E00] disabled:opacity-50 transition-all flex justify-center items-center gap-2 cursor-pointer active:scale-95 shadow-md uppercase tracking-wider">
                  {isUploading ? <><Loader2 className="h-4 w-4 animate-spin"/> Processing...</> : "Submit Evidence"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADMIN ONLY: ADD CHED REQUIREMENT MODAL --- */}
      {showAddChedReqModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F5F7FA]">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">Add Requirement</h2>
                <p className="text-xs font-semibold text-[#D97E00] mt-1 uppercase tracking-wider">Program: {selectedProgram}</p>
              </div>
              <button onClick={() => setShowAddChedReqModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleAddChedRequirement} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">CMO Reference</label>
                <input
                  type="text" required value={newChedReq.cmo_name} onChange={(e) => setNewChedReq({...newChedReq, cmo_name: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF9501] transition-all font-medium text-sm"
                  placeholder="e.g., CMO 25 series of 2015"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Requirement Description</label>
                <textarea
                  required value={newChedReq.description} onChange={(e) => setNewChedReq({...newChedReq, description: e.target.value})} rows={3}
                  className="w-full px-4 py-3 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF9501] transition-all font-medium text-sm resize-none"
                  placeholder="e.g., The Dean must hold a Master's degree in Information Technology."
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddChedReqModal(false)} className="flex-1 px-5 py-3 text-sm font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer uppercase tracking-wider">
                  Cancel
                </button>
                <button type="submit" disabled={!newChedReq.cmo_name || !newChedReq.description || isAddingReq} className="flex-1 px-5 py-3 text-sm font-bold bg-[#FF9501] text-white rounded-xl hover:bg-[#D97E00] disabled:opacity-50 transition-all flex justify-center items-center gap-2 cursor-pointer active:scale-95 shadow-md uppercase tracking-wider">
                  {isAddingReq ? <><Loader2 className="h-4 w-4 animate-spin"/> Saving...</> : "Add to Checklist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADMIN ONLY: EDIT CHED REQUIREMENT MODAL --- */}
      {showEditChedModal && editingChedReq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F5F7FA]">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">Edit Requirement</h2>
                <p className="text-xs font-semibold text-[#D97E00] mt-1 uppercase tracking-wider">Program: {selectedProgram}</p>
              </div>
              <button onClick={() => setShowEditChedModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleEditChedRequirement} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">CMO Reference</label>
                <input
                  type="text" required value={editingChedReq.cmo_name} onChange={(e) => setEditingChedReq({...editingChedReq, cmo_name: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF9501] transition-all font-medium text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Requirement Description</label>
                <textarea
                  required value={editingChedReq.description} onChange={(e) => setEditingChedReq({...editingChedReq, description: e.target.value})} rows={3}
                  className="w-full px-4 py-3 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF9501] transition-all font-medium text-sm resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowEditChedModal(false)} className="flex-1 px-5 py-3 text-sm font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer uppercase tracking-wider">
                  Cancel
                </button>
                <button type="submit" disabled={!editingChedReq.cmo_name || !editingChedReq.description || isEditingReq} className="flex-1 px-5 py-3 text-sm font-bold bg-[#FF9501] text-white rounded-xl hover:bg-[#D97E00] disabled:opacity-50 transition-all flex justify-center items-center gap-2 cursor-pointer active:scale-95 shadow-md uppercase tracking-wider">
                  {isEditingReq ? <><Loader2 className="h-4 w-4 animate-spin"/> Saving...</> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADMIN AACCUP FEEDBACK MODAL --- */}
      {showFeedbackModal && feedbackDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-red-100">
            <div className="p-6 border-b border-red-50 bg-red-50 flex items-center gap-3">
              <MessageSquareWarning className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-bold text-red-700">Request Revision</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                You are requesting a revision for <strong className="text-gray-900">{feedbackDoc.name}</strong>. Please provide specific feedback for the faculty member.
              </p>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="e.g., 'Please upload the document with correct signatures'..."
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none text-sm font-medium"
              />
            </div>
            <div className="p-5 border-t border-gray-100 bg-[#F9FAFB] flex justify-end gap-3">
              <button onClick={() => setShowFeedbackModal(false)} disabled={isReviewing} className="px-5 py-2.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer uppercase tracking-widest">
                Cancel
              </button>
              <button 
                onClick={() => handleAdminReview(feedbackDoc.name, "Needs Revision", feedbackText)} 
                disabled={isReviewing || !feedbackText.trim()}
                className="px-5 py-2.5 text-xs font-bold text-white rounded-xl bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer uppercase tracking-widest"
              >
                {isReviewing ? <><Loader2 className="h-3 w-3 animate-spin"/> Processing...</> : "Submit Feedback"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- AACCUP DELETE/ARCHIVE MODAL --- */}
      {showDeleteModal && docToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-red-100">
            <div className="p-6 border-b border-red-50 bg-red-50 flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-bold text-red-700">Archive Evidence</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                Are you sure you want to remove <span className="font-bold text-gray-900">"{docToDelete}"</span>?
              </p>
              <p className="text-xs text-gray-500 leading-relaxed italic">
                This document will be archived and will no longer count towards compliance, though it remains in the system for audit.
              </p>
            </div>
            <div className="p-6 border-t border-gray-100 bg-[#F9FAFB] flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="px-5 py-2.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer uppercase tracking-widest">
                Cancel
              </button>
              <button onClick={executeDelete} disabled={isDeleting} className="px-5 py-2.5 text-xs font-bold text-white rounded-xl bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer uppercase tracking-widest shadow-md">
                {isDeleting ? <><Loader2 className="h-3 w-3 animate-spin"/> Archiving...</> : "Yes, Archive File"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CHED DELETE REQUIREMENT MODAL --- */}
      {showDeleteChedReqModal && chedReqToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-red-100">
            <div className="p-6 border-b border-red-50 bg-red-50 flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-bold text-red-700">Delete Requirement</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                Are you sure you want to permanently delete this requirement?
              </p>
              <p className="text-xs text-red-500 leading-relaxed italic font-bold">
                Warning: This will also permanently delete any evidence documents attached to this requirement.
              </p>
            </div>
            <div className="p-6 border-t border-gray-100 bg-[#F9FAFB] flex justify-end gap-3">
              <button onClick={() => setShowDeleteChedReqModal(false)} disabled={isDeleting} className="px-5 py-2.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer uppercase tracking-widest">
                Cancel
              </button>
              <button onClick={executeDeleteChedRequirement} disabled={isDeleting} className="px-5 py-2.5 text-xs font-bold text-white rounded-xl bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer uppercase tracking-widest shadow-md">
                {isDeleting ? <><Loader2 className="h-3 w-3 animate-spin"/> Deleting...</> : "Yes, Delete Requirement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CHED DELETE EVIDENCE MODAL --- */}
      {showDeleteChedEvidenceModal && chedEvidenceToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-red-100">
            <div className="p-6 border-b border-red-50 bg-red-50 flex items-center gap-3">
              <Archive className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-bold text-red-700">Remove Attached Evidence</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                Are you sure you want to remove <span className="font-bold text-gray-900">"{chedEvidenceToDelete.document_name}"</span>?
              </p>
              <p className="text-xs text-gray-500 leading-relaxed italic">
                If this is the only evidence attached, the requirement status will automatically revert to "Not Compliant".
              </p>
            </div>
            <div className="p-6 border-t border-gray-100 bg-[#F9FAFB] flex justify-end gap-3">
              <button onClick={() => setShowDeleteChedEvidenceModal(false)} disabled={isDeleting} className="px-5 py-2.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer uppercase tracking-widest">
                Cancel
              </button>
              <button onClick={executeDeleteChedEvidence} disabled={isDeleting} className="px-5 py-2.5 text-xs font-bold text-white rounded-xl bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer uppercase tracking-widest shadow-md">
                {isDeleting ? <><Loader2 className="h-3 w-3 animate-spin"/> Removing...</> : "Yes, Remove Evidence"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ISO UPLOAD EVIDENCE MODAL --- */}
      {showIsoUploadModal && selectedIsoReq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border-t-4 border-t-[#FF9501]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB]">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">Upload ISO Clause Evidence</h2>
                <p className="text-xs font-semibold text-[#FF9501] mt-1">{selectedIsoReq.iso_clause}: {selectedIsoReq.title}</p>
              </div>
              <button onClick={() => setShowIsoUploadModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleIsoUploadSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-2 uppercase tracking-wider">
                  Target Clause & Office
                </label>
                <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 text-xs space-y-1">
                  <p className="font-bold text-[#1F2937]">{selectedIsoReq.auditee_office}</p>
                  <p className="text-gray-600 leading-snug">{selectedIsoReq.description}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                  Document Title / File Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={uploadForm.fileName}
                  onChange={(e) => setUploadForm({ ...uploadForm, fileName: e.target.value })}
                  placeholder="e.g. Risk Assessment Matrix 2025.pdf"
                  required
                  className="w-full px-4 py-3 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                  Select Evidence Document (PDF/Image) <span className="text-red-500">*</span>
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    isDragging ? "border-[#FF9501] bg-orange-50" : "border-gray-300 hover:border-[#FF9501] bg-[#F5F7FA]"
                  }`}
                >
                  <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" />
                  <Upload className="h-8 w-8 text-[#FF9501] mx-auto mb-2" />
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-bold text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Click or drag & drop evidence file here</p>
                      <p className="text-xs text-gray-400 mt-1">Supports PDF, DOCX, PNG (Max 25MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowIsoUploadModal(false)} disabled={isUploading} className="px-5 py-2.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isUploading || !selectedFile || !uploadForm.fileName.trim()} className="px-5 py-2.5 text-xs font-bold text-white bg-[#FF9501] hover:bg-[#D97E00] rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2 uppercase tracking-widest cursor-pointer">
                  {isUploading ? <><Loader2 className="h-4 w-4 animate-spin"/> Uploading...</> : "Submit Evidence"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADMIN ADD ISO REQUIREMENT MODAL --- */}
      {showAddIsoReqModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border-t-4 border-t-[#FF9501]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB]">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">Add ISO 9001:2015 Clause Requirement</h2>
                <p className="text-xs text-gray-500 mt-0.5">Configure a new quality audit checklist item for {selectedProgram}</p>
              </div>
              <button onClick={() => setShowAddIsoReqModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddIsoRequirement} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                    ISO Clause <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newIsoReq.iso_clause}
                    onChange={(e) => setNewIsoReq({ ...newIsoReq, iso_clause: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501]"
                  >
                    <option value="Clause 6.1">Clause 6.1 (Risks & Opportunities)</option>
                    <option value="Clause 7.1">Clause 7.1 (Resources & Facilities)</option>
                    <option value="Clause 7.2">Clause 7.2 (Faculty Competence)</option>
                    <option value="Clause 7.5">Clause 7.5 (Documented Info)</option>
                    <option value="Clause 8.1 & 8.5">Clause 8.1 & 8.5 (Curriculum)</option>
                    <option value="Clause 8.4">Clause 8.4 (External Providers)</option>
                    <option value="Clause 8.6 & 10.2">Clause 8.6 & 10.2 (Nonconformity)</option>
                    <option value="Clause 9.1 & 9.1.2">Clause 9.1 & 9.1.2 (Evaluation)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                    Risk Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newIsoReq.risk_level}
                    onChange={(e) => setNewIsoReq({ ...newIsoReq, risk_level: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501]"
                  >
                    <option value="High">High Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="Low">Low Risk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                  Auditee Office <span className="text-red-500">*</span>
                </label>
                <select
                  value={newIsoReq.auditee_office}
                  onChange={(e) => setNewIsoReq({ ...newIsoReq, auditee_office: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501]"
                >
                  <option value="Director of Instruction (DOI) & SAO">Director of Instruction (DOI) & SAO</option>
                  <option value="Human Resources Management Office (HRMO)">Human Resources Management Office (HRMO)</option>
                  <option value="Document Controller & Registrar">Document Controller & Registrar</option>
                  <option value="College Deans & Program Chairs">College Deans & Program Chairs</option>
                  <option value="BAC / Procurement & Supply">BAC / Procurement & Supply</option>
                  <option value="Property Custodian & Finance">Property Custodian & Finance</option>
                  <option value="Registrar & MIS">Registrar & MIS</option>
                  <option value="Quality Assurance & Deans">Quality Assurance & Deans</option>
                  <option value="Library Services">Library Services</option>
                  <option value="Student Affairs Office (SAO)">Student Affairs Office (SAO)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                  Requirement Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newIsoReq.title}
                  onChange={(e) => setNewIsoReq({ ...newIsoReq, title: e.target.value })}
                  placeholder="e.g. Risk Assessment Matrix & Attrition Plan"
                  required
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                  Audit Scope & Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newIsoReq.description}
                  onChange={(e) => setNewIsoReq({ ...newIsoReq, description: e.target.value })}
                  placeholder="Describe specific audit focus, required documentation, and verification criteria..."
                  rows={3}
                  required
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddIsoReqModal(false)} disabled={isAddingIsoReq} className="px-5 py-2.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isAddingIsoReq || !newIsoReq.title.trim()} className="px-5 py-2.5 text-xs font-bold text-white bg-[#FF9501] hover:bg-[#D97E00] rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2 uppercase tracking-widest cursor-pointer">
                  {isAddingIsoReq ? <><Loader2 className="h-4 w-4 animate-spin"/> Adding...</> : "Add ISO Clause"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADMIN EDIT ISO REQUIREMENT MODAL --- */}
      {showEditIsoModal && editingIsoReq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border-t-4 border-t-[#FF9501]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB]">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">Edit ISO Clause Requirement</h2>
                <p className="text-xs text-gray-500 mt-0.5">Modify clause details, auditee office, or risk classification</p>
              </div>
              <button onClick={() => setShowEditIsoModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditIsoRequirement} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                    ISO Clause
                  </label>
                  <input
                    type="text"
                    value={editingIsoReq.iso_clause}
                    onChange={(e) => setEditingIsoReq({ ...editingIsoReq, iso_clause: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                    Risk Level
                  </label>
                  <select
                    value={editingIsoReq.risk_level}
                    onChange={(e) => setEditingIsoReq({ ...editingIsoReq, risk_level: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501]"
                  >
                    <option value="High">High Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="Low">Low Risk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                  Auditee Office
                </label>
                <select
                  value={editingIsoReq.auditee_office}
                  onChange={(e) => setEditingIsoReq({ ...editingIsoReq, auditee_office: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501]"
                >
                  <option value="Director of Instruction (DOI) & SAO">Director of Instruction (DOI) & SAO</option>
                  <option value="Human Resources Management Office (HRMO)">Human Resources Management Office (HRMO)</option>
                  <option value="Document Controller & Registrar">Document Controller & Registrar</option>
                  <option value="College Deans & Program Chairs">College Deans & Program Chairs</option>
                  <option value="BAC / Procurement & Supply">BAC / Procurement & Supply</option>
                  <option value="Property Custodian & Finance">Property Custodian & Finance</option>
                  <option value="Registrar & MIS">Registrar & MIS</option>
                  <option value="Quality Assurance & Deans">Quality Assurance & Deans</option>
                  <option value="Library Services">Library Services</option>
                  <option value="Student Affairs Office (SAO)">Student Affairs Office (SAO)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                  Requirement Title
                </label>
                <input
                  type="text"
                  value={editingIsoReq.title}
                  onChange={(e) => setEditingIsoReq({ ...editingIsoReq, title: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                  Audit Scope & Description
                </label>
                <textarea
                  value={editingIsoReq.description}
                  onChange={(e) => setEditingIsoReq({ ...editingIsoReq, description: e.target.value })}
                  rows={3}
                  required
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowEditIsoModal(false)} disabled={isEditingIsoReq} className="px-5 py-2.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isEditingIsoReq || !editingIsoReq.title.trim()} className="px-5 py-2.5 text-xs font-bold text-white bg-[#FF9501] hover:bg-[#D97E00] rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2 uppercase tracking-widest cursor-pointer">
                  {isEditingIsoReq ? <><Loader2 className="h-4 w-4 animate-spin"/> Saving...</> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE ISO REQUIREMENT CONFIRMATION MODAL --- */}
      {showDeleteIsoReqModal && isoReqToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border-t-4 border-t-red-600">
            <div className="p-6 border-b border-red-50 bg-red-50 flex items-center gap-3">
              <Archive className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-bold text-red-700">Delete ISO Clause Requirement</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                Are you sure you want to delete <span className="font-bold text-gray-900">"{isoReqToDelete.iso_clause}: {isoReqToDelete.title}"</span>?
              </p>
              <p className="text-xs text-gray-500 leading-relaxed italic">
                This action will remove the clause requirement and all associated evidence uploads for {selectedProgram}.
              </p>
            </div>
            <div className="p-6 border-t border-gray-100 bg-[#F9FAFB] flex justify-end gap-3">
              <button onClick={() => setShowDeleteIsoReqModal(false)} disabled={isDeleting} className="px-5 py-2.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest cursor-pointer">
                Cancel
              </button>
              <button onClick={executeDeleteIsoRequirement} disabled={isDeleting} className="px-5 py-2.5 text-xs font-bold text-white rounded-xl bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50 flex justify-center items-center gap-2 uppercase tracking-widest shadow-md cursor-pointer">
                {isDeleting ? <><Loader2 className="h-4 w-4 animate-spin"/> Deleting...</> : "Yes, Delete Requirement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT 3-DAY IQA AUDIT PROGRAM SCHEDULE MODAL --- */}
      {showEditIqaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border-t-4 border-t-[#FF9501] max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB] shrink-0">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">Edit 3-Day IQA Audit Program Schedule</h2>
                <p className="text-xs text-gray-500 mt-0.5">Update annual audit cycle dates and focus areas for {selectedProgram}</p>
              </div>
              <button onClick={() => setShowEditIqaModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIqaSchedule} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                  Academic Year / Audit Cycle Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={iqaFormData.academic_year}
                  onChange={(e) => setIqaFormData({ ...iqaFormData, academic_year: e.target.value })}
                  placeholder="e.g. IQA Audit Cycle 2026-2027"
                  required
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501]"
                />
              </div>

              {/* Day 1 Inputs */}
              <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#D97E00] uppercase tracking-wider">Day 1 Schedule</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Day 1 Date</label>
                    <input
                      type="text"
                      value={iqaFormData.day1_date}
                      onChange={(e) => setIqaFormData({ ...iqaFormData, day1_date: e.target.value })}
                      placeholder="e.g. Sept 10, 2026"
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Day 1 Title</label>
                    <input
                      type="text"
                      value={iqaFormData.day1_title}
                      onChange={(e) => setIqaFormData({ ...iqaFormData, day1_title: e.target.value })}
                      placeholder="Title / Phase Name"
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Day 1 Scope & Focus</label>
                  <textarea
                    value={iqaFormData.day1_scope}
                    onChange={(e) => setIqaFormData({ ...iqaFormData, day1_scope: e.target.value })}
                    rows={2}
                    required
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium resize-none"
                  />
                </div>
              </div>

              {/* Day 2 Inputs */}
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Day 2 Schedule</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Day 2 Date</label>
                    <input
                      type="text"
                      value={iqaFormData.day2_date}
                      onChange={(e) => setIqaFormData({ ...iqaFormData, day2_date: e.target.value })}
                      placeholder="e.g. Sept 11, 2026"
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Day 2 Title</label>
                    <input
                      type="text"
                      value={iqaFormData.day2_title}
                      onChange={(e) => setIqaFormData({ ...iqaFormData, day2_title: e.target.value })}
                      placeholder="Title / Phase Name"
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Day 2 Scope & Focus</label>
                  <textarea
                    value={iqaFormData.day2_scope}
                    onChange={(e) => setIqaFormData({ ...iqaFormData, day2_scope: e.target.value })}
                    rows={2}
                    required
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium resize-none"
                  />
                </div>
              </div>

              {/* Day 3 Inputs */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#006837] uppercase tracking-wider">Day 3 Schedule</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Day 3 Date</label>
                    <input
                      type="text"
                      value={iqaFormData.day3_date}
                      onChange={(e) => setIqaFormData({ ...iqaFormData, day3_date: e.target.value })}
                      placeholder="e.g. Sept 12, 2026"
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Day 3 Title</label>
                    <input
                      type="text"
                      value={iqaFormData.day3_title}
                      onChange={(e) => setIqaFormData({ ...iqaFormData, day3_title: e.target.value })}
                      placeholder="Title / Phase Name"
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Day 3 Scope & Focus</label>
                  <textarea
                    value={iqaFormData.day3_scope}
                    onChange={(e) => setIqaFormData({ ...iqaFormData, day3_scope: e.target.value })}
                    rows={2}
                    required
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium resize-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setShowEditIqaModal(false)} disabled={isSavingIqa} className="px-5 py-2.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isSavingIqa || !iqaFormData.academic_year.trim()} className="px-5 py-2.5 text-xs font-bold text-white bg-[#FF9501] hover:bg-[#D97E00] rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2 uppercase tracking-widest cursor-pointer">
                  {isSavingIqa ? <><Loader2 className="h-4 w-4 animate-spin"/> Saving...</> : "Save Annual Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* --- ADD DYNAMIC IQA AUDIT DAY MODAL --- */}
      {showAddIqaDayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border-t-4 border-t-[#FF9501]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB]">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">Add IQA Audit Day</h2>
                <p className="text-xs text-gray-500 mt-0.5">Configure a new audit phase date and scope for CTU Argao Campus QMS</p>
              </div>
              <button onClick={() => setShowAddIqaDayModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddIqaDaySubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                    Day Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={iqaDayForm.day_number}
                    onChange={(e) => setIqaDayForm({ ...iqaDayForm, day_number: parseInt(e.target.value) || 1 })}
                    required
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                    Audit Date (Calendar Picker) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={iqaDayForm.day_date}
                    onChange={(e) => setIqaDayForm({ ...iqaDayForm, day_date: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501] cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                  Phase Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={iqaDayForm.title}
                  onChange={(e) => setIqaDayForm({ ...iqaDayForm, title: e.target.value })}
                  placeholder="e.g. Context, Risk & Resource Audit"
                  required
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                  Audit Focus & Scope <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={iqaDayForm.scope}
                  onChange={(e) => setIqaDayForm({ ...iqaDayForm, scope: e.target.value })}
                  placeholder="Describe specific offices to be audited, target clauses, and verification criteria..."
                  rows={3}
                  required
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddIqaDayModal(false)} disabled={isSavingIqaDay} className="px-5 py-2.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isSavingIqaDay || !iqaDayForm.title.trim() || !iqaDayForm.day_date.trim()} className="px-5 py-2.5 text-xs font-bold text-white bg-[#FF9501] hover:bg-[#D97E00] rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2 uppercase tracking-widest cursor-pointer">
                  {isSavingIqaDay ? <><Loader2 className="h-4 w-4 animate-spin"/> Adding...</> : "Add Audit Day"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT DYNAMIC IQA AUDIT DAY MODAL --- */}
      {showEditIqaDayModal && editingIqaDay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border-t-4 border-t-[#FF9501]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F9FAFB]">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">Edit IQA Audit Day</h2>
                <p className="text-xs text-gray-500 mt-0.5">Modify date, phase title, or audit focus scope</p>
              </div>
              <button onClick={() => setShowEditIqaDayModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditIqaDaySubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                    Day Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingIqaDay.day_number}
                    onChange={(e) => setEditingIqaDay({ ...editingIqaDay, day_number: parseInt(e.target.value) || 1 })}
                    required
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                    Audit Date (Calendar Picker) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editingIqaDay.day_date}
                    onChange={(e) => setEditingIqaDay({ ...editingIqaDay, day_date: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501] cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                  Phase Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingIqaDay.title}
                  onChange={(e) => setEditingIqaDay({ ...editingIqaDay, title: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
                  Audit Focus & Scope <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editingIqaDay.scope}
                  onChange={(e) => setEditingIqaDay({ ...editingIqaDay, scope: e.target.value })}
                  rows={3}
                  required
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF9501] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowEditIqaDayModal(false)} disabled={isSavingIqaDay} className="px-5 py-2.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isSavingIqaDay || !editingIqaDay.title.trim() || !editingIqaDay.day_date.trim()} className="px-5 py-2.5 text-xs font-bold text-white bg-[#FF9501] hover:bg-[#D97E00] rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2 uppercase tracking-widest cursor-pointer">
                  {isSavingIqaDay ? <><Loader2 className="h-4 w-4 animate-spin"/> Saving...</> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE DYNAMIC IQA AUDIT DAY CONFIRMATION MODAL --- */}
      {showDeleteIqaDayModal && deletingIqaDay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border-t-4 border-t-red-600">
            <div className="p-6 border-b border-red-50 bg-red-50 flex items-center gap-3">
              <Archive className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-bold text-red-700">Delete IQA Audit Day</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                Are you sure you want to delete <span className="font-bold text-gray-900">"Day {deletingIqaDay.day_number}: {deletingIqaDay.title}"</span>?
              </p>
            </div>
            <div className="p-6 border-t border-gray-100 bg-[#F9FAFB] flex justify-end gap-3">
              <button onClick={() => setShowDeleteIqaDayModal(false)} disabled={isDeleting} className="px-5 py-2.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest cursor-pointer">
                Cancel
              </button>
              <button onClick={executeDeleteIqaDay} disabled={isDeleting} className="px-5 py-2.5 text-xs font-bold text-white rounded-xl bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50 flex justify-center items-center gap-2 uppercase tracking-widest shadow-md cursor-pointer">
                {isDeleting ? <><Loader2 className="h-4 w-4 animate-spin"/> Deleting...</> : "Yes, Delete Day"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}