import { useState, useEffect } from "react";
import { Search, Filter, Download, Loader2, MessageSquare, Clock, ShieldAlert, FileText, History, X, Calendar, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import axios from "axios";

type TabType = "queries" | "access" | "versions" | "system";

export function AuditTrail() {
  const [activeTab, setActiveTab] = useState<TabType>("queries");
  
  // Real Data States
  const [queryLogs, setQueryLogs] = useState<any[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [versionLogs, setVersionLogs] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- EXPORT MODAL & TOAST STATE ---
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<TabType>("queries");
  const [exportDates, setExportDates] = useState({ start: "", end: "" });
  
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchAllAuditData = async () => {
      setIsLoading(true);
      try {
        const [queriesRes, accessRes, versionsRes, systemRes] = await Promise.all([
          axios.get("http://localhost:8000/audit/queries"),
          axios.get("http://localhost:8000/audit/access"),
          axios.get("http://localhost:8000/audit/versions"),
          axios.get("http://localhost:8000/audit/system") 
        ]);

        setQueryLogs(queriesRes.data);
        setAccessLogs(accessRes.data);
        setVersionLogs(versionsRes.data);
        setSystemLogs(systemRes.data); 
        
      } catch (error) {
        console.error("Failed to fetch audit logs", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllAuditData();
  }, []);

  // --- FIXED: FRONTEND CSV EXPORT LOGIC ---
  const handleExport = () => {
    let dataToExport: any[] = [];
    
    // 1. Select the correct dataset
    if (exportType === "queries") dataToExport = [...queryLogs];
    if (exportType === "access") dataToExport = [...accessLogs];
    if (exportType === "versions") dataToExport = [...versionLogs];
    if (exportType === "system") dataToExport = [...systemLogs];

    // 2. Safe Date Parser Helper (Fixes the "Invalid Date" bug)
    // Strips out the " - 05:51 PM" part so JS can properly read "April 29, 2026"
    const parseLogDate = (timestampStr: string) => {
      if (!timestampStr || timestampStr === "Unknown Date") return new Date(0);
      const cleanDateString = timestampStr.split(' - ')[0]; 
      return new Date(cleanDateString);
    };

    // 3. Filter by Dates
    if (exportDates.start) {
      const startDate = new Date(exportDates.start);
      startDate.setHours(0, 0, 0, 0); // Start of the day
      dataToExport = dataToExport.filter(log => parseLogDate(log.timestamp) >= startDate);
    }
    
    if (exportDates.end) {
      const endDate = new Date(exportDates.end);
      endDate.setHours(23, 59, 59, 999); // End of the day
      dataToExport = dataToExport.filter(log => parseLogDate(log.timestamp) <= endDate);
    }

    // 4. Safety Check (Using Toast instead of alert)
    if (dataToExport.length === 0) {
      showToast("No records found in this date range.", "error");
      return;
    }

    // 5. Build CSV String
    const headers = Object.keys(dataToExport[0]).filter(k => k !== 'id').join(',');
    const rows = dataToExport.map(row => {
      return Object.entries(row)
        .filter(([key]) => key !== 'id')
        .map(([_, value]) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',');
    }).join('\n');

    const csvContent = headers + '\n' + rows;

    // 6. Trigger Browser Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CTU_Audit_${exportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Close Modal & Show Success
    setShowExportModal(false);
    showToast(`Successfully exported ${dataToExport.length} records!`, "success");
  };

  const filteredData = activeTab === "queries" 
    ? queryLogs.filter(log => log.user.toLowerCase().includes(searchQuery.toLowerCase()) || log.query.toLowerCase().includes(searchQuery.toLowerCase()))
    : activeTab === "access"
    ? accessLogs.filter(log => log.user.toLowerCase().includes(searchQuery.toLowerCase()) || log.document.toLowerCase().includes(searchQuery.toLowerCase()))
    : activeTab === "versions"
    ? versionLogs.filter(log => log.document.toLowerCase().includes(searchQuery.toLowerCase()) || log.user.toLowerCase().includes(searchQuery.toLowerCase()))
    : systemLogs.filter(log => log.user.toLowerCase().includes(searchQuery.toLowerCase()) || log.description.toLowerCase().includes(searchQuery.toLowerCase()));

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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">System Audit Trail</h1>
          <p className="text-gray-600">Monitor system usage, document access, and AI interactions</p>
        </div>
        <button 
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1D6FA3] text-white font-medium rounded-lg hover:bg-[#0B3C5D] transition-colors shadow-sm cursor-pointer active:scale-95"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export Report
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-[#1D6FA3]">
          <h3 className="text-3xl font-bold text-[#1D6FA3] mb-2">{queryLogs.length}</h3>
          <p className="text-gray-700 font-medium">Total AI Queries</p>
          <p className="text-sm text-gray-500 mt-1">Recorded interactions</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-[#FDB913]">
          <h3 className="text-3xl font-bold text-[#FDB913] mb-2">{accessLogs.length}</h3>
          <p className="text-gray-700 font-medium">Document Accesses</p>
          <p className="text-sm text-gray-500 mt-1">Tracked views & downloads</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-[#006837]">
          <h3 className="text-3xl font-bold text-[#006837] mb-2">{versionLogs.length}</h3>
          <p className="text-gray-700 font-medium">Version Updates</p>
          <p className="text-sm text-gray-500 mt-1">Tracked file modifications</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-[#CE0000]">
          <h3 className="text-3xl font-bold text-[#CE0000] mb-2">{systemLogs.length}</h3>
          <p className="text-gray-700 font-medium">Security Events</p>
          <p className="text-sm text-gray-500 mt-1">Logins and account creations</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header and Controls */}
        <div className="p-6 border-b border-gray-100 bg-[#F9FAFB]">
          <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
              <button
                onClick={() => setActiveTab("queries")}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === "queries" ? "bg-white text-[#1D6FA3] shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                AI Query Logs
              </button>
              <button
                onClick={() => setActiveTab("access")}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === "access" ? "bg-white text-[#1D6FA3] shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Document Access
              </button>
              <button
                onClick={() => setActiveTab("versions")}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === "versions" ? "bg-white text-[#1D6FA3] shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Version History
              </button>
              <button
                onClick={() => setActiveTab("system")}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === "system" ? "bg-white text-[#1D6FA3] shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                System Events
              </button>
            </div>
            
            <div className="flex gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Search logs..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] transition-colors" 
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-all cursor-pointer"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="overflow-x-auto min-h-[400px]">
          {isLoading ? (
             <div className="flex justify-center items-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#1D6FA3]" />
             </div>
          ) : activeTab === "queries" ? (
            <table className="w-full text-left whitespace-nowrap table-fixed min-w-[900px]">
              <thead className="bg-[#F5F7FA] border-b border-gray-200">
                <tr>
                  <th className="w-[25%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="w-[45%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Query Sent to AI</th>
                  <th className="w-[20%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="w-[10%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No query logs found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 truncate">
                        <div className="font-semibold text-gray-900 truncate" title={log.user}>{log.user}</div>
                        <div className="text-xs font-medium text-gray-500 mt-0.5 truncate">{log.role || "STUDENT"}</div>
                      </td>
                      <td className="px-6 py-4 truncate">
                        <div className="flex items-center gap-2 truncate">
                          <MessageSquare className="h-4 w-4 text-[#1D6FA3] flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate" title={log.query}>
                            {log.query}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 truncate">{log.timestamp}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200">
                          {log.status || "Answered"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : activeTab === "access" ? (
            <table className="w-full text-left whitespace-nowrap table-fixed min-w-[900px]">
              <thead className="bg-[#F5F7FA] border-b border-gray-200">
                <tr>
                  <th className="w-[25%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="w-[45%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Document Accessed</th>
                  <th className="w-[10%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="w-[20%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No access logs found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 truncate">
                        <div className="font-semibold text-gray-900 truncate" title={log.user}>{log.user}</div>
                        <div className="text-xs font-medium text-gray-500 mt-0.5 truncate">{log.role}</div>
                      </td>
                      <td className="px-6 py-4 truncate">
                        <div className="font-medium text-[#1D6FA3] truncate" title={log.document}>
                          {log.document}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          log.action === 'Download' 
                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 truncate">{log.timestamp}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : activeTab === "versions" ? (
            <table className="w-full text-left whitespace-nowrap table-fixed min-w-[900px]">
              <thead className="bg-[#F5F7FA] border-b border-gray-200">
                <tr>
                  <th className="w-[35%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Document Name</th>
                  <th className="w-[10%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Version</th>
                  <th className="w-[20%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Updated By</th>
                  <th className="w-[20%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="w-[15%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No version history found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 truncate">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-[#1D6FA3] flex-shrink-0" />
                          <span className="font-semibold text-gray-900 truncate" title={log.document}>
                            {log.document}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-bold text-gray-700">
                          <History className="h-4 w-4 text-gray-400" />
                          v{log.version}
                        </div>
                      </td>
                      <td className="px-6 py-4 truncate">
                        <span className="text-sm font-medium text-gray-700 truncate" title={log.user}>{log.user}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 truncate">{log.timestamp}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          log.status === 'Active' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : activeTab === "system" ? (
            <table className="w-full text-left whitespace-nowrap table-fixed min-w-[900px]">
              <thead className="bg-[#F5F7FA] border-b border-gray-200">
                <tr>
                  <th className="w-[25%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User Account</th>
                  <th className="w-[20%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Event Type</th>
                  <th className="w-[35%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="w-[20%] px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No system events found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 truncate">
                        <span className="font-semibold text-gray-900 truncate" title={log.user}>{log.user}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          log.type === 'Authentication' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 truncate">
                        <span className="text-sm text-gray-700 truncate" title={log.description}>{log.description}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 truncate">{log.timestamp}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>

      {/* --- EXPORT MODAL --- */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F5F7FA]">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-[#1D6FA3]" />
                <h2 className="text-xl font-bold text-[#1F2937]">Export Audit Report</h2>
              </div>
              <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Log Type</label>
                <select 
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value as TabType)}
                  className="w-full px-4 py-3 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] cursor-pointer"
                >
                  <option value="queries">AI Query Logs</option>
                  <option value="access">Document Access Logs</option>
                  <option value="versions">Version History Logs</option>
                  <option value="system">System Events</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="date" 
                      value={exportDates.start}
                      onChange={(e) => setExportDates({...exportDates, start: e.target.value})}
                      className="w-full pl-9 pr-3 py-3 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] text-sm cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="date" 
                      value={exportDates.end}
                      onChange={(e) => setExportDates({...exportDates, end: e.target.value})}
                      className="w-full pl-9 pr-3 py-3 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] text-sm cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 italic">Leave dates blank to export all history for this log type.</p>
            </div>

            <div className="p-6 border-t border-gray-100 bg-[#F9FAFB] flex justify-end gap-3">
              <button 
                onClick={() => setShowExportModal(false)} 
                className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleExport} 
                className="px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-[#006837] hover:bg-[#00542c] transition-colors flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}