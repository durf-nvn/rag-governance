import { useState } from "react";
import { FileText, Download, Sparkles, Save, Wand2 } from "lucide-react";

export function DocumentGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const templates = [
    { id: "syllabus", name: "Course Syllabus", description: "Generate a structured course syllabus" },
    { id: "lesson-plan", name: "Lesson Plan", description: "Create detailed lesson plan templates" },
    { id: "assessment", name: "Assessment Tool", description: "Build quizzes and examination papers" },
    { id: "rubric", name: "Grading Rubric", description: "Design evaluation criteria and rubrics" },
    { id: "course-outline", name: "Course Outline", description: "Outline course objectives and topics" },
    { id: "module", name: "Learning Module", description: "Structured learning modules with activities" },
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      if (useAI) {
        setGeneratedContent(`AI-Generated content based on your prompt:\n"${aiPrompt}"\n\nGenerated document content with enhanced structure and formatting...`);
      } else {
        setGeneratedContent("Generated document content based on your template selection...");
      }
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2937]">Document Generator</h1>
          <p className="text-sm text-[#6B7280] mt-1">Generate academic documents using templates or AI assistance</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#1F2937] rounded-lg hover:bg-[#F5F7FA] transition-colors">
            <Save className="h-4 w-4" />
            <span className="text-sm font-medium">Save Draft</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] transition-colors">
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium">Export</span>
          </button>
        </div>
      </div>

      {/* AI Toggle */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-[#1D6FA3]" />
            <div>
              <h2 className="text-base font-semibold text-[#1F2937]">AI-Powered Generation</h2>
              <p className="text-sm text-[#6B7280] mt-1">Use AI to generate custom document content based on your needs</p>
            </div>
          </div>
          <button
            onClick={() => setUseAI(!useAI)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              useAI ? "bg-[#1D6FA3]" : "bg-[#E5E7EB]"
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                useAI ? "transform translate-x-7" : ""
              }`}
            />
          </button>
        </div>

        {useAI && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-[#1F2937] mb-2">
              Describe what you want to generate
            </label>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full px-4 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
              rows={4}
              placeholder="Example: Create a syllabus for Data Structures course, include weekly topics, assessment methods, and grading criteria..."
            />
          </div>
        )}
      </div>

      {!useAI && (
        <>
          {/* Templates Grid */}
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
            <h2 className="text-lg font-semibold text-[#1F2937] mb-4">Select Document Template</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-5 rounded-lg border-2 transition-all text-left ${
                    selectedTemplate === template.id
                      ? "border-[#1D6FA3] bg-blue-50"
                      : "border-[#E5E7EB] hover:border-[#1D6FA3]/50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedTemplate === template.id ? "bg-[#1D6FA3]" : "bg-[#F5F7FA]"
                    }`}>
                      <FileText className={`h-5 w-5 ${
                        selectedTemplate === template.id ? "text-white" : "text-[#1D6FA3]"
                      }`} />
                    </div>
                    <h3 className="text-sm font-semibold text-[#1F2937]">{template.name}</h3>
                  </div>
                  <p className="text-sm text-[#6B7280]">{template.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          {selectedTemplate && (
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
              <h2 className="text-lg font-semibold text-[#1F2937] mb-4">Document Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">Document Title</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
                    placeholder="Enter document title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">Course Code</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
                    placeholder="e.g., CS 101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">Academic Year</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
                    placeholder="e.g., 2025-2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">Semester</label>
                  <select className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent">
                    <option>1st Semester</option>
                    <option>2nd Semester</option>
                    <option>Summer</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Generate Button */}
      {(selectedTemplate || (useAI && aiPrompt)) && (
        <div className="flex justify-center">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-8 py-3 bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {useAI ? <Wand2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            <span className="font-medium">
              {isGenerating ? "Generating..." : useAI ? "Generate with AI" : "Generate Document"}
            </span>
          </button>
        </div>
      )}

      {/* Generated Content Preview */}
      {generatedContent && (
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1F2937]">Generated Document Preview</h2>
            <button className="flex items-center gap-2 px-4 py-2 text-sm border border-[#E5E7EB] text-[#1F2937] rounded-lg hover:bg-[#F5F7FA] transition-colors">
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
          <div className="p-6 bg-[#F5F7FA] rounded-lg border border-[#E5E7EB]">
            <pre className="whitespace-pre-wrap text-sm text-[#1F2937] font-mono">
              {generatedContent}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
