import { useState } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, TrendingUp, Eye } from "lucide-react";

interface EvaluationResult {
  id: number;
  fileName: string;
  uploadDate: string;
  status: "Pass" | "Conditional" | "Fail";
  confidenceScore: number;
  summary: string;
  recommendations: string[];
}

export function GradeEvaluation() {
  const [isDragging, setIsDragging] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<EvaluationResult | null>(null);

  const evaluationResults: EvaluationResult[] = [
    {
      id: 1,
      fileName: "grade_report_2026_1st_sem.pdf",
      uploadDate: "March 25, 2026",
      status: "Pass",
      confidenceScore: 92,
      summary: "Student has met all academic requirements for the semester with satisfactory grades across all courses.",
      recommendations: [
        "Continue maintaining strong performance",
        "Consider taking advanced courses in strong subjects",
        "Explore research opportunities in areas of interest"
      ]
    },
    {
      id: 2,
      fileName: "midterm_grades_2026.pdf",
      uploadDate: "March 20, 2026",
      status: "Conditional",
      confidenceScore: 75,
      summary: "Student performance is adequate but shows areas requiring improvement. Two courses below satisfactory level.",
      recommendations: [
        "Focus on improving performance in Math and Science courses",
        "Seek tutoring support for challenging subjects",
        "Increase study time and utilize learning resources"
      ]
    }
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    alert(`Uploading: ${file.name}\n\nYour grade report is being processed by the AI evaluation system...`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pass": return "bg-[#006837] text-white";
      case "Conditional": return "bg-[#FDB913] text-gray-900";
      case "Fail": return "bg-[#CE0000] text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return "text-[#006837]";
    if (score >= 70) return "text-[#FDB913]";
    return "text-[#CE0000]";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Grade Evaluation</h1>
          <p className="text-gray-600">Upload grade reports for AI-assisted evaluation and insights</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl mb-4 text-[#CE0000]">Upload Grade Report</h2>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
            isDragging
              ? "border-[#FDB913] bg-[#FDB913]/10"
              : "border-gray-300 hover:border-[#FDB913]/50"
          }`}
        >
          <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg text-gray-900 mb-2">Drag and Drop Your Grade Report</h3>
          <p className="text-gray-600 mb-4">or click to browse from your device</p>
          <input
            type="file"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
            id="file-upload"
            accept=".pdf,.jpg,.jpeg,.png"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FDB913] text-gray-900 rounded-lg hover:bg-[#e5a610] transition-colors cursor-pointer"
          >
            <FileText className="h-5 w-5" />
            Browse Files
          </label>
          <p className="text-sm text-gray-500 mt-4">Supported formats: PDF, JPG, PNG (Max 10MB)</p>
        </div>
      </div>

      {/* Evaluation Results */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl mb-4 text-[#CE0000]">Evaluation Results</h2>
        <div className="space-y-4">
          {evaluationResults.map((result) => (
            <div key={result.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-[#CE0000]" />
                    <h3 className="text-gray-900 font-medium">{result.fileName}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Uploaded: {result.uploadDate}</p>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-gray-700">Confidence Score:</span>
                    <span className={`text-2xl font-bold ${getConfidenceColor(result.confidenceScore)}`}>
                      {result.confidenceScore}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedResult(result);
                    setShowReasonModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-[#CE0000] border border-[#CE0000] rounded-lg hover:bg-[#CE0000] hover:text-white transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </button>
              </div>

              <div className="p-4 bg-[#F5F5F5] rounded-lg border-l-4 border-[#FDB913]">
                <h4 className="text-sm font-medium text-gray-900 mb-2">AI-Generated Summary</h4>
                <p className="text-sm text-gray-700">{result.summary}</p>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#006837]" />
                  System Insights & Recommendations
                </h4>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-[#006837] mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl mb-4 text-[#CE0000]">Performance Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-[#006837]/10 rounded-lg border-l-4 border-[#006837]">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-6 w-6 text-[#006837]" />
              <h3 className="text-gray-900 font-medium">Average Grade</h3>
            </div>
            <p className="text-3xl font-bold text-[#006837]">85.5%</p>
            <p className="text-sm text-gray-600 mt-1">Across all courses</p>
          </div>

          <div className="p-6 bg-[#FDB913]/10 rounded-lg border-l-4 border-[#FDB913]">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-6 w-6 text-[#FDB913]" />
              <h3 className="text-gray-900 font-medium">Trend</h3>
            </div>
            <p className="text-3xl font-bold text-[#FDB913]">+5.2%</p>
            <p className="text-sm text-gray-600 mt-1">Improvement from last semester</p>
          </div>

          <div className="p-6 bg-[#CE0000]/10 rounded-lg border-l-4 border-[#CE0000]">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="h-6 w-6 text-[#CE0000]" />
              <h3 className="text-gray-900 font-medium">At Risk Courses</h3>
            </div>
            <p className="text-3xl font-bold text-[#CE0000]">2</p>
            <p className="text-sm text-gray-600 mt-1">Require attention</p>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showReasonModal && selectedResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl mb-4 text-gray-900">Detailed Evaluation Report</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Document</h3>
                <p className="text-gray-900">{selectedResult.fileName}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Evaluation Status</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusColor(selectedResult.status)}`}>
                  {selectedResult.status}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Confidence Score</h3>
                <div className="flex items-center gap-4">
                  <span className={`text-3xl font-bold ${getConfidenceColor(selectedResult.confidenceScore)}`}>
                    {selectedResult.confidenceScore}%
                  </span>
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        selectedResult.confidenceScore >= 90 ? "bg-[#006837]" :
                        selectedResult.confidenceScore >= 70 ? "bg-[#FDB913]" : "bg-[#CE0000]"
                      }`}
                      style={{ width: `${selectedResult.confidenceScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">AI-Generated Summary</h3>
                <div className="p-4 bg-[#F5F5F5] rounded-lg">
                  <p className="text-gray-700">{selectedResult.summary}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h3>
                <div className="space-y-2">
                  {selectedResult.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-[#F5F5F5] rounded-lg">
                      <CheckCircle className="h-5 w-5 text-[#006837] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowReasonModal(false)}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button className="px-6 py-2 bg-[#CE0000] text-white rounded-lg hover:bg-[#b50000] transition-colors">
                Download Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
