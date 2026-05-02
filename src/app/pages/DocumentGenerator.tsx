import { useState } from "react";
import { FileText, Download, Sparkles, Save, Wand2, FileSignature, Mail, Briefcase, ClipboardList, Stamp } from "lucide-react";

export function DocumentGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const templates = [
    { id: "memo", name: "Memorandum", description: "Generate official internal university memorandums", icon: FileText },
    { id: "resolution", name: "Board Resolution", description: "Draft formal resolutions for institutional approval", icon: FileSignature },
    { id: "letter", name: "Official Letter", description: "Write formal letters for external communications", icon: Mail },
    { id: "policy", name: "Policy Draft", description: "Create standard operating procedure drafts", icon: Briefcase },
    { id: "action-plan", name: "Action Plan", description: "Outline strategic initiatives and project timelines", icon: ClipboardList },
    { id: "minutes", name: "Meeting Minutes", description: "Format unstructured notes into official minutes", icon: Stamp },
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      if (useAI) {
        setGeneratedContent(`CEBU TECHNOLOGICAL UNIVERSITY\nARGAO CAMPUS\nEdgan, Argao, Cebu\n\nAI-Generated Draft based on your prompt:\n"${aiPrompt}"\n\n[SUBJECT / TITLE]\n\n1. This document has been structurally formatted by the AI Assistant.\n\n2. The administration recognizes the importance of the aforementioned subject and advises all concerned departments to prepare accordingly. Please ensure that all necessary protocols are observed.\n\n3. For strict compliance and immediate dissemination.`);
      } else {
        const docType = templates.find(t => t.id === selectedTemplate)?.name || "Document";
        setGeneratedContent(`CEBU TECHNOLOGICAL UNIVERSITY\nARGAO CAMPUS\nEdgan, Argao, Cebu\n\nOFFICIAL ${docType.toUpperCase()}\nRef No: [Auto-Generated]\nDate: ${new Date().toLocaleDateString()}\n\nTO: [Target Audience]\nFROM: [Signatory Office]\nSUBJECT: Generated ${docType} Template\n\n1. This is an official, system-generated template for a ${docType}.\n\n2. Please replace the bracketed sections with the specific details required for your governance documentation.\n\n3. For strict compliance and immediate dissemination.\n\n\n(Sgd.) [AUTHORIZED SIGNATORY]\nCebu Technological University - Argao Campus`);
      }
      setIsGenerating(false);
    }, 2000);
  };

  const getIcon = (iconName: any) => {
    const IconComponent = iconName;
    return <IconComponent className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2937]">Document Generator</h1>
          <p className="text-sm text-[#6B7280] mt-1">Generate official administrative documents and governance templates</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#1F2937] rounded-lg hover:bg-[#F5F7FA] transition-colors cursor-pointer">
            <Save className="h-4 w-4" />
            <span className="text-sm font-medium">Save Draft</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] transition-colors cursor-pointer shadow-sm">
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium">Export</span>
          </button>
        </div>
      </div>

      {/* AI Toggle */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-[#1D6FA3]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F2937]">AI-Powered Generation</h2>
              <p className="text-sm text-[#6B7280] mt-1">Use Context-Aware AI to draft specific policies, memos, or letters from scratch</p>
            </div>
          </div>
          <button
            onClick={() => setUseAI(!useAI)}
            className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${
              useAI ? "bg-[#1D6FA3]" : "bg-[#E5E7EB]"
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                useAI ? "transform translate-x-7" : ""
              }`}
            />
          </button>
        </div>

        {useAI && (
          <div className="mt-5 animate-in slide-in-from-top-2 fade-in duration-300">
            <label className="block text-sm font-bold text-[#1F2937] mb-2">
              Detailed Instructions
            </label>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full px-4 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent transition-all resize-none"
              rows={4}
              placeholder="Example: Draft a memorandum regarding the suspension of classes due to upcoming regional weather disturbances, targeted to all faculty and students..."
            />
          </div>
        )}
      </div>

      {!useAI && (
        <div className="animate-in fade-in duration-300 space-y-6">
          {/* Templates Grid */}
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1F2937] mb-4">Select Administrative Template</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-5 rounded-xl border-2 transition-all text-left cursor-pointer active:scale-[0.98] ${
                    selectedTemplate === template.id
                      ? "border-[#1D6FA3] bg-blue-50/50"
                      : "border-[#E5E7EB] hover:border-[#1D6FA3]/50 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedTemplate === template.id ? "bg-[#1D6FA3] text-white" : "bg-gray-100 text-[#1D6FA3]"
                    }`}>
                      {getIcon(template.icon)}
                    </div>
                    <h3 className={`text-sm font-bold ${selectedTemplate === template.id ? "text-[#1D6FA3]" : "text-[#1F2937]"}`}>
                      {template.name}
                    </h3>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed">{template.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields - UPDATED FOR ADMIN DOCS */}
          {selectedTemplate && (
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-lg font-bold text-[#1F2937] mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#1D6FA3]" />
                Document Meta-Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">Document Subject / Title</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent transition-all"
                    placeholder="e.g., Mandatory Faculty Assembly"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">Reference / Memo Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent transition-all"
                    placeholder="e.g., Memo No. 045, s. 2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">Target Audience / Recipient</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent transition-all"
                    placeholder="e.g., All College Deans"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-2">Signatory Office</label>
                  <select className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent transition-all cursor-pointer">
                    <option>Office of the Campus Director</option>
                    <option>Supreme Student Government</option>
                    <option>Quality Assurance Office</option>
                    <option>Registrar's Office</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generate Button */}
      {(selectedTemplate || (useAI && aiPrompt)) && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-8 py-3.5 bg-[#1D6FA3] text-white rounded-xl hover:bg-[#0B3C5D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-bold active:scale-95"
          >
            {useAI ? <Wand2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            <span>
              {isGenerating ? "Processing Document..." : useAI ? "Generate via Context AI" : "Generate Standard Template"}
            </span>
          </button>
        </div>
      )}

      {/* Generated Content Preview */}
      {generatedContent && (
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 shadow-sm animate-in zoom-in-95 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <h2 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Generated Document Preview
            </h2>
            <button className="flex items-center gap-2 px-4 py-2 text-sm border border-[#E5E7EB] text-[#1F2937] rounded-lg hover:bg-[#F5F7FA] transition-colors font-medium cursor-pointer shadow-sm">
              <Download className="h-4 w-4" />
              Download as Word (.docx)
            </button>
          </div>
          <div className="p-8 bg-[#F5F7FA] rounded-lg border border-[#E5E7EB] shadow-inner">
            <pre className="whitespace-pre-wrap text-sm text-[#1F2937] font-serif leading-relaxed">
              {generatedContent}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// Added missing icon import fallback just in case
function CheckCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}