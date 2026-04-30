import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, TrendingUp, Loader2, Award, Calendar, BookOpen, AlertTriangle, Calculator, ChevronDown, ChevronUp, X } from "lucide-react";
import axios from "axios";

interface SubjectScratchpad {
  subject: string;
  units: number;
  grade: number;
  weighted_score: number;
}

interface SemesterData {
  semester_name: string;
  has_missing_grades: boolean;
  subjects_scratchpad?: SubjectScratchpad[];
}

interface EvaluationResult {
  semesters: SemesterData[];
  summary: string;
  recommendations: string[];
}

export function GradeEvaluation() {
  const [isDragging, setIsDragging] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [expandedSemesters, setExpandedSemesters] = useState<number[]>([]);

  const toggleSemester = (index: number) => {
    setExpandedSemesters(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  // --- DETERMINISTIC REACT MATH ENGINE ---
  const getAccurateMath = (semester: SemesterData) => {
    if (!semester.subjects_scratchpad || semester.subjects_scratchpad.length === 0) {
      return { gwa: "N/A", totalUnits: "0", status: "Unknown" };
    }

    let totalUnits = 0;
    let totalWeighted = 0;
    let hasFailed = false;

    semester.subjects_scratchpad.forEach(sub => {
      if (sub.grade > 0 && sub.grade <= 5.0) {
        const units = Number(sub.units) || 0;
        const grade = Number(sub.grade) || 0;
        
        totalUnits += units;
        totalWeighted += (units * grade);

        if (grade > 3.0) hasFailed = true;
      }
    });

    if (totalUnits === 0) return { gwa: "N/A", totalUnits: "0", status: "Pending" };

    const calcGwa = (totalWeighted / totalUnits).toFixed(2);
    let status = "Pass";
    if (hasFailed) status = "Fail";
    else if (Number(calcGwa) <= 1.75) status = "Dean's Lister";
    else if (semester.has_missing_grades) status = "Conditional";

    return { gwa: calcGwa, totalUnits: totalUnits.toFixed(1), status };
  };

  const getCumulativeMath = (semesters: SemesterData[]) => {
    let globalUnits = 0;
    let globalWeighted = 0;
    let hasFailed = false;

    semesters.forEach(sem => {
      sem.subjects_scratchpad?.forEach(sub => {
        if (sub.grade > 0 && sub.grade <= 5.0) {
          globalUnits += Number(sub.units);
          globalWeighted += (Number(sub.units) * Number(sub.grade));
          if (sub.grade > 3.0) hasFailed = true;
        }
      });
    });

    if (globalUnits === 0) return { gwa: "N/A", status: "Pending" };
    
    const finalGwa = (globalWeighted / globalUnits).toFixed(2);
    let status = "Pass";
    if (hasFailed) status = "Fail";
    else if (Number(finalGwa) <= 1.75) status = "Dean's Lister";

    return { gwa: finalGwa, status };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setResult(null); setExpandedSemesters([]);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents opening the file dialog
    setSelectedFile(null);
    setResult(null);
    setExpandedSemesters([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitForEvaluation = async () => {
    if (!selectedFile) return;
    setIsEvaluating(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post("http://localhost:8000/evaluate-grades", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(response.data);
    } catch (error) {
      alert("Failed to evaluate grades. Ensure it is a valid PDF.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "Dean's Lister") return "bg-gradient-to-r from-[#D4AF37] to-[#FDB913] text-white shadow-sm border border-[#D4AF37]";
    if (status === "Pass") return "bg-[#006837] text-white shadow-sm";
    if (status === "Fail") return "bg-[#CE0000] text-white shadow-sm";
    return "bg-[#FDB913] text-gray-900 shadow-sm";
  };

  const cumulativeData = result && Array.isArray(result.semesters) ? getCumulativeMath(result.semesters) : { gwa: "N/A", status: "Unknown" };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">AI Grade Evaluation</h2>
        <p className="text-gray-600 mt-1">Upload your CTU grade slip for instant academic analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        {/* --- UPLOAD SECTION --- */}
        <div className="lg:col-span-1 space-y-4 sticky top-6 self-start">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50/80 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <Upload className="h-4 w-4 text-[#1D6FA3]" /> Document Upload
              </h3>
            </div>
            
            <div className="p-6">
              <div 
                onDragOver={(e) => {e.preventDefault(); setIsDragging(true)}}
                onDragLeave={(e) => {e.preventDefault(); setIsDragging(false)}}
                onDrop={handleDrop}
                onClick={() => !selectedFile && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  selectedFile ? "border-transparent bg-transparent p-0" : 
                  isDragging ? "border-[#1D6FA3] bg-[#E3F2FD] cursor-pointer" : "border-gray-200 hover:border-[#1D6FA3] bg-gray-50 hover:bg-gray-50/50 cursor-pointer"
                }`}
              >
                {/* IMPROVED FILE DISPLAY WITH CLOSE ICON */}
                {selectedFile ? (
                  <div className="relative flex flex-col items-center p-6 border border-[#1D6FA3]/20 bg-blue-50/50 rounded-xl group transition-all hover:border-[#1D6FA3]/40">
                    <button 
                      onClick={handleRemoveFile}
                      className="absolute top-3 right-3 p-1.5 bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full shadow-sm transition-all opacity-80 group-hover:opacity-100"
                      title="Remove PDF"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                      <FileText className="h-8 w-8 text-[#1D6FA3]" />
                    </div>
                    <p className="text-sm font-bold text-[#1F2937] text-center px-4 truncate w-full">{selectedFile.name}</p>
                    <p className="text-xs font-medium text-[#6B7280] mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <div className="mx-auto w-12 h-12 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center mb-4">
                      <Upload className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Click or drag PDF here</p>
                    <p className="text-xs text-gray-400 mt-2">Max file size: 10MB</p>
                  </div>
                )}
                <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              </div>

              <button
                onClick={submitForEvaluation}
                disabled={!selectedFile || isEvaluating}
                className="w-full mt-6 py-3.5 bg-[#006837] text-white rounded-xl hover:bg-[#00542c] transition-all disabled:opacity-50 disabled:hover:bg-[#006837] flex justify-center items-center gap-2 font-bold shadow-md active:scale-[0.98]"
              >
                {isEvaluating ? <><Loader2 className="h-5 w-5 animate-spin" /> Analyzing Grades...</> : "Evaluate Performance"}
              </button>

              <div className="mt-6 p-4 bg-gray-50 border border-gray-100 rounded-xl flex gap-3">
                <AlertCircle className="h-5 w-5 text-[#1D6FA3] flex-shrink-0" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  <span className="font-semibold text-gray-700 block mb-0.5">Privacy Guarantee</span>
                  Uploaded grades are processed ephemerally in RAM and are never saved to the database.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- RESULTS SECTION --- */}
        <div className="lg:col-span-2">
          {isEvaluating ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full min-h-[600px] flex flex-col items-center justify-center p-8 text-center animate-pulse">
              <div className="relative">
                <div className="absolute inset-0 bg-[#1D6FA3] rounded-full blur-xl opacity-20 animate-pulse"></div>
                <Loader2 className="h-16 w-16 text-[#1D6FA3] animate-spin mb-6 relative z-10 mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Extracting Academic Data...</h3>
              <p className="text-gray-500 max-w-sm mt-3 leading-relaxed">The AI is currently scanning your transcript to accurately extract subjects and perform deterministic math.</p>
            </div>
          ) : result ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-full animate-in slide-in-from-bottom-4 duration-500">
              <div className={`h-2.5 w-full ${cumulativeData.status === "Dean's Lister" ? "bg-gradient-to-r from-[#D4AF37] via-[#FDB913] to-[#D4AF37]" : "bg-[#006837]"}`}></div>
              
              <div className="p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-2xl flex items-center gap-2 mb-1">
                      <TrendingUp className="h-6 w-6 text-[#1D6FA3]" /> Academic Evaluation
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">Official CTU Ruleset Applied</p>
                  </div>
                  <span className={`px-5 py-2 rounded-full text-sm tracking-wide font-bold flex items-center gap-2 ${getStatusBadge(cumulativeData.status)}`}>
                    {cumulativeData.status === "Dean's Lister" && <Award className="h-4 w-4" />}
                    {cumulativeData.status}
                  </span>
                </div>

                {/* Massive GWA Card */}
                <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-gray-50/80 border border-gray-100 rounded-2xl mb-8">
                  <div className="text-center md:text-left mb-4 md:mb-0">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Cumulative GWA</h4>
                    <p className="text-6xl font-black text-[#1D6FA3] tracking-tight">{cumulativeData.gwa}</p>
                  </div>
                  <div className="hidden md:block w-px h-16 bg-gray-200 mx-8"></div>
                  <div className="text-center md:text-left max-w-[280px]">
                    <p className="text-sm text-gray-600 font-medium leading-relaxed">Calculated natively via deterministic mathematics ensuring 100% precision from extracted AI data.</p>
                  </div>
                </div>

                {Array.isArray(result.semesters) && (
                  <div className="mb-10 space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Semester Breakdown
                    </h3>
                    
                    {result.semesters.map((sem, idx) => {
                      const math = getAccurateMath(sem); 
                      
                      return (
                        <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 relative z-10">
                            
                            <div className="flex items-center gap-4 mb-4 sm:mb-0">
                              <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50">
                                <BookOpen className="h-5 w-5 text-[#1D6FA3]" />
                              </div>
                              <div>
                                <span className="block font-bold text-gray-900 text-base">{sem.semester_name || "Unknown Semester"}</span>
                                <span className="block text-sm text-gray-500 mt-0.5 font-medium">Evaluated Units: {math.totalUnits}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-5 sm:pl-6 sm:border-l border-gray-100">
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Semester GWA</span>
                                <span className="text-2xl font-black text-[#1F2937] leading-none">{math.gwa}</span>
                              </div>
                              {Array.isArray(sem.subjects_scratchpad) && (
                                <button 
                                  onClick={() => toggleSemester(idx)} 
                                  className={`p-2.5 rounded-xl transition-all ${expandedSemesters.includes(idx) ? 'bg-[#1D6FA3] text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                                >
                                  {expandedSemesters.includes(idx) ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* CLEANER MISSING GRADES BANNER */}
                          {sem.has_missing_grades && (
                            <div className="px-5 py-2.5 bg-red-50/80 border-t border-red-100 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <span className="text-xs font-bold text-red-700">Missing/Pending Grades Detected — GWA is partially calculated.</span>
                            </div>
                          )}

                          {/* MATH SCRATCHPAD */}
                          {expandedSemesters.includes(idx) && Array.isArray(sem.subjects_scratchpad) && (
                            <div className="border-t border-gray-100 bg-[#F9FAFB] p-5">
                              <div className="flex items-center gap-2 mb-4">
                                <Calculator className="h-4 w-4 text-gray-400" />
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Calculation Breakdown</span>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                  <thead>
                                    <tr className="text-xs text-gray-400 border-b border-gray-200 uppercase tracking-wider">
                                      <th className="pb-3 font-semibold">Subject</th>
                                      <th className="pb-3 font-semibold text-center">Units</th>
                                      <th className="pb-3 font-semibold text-center">Grade</th>
                                      <th className="pb-3 font-semibold text-right">Weighted</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {sem.subjects_scratchpad.map((item, i) => (
                                      <tr key={i} className={`text-gray-700 hover:bg-white transition-colors ${!item.grade || item.grade === 0 ? 'opacity-50' : ''}`}>
                                        <td className="py-3 font-medium text-gray-900 truncate max-w-[180px]">{item.subject}</td>
                                        <td className="py-3 text-center text-gray-600">{item.units}</td>
                                        <td className="py-3 text-center">
                                          {item.grade > 0 ? (
                                            <span className="font-bold text-[#006837] bg-green-50 px-2 py-1 rounded-md">{item.grade}</span>
                                          ) : (
                                            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">INC/NONE</span>
                                          )}
                                        </td>
                                        <td className="py-3 text-right font-medium text-gray-500">{(item.units * item.grade).toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Advisor Summary */}
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Advisor Summary</h3>
                  <div className="p-6 bg-blue-50/40 rounded-2xl border border-blue-100/50">
                    <p className="text-gray-700 font-medium leading-relaxed">{result.summary || "Summary generation skipped by AI."}</p>
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Recommended Actions</h3>
                  <div className="space-y-3">
                    {Array.isArray(result.recommendations) ? result.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-gray-200 transition-colors">
                        <CheckCircle className="h-5 w-5 text-[#006837] mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm font-medium leading-relaxed">{rec}</span>
                      </div>
                    )) : <p className="text-sm text-gray-500">AI did not provide recommendations.</p>}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 h-full min-h-[600px] flex items-center justify-center p-8">
               <div className="text-center">
                 <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                    <FileText className="h-8 w-8 text-gray-300" />
                 </div>
                 <h3 className="text-lg font-bold text-gray-400">Awaiting Grade Slip</h3>
                 <p className="text-sm text-gray-400 mt-2 max-w-[250px] mx-auto">Upload a document to view your personalized academic evaluation.</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}