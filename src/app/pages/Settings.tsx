import { useState, useEffect } from "react";
import { Save, ShieldCheck, Building2, Server, Lock, Bot, Sliders, Loader2, CheckCircle } from "lucide-react";
import axios from "axios";

type TabType = "profile" | "security" | "ai_engine";

export function Settings() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Settings State
  const [settings, setSettings] = useState({
    platform_name: "", campus: "", admin_email: "",
    jwt_expiration: 30, otp_expiration: 10,
    ai_model: "", ai_temperature: 0.3, ai_system_prompt: "", rag_max_chunks: 5
  });

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get("http://localhost:8000/settings");
        setSettings(response.data);
      } catch (error) {
        console.error("Failed to fetch settings");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.put("http://localhost:8000/settings", settings);
      setToast({ message: "System configurations successfully updated!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast({ message: "Failed to update settings.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#1D6FA3]" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10 relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-semibold z-[100] animate-in slide-in-from-bottom-5 bg-gray-900 text-white">
          <CheckCircle className="h-5 w-5 text-green-400" />
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl text-gray-900 mb-1 font-semibold">System Settings</h1>
        <p className="text-sm text-gray-600">Configure global application parameters, security protocols, and AI thresholds</p>
      </div>

      {/* Main Settings Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-[#F9FAFB] overflow-x-auto">
          <button onClick={() => setActiveTab("profile")} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${activeTab === "profile" ? "border-b-2 border-[#1D6FA3] text-[#1D6FA3] bg-white" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}>
            <Building2 className="h-4 w-4" /> Institutional Profile
          </button>
          <button onClick={() => setActiveTab("security")} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${activeTab === "security" ? "border-b-2 border-[#1D6FA3] text-[#1D6FA3] bg-white" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}>
            <ShieldCheck className="h-4 w-4" /> Security & Authentication
          </button>
          <button onClick={() => setActiveTab("ai_engine")} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${activeTab === "ai_engine" ? "border-b-2 border-[#1D6FA3] text-[#1D6FA3] bg-white" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}>
            <Bot className="h-4 w-4" /> AI & RAG Engine
          </button>
        </div>

        <div className="p-8">
          
          {/* --- TAB 1: INSTITUTIONAL PROFILE --- */}
          {activeTab === "profile" && (
            <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Institutional Identity</h2>
                <p className="text-sm text-gray-500 mb-6">These details appear on generated documents and system emails.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
                    <input type="text" value={settings.platform_name} onChange={(e) => handleChange("platform_name", e.target.value)} className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Campus</label>
                    <input type="text" value={settings.campus} onChange={(e) => handleChange("campus", e.target.value)} className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">System Administrator Email</label>
                    <input type="email" value={settings.admin_email} onChange={(e) => handleChange("admin_email", e.target.value)} className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] text-gray-900" />
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Server Configuration</h2>
                <p className="text-sm text-gray-500 mb-6">Database and API environmental variables.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Supabase Vector DB URL</label>
                    <div className="flex items-center px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 text-sm font-mono cursor-not-allowed">
                      <Server className="h-4 w-4 mr-2" /> https://xyz.supabase.co
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Environment Status</label>
                    <div className="flex items-center px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div> Production (Active)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB 2: SECURITY & AUTHENTICATION --- */}
          {activeTab === "security" && (
            <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2"><Lock className="h-5 w-5 text-[#006837]" /> Access Control Policies</h2>
                <p className="text-sm text-gray-500 mb-6">Manage how users authenticate and access the system.</p>
                <div className="space-y-4">
                  <div className="flex items-start justify-between p-5 bg-white border border-gray-200 rounded-xl">
                    <div>
                      <h3 className="font-semibold text-gray-900">Student Auto-Verification</h3>
                      <p className="text-sm text-gray-500 mt-1">Student accounts bypass manual admin approval and are automatically verified upon successful OTP email confirmation.</p>
                    </div>
                    <input type="checkbox" defaultChecked disabled className="w-5 h-5 cursor-not-allowed accent-[#006837]" />
                  </div>
                  <div className="flex items-start justify-between p-5 bg-white border border-gray-200 rounded-xl">
                    <div>
                      <h3 className="font-semibold text-gray-900">Strict Faculty Verification</h3>
                      <p className="text-sm text-gray-500 mt-1">Faculty and Administrator accounts must remain in a 'Pending' state until manually verified by an existing Administrator.</p>
                    </div>
                    <input type="checkbox" defaultChecked disabled className="w-5 h-5 cursor-not-allowed accent-[#006837]" />
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Session & Token Parameters</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">JWT Expiration (Minutes)</label>
                    <input type="number" value={settings.jwt_expiration} onChange={(e) => handleChange("jwt_expiration", Number(e.target.value))} className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">OTP Expiration (Minutes)</label>
                    <input type="number" value={settings.otp_expiration} onChange={(e) => handleChange("otp_expiration", Number(e.target.value))} className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB 3: AI & RAG ENGINE --- */}
          {activeTab === "ai_engine" && (
            <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2"><Sliders className="h-5 w-5 text-[#FDB913]" /> Large Language Model (LLM) Tuning</h2>
                <p className="text-sm text-gray-500 mb-6">Adjust the behavior and constraints of the AskPolicy AI Assistant.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Active Model Endpoint</label>
                    <select value={settings.ai_model} onChange={(e) => handleChange("ai_model", e.target.value)} className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] cursor-pointer text-gray-900">
                      <option value="llama-3.1-8b-instant">Groq: Llama-3.1-8b-instant (Fast)</option>
                      <option value="llama-3.3-70b-versatile">Groq: Llama-3.3-70b-versatile (Accurate)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperature Threshold <span className="text-[#1D6FA3] font-semibold ml-2">{settings.ai_temperature}</span>
                    </label>
                    <input type="range" min="0" max="1" step="0.1" value={settings.ai_temperature} onChange={(e) => handleChange("ai_temperature", parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-3" />
                    <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                      <span>Strict / Factual</span><span>Creative</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between">
                    System Prompt Override <span className="text-xs text-[#CE0000]">Use caution when modifying</span>
                  </label>
                  <textarea
                    rows={6}
                    value={settings.ai_system_prompt}
                    onChange={(e) => handleChange("ai_system_prompt", e.target.value)}
                    className="w-full px-4 py-3 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] transition-all resize-none text-sm font-mono text-gray-700 leading-relaxed"
                  />
                </div>
              </div>
              <div className="pt-6 border-t border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Vector Search (RAG) Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Similarity Distance Metric</label>
                    <select disabled className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed">
                      <option>Cosine Similarity (Locked via Supabase)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Chunks Retrieved (Top K)</label>
                    <input type="number" value={settings.rag_max_chunks} onChange={(e) => handleChange("rag_max_chunks", Number(e.target.value))} className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] text-gray-900" />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Action Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-2.5 bg-[#006837] text-white font-medium rounded-xl hover:bg-[#00542c] transition-colors cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving Config..." : "Save System Settings"}
          </button>
        </div>

      </div>
    </div>
  );
}