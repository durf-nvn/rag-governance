import { useState, useEffect } from "react";
import { Search, Filter, Download, Loader2, MessageSquare, Clock, ShieldAlert } from "lucide-react";
import axios from "axios";

type TabType = "queries" | "access" | "versions" | "system";

export function AuditTrail() {
  const [activeTab, setActiveTab] = useState<TabType>("queries");
  
  // Real Data States
  const [queryLogs, setQueryLogs] = useState<any[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAuditData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === "queries") {
          const res = await axios.get("http://localhost:8000/audit/queries");
          setQueryLogs(res.data);
        } 
        else if (activeTab === "access") {
          const res = await axios.get("http://localhost:8000/audit/access");
          setAccessLogs(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch audit logs", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuditData();
  }, [activeTab]);

  // The unified filter variable!
  const filteredData = activeTab === "queries" 
    ? queryLogs.filter(log => log.user.toLowerCase().includes(searchQuery.toLowerCase()) || log.query.toLowerCase().includes(searchQuery.toLowerCase()))
    : accessLogs.filter(log => log.user.toLowerCase().includes(searchQuery.toLowerCase()) || log.document.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">System Audit Trail</h1>
          <p className="text-gray-600">Monitor system usage, document access, and AI interactions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
          <Download className="h-4 w-4" />
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
          <h3 className="text-3xl font-bold text-[#006837] mb-2">--</h3>
          <p className="text-gray-700 font-medium">Version Updates</p>
          <p className="text-sm text-gray-500 mt-1">Pending implementation</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-[#CE0000]">
          <h3 className="text-3xl font-bold text-[#CE0000] mb-2">--</h3>
          <p className="text-gray-700 font-medium">Security Events</p>
          <p className="text-sm text-gray-500 mt-1">Pending implementation</p>
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search logs..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]" 
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Filter</span>
              </button>
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
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-[#F5F7FA] border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Query Sent to AI</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* FIX: Changed from filteredQueries to filteredData */}
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No query logs found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{log.user}</div>
                        <div className="text-xs font-medium text-gray-500 mt-0.5">{log.role || "STUDENT"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-[#1D6FA3] flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate max-w-md block" title={log.query}>
                            {log.query}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{log.timestamp}</td>
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
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-[#F5F7FA] border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Document Accessed</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
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
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{log.user}</div>
                        <div className="text-xs font-medium text-gray-500 mt-0.5">{log.role}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#1D6FA3] truncate max-w-sm" title={log.document}>
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
                      <td className="px-6 py-4 text-sm text-gray-500">{log.timestamp}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : activeTab === "system" ? (
             <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                <ShieldAlert className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">System Events (Phase 2)</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-sm text-center">
                  Tracking for new registrations, password changes, and account disabling will be implemented here to satisfy full audit compliance.
                </p>
             </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
               <Clock className="h-12 w-12 text-gray-300 mb-4" />
               <h3 className="text-lg font-semibold text-gray-900">Module Pending</h3>
               <p className="text-sm text-gray-500 mt-1">This specific audit trail feature is scheduled for the next development sprint.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}