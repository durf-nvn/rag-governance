import { useState } from "react";
import { Search, Filter, Download } from "lucide-react";

type TabType = "queries" | "access" | "versions";

export function AuditTrail() {
  const [activeTab, setActiveTab] = useState<TabType>("queries");

  const queryLogs = [
    {
      id: 1,
      user: "Dr. Maria Santos",
      role: "Faculty",
      query: "What is the policy on student absences?",
      timestamp: "March 7, 2026 - 10:45 AM",
      status: "Answered"
    },
    {
      id: 2,
      user: "Juan Cruz",
      role: "QA Officer",
      query: "Show all accreditation documents for Area III",
      timestamp: "March 7, 2026 - 09:30 AM",
      status: "Answered"
    },
    {
      id: 3,
      user: "Admin User",
      role: "Administrator",
      query: "List all policies updated in 2026",
      timestamp: "March 6, 2026 - 04:15 PM",
      status: "Answered"
    },
    {
      id: 4,
      user: "Faculty User",
      role: "Faculty",
      query: "How to apply for research grants?",
      timestamp: "March 6, 2026 - 02:20 PM",
      status: "Answered"
    },
  ];

  const accessLogs = [
    {
      id: 1,
      user: "Dr. Maria Santos",
      role: "Faculty",
      document: "Student Handbook 2026",
      action: "Downloaded",
      timestamp: "March 7, 2026 - 11:00 AM",
      ipAddress: "192.168.1.45"
    },
    {
      id: 2,
      user: "Juan Cruz",
      role: "QA Officer",
      document: "Research Ethics Guidelines",
      action: "Viewed",
      timestamp: "March 7, 2026 - 09:45 AM",
      ipAddress: "192.168.1.78"
    },
    {
      id: 3,
      user: "Admin User",
      role: "Administrator",
      document: "Faculty Manual",
      action: "Edited",
      timestamp: "March 6, 2026 - 04:30 PM",
      ipAddress: "192.168.1.12"
    },
    {
      id: 4,
      user: "Staff User",
      role: "Staff",
      document: "Grading System Procedure",
      action: "Downloaded",
      timestamp: "March 6, 2026 - 02:45 PM",
      ipAddress: "192.168.1.56"
    },
  ];

  const versionHistory = [
    {
      id: 1,
      document: "Student Handbook 2026",
      version: "3.2",
      previousVersion: "3.1",
      changedBy: "Admin User",
      changeDate: "March 5, 2026",
      changeType: "Major Update",
      description: "Updated grading system policies and academic integrity guidelines"
    },
    {
      id: 2,
      document: "Research Ethics Guidelines",
      version: "2.1",
      previousVersion: "2.0",
      changedBy: "Research Director",
      changeDate: "March 1, 2026",
      changeType: "Minor Update",
      description: "Clarified data privacy requirements for research involving human subjects"
    },
    {
      id: 3,
      document: "Faculty Manual",
      version: "4.0",
      previousVersion: "3.5",
      changedBy: "HR Director",
      changeDate: "February 20, 2026",
      changeType: "Major Update",
      description: "Revised faculty evaluation criteria and promotion guidelines"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Audit Trail</h1>
          <p className="text-gray-600">Complete tracking of system activities, queries, and document changes</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-[#FDB913] text-gray-900 rounded-lg hover:bg-[#e5a610] transition-colors shadow-md">
          <Download className="h-5 w-5" />
          Export Logs
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("queries")}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "queries"
                  ? "border-b-2 border-[#CE0000] text-[#CE0000]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Query Logs
            </button>
            <button
              onClick={() => setActiveTab("access")}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "access"
                  ? "border-b-2 border-[#CE0000] text-[#CE0000]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Document Access Logs
            </button>
            <button
              onClick={() => setActiveTab("versions")}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "versions"
                  ? "border-b-2 border-[#CE0000] text-[#CE0000]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Version History
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab === "queries" ? "queries" : activeTab === "access" ? "access logs" : "version history"}...`}
                className="w-full pl-10 pr-4 py-3 bg-[#F5F5F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913]"
              />
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-[#F5F5F5] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <Filter className="h-5 w-5" />
              Filters
            </button>
          </div>

          {/* Query Logs Tab */}
          {activeTab === "queries" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F5F5]">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm text-gray-700">User</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-700">Role</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-700">Query</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-700">Timestamp</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {queryLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F5F5F5] transition-colors">
                      <td className="px-6 py-4 text-gray-900">{log.user}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-[#D4AF37]/20 text-[#D4AF37] text-sm rounded">
                          {log.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{log.query}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{log.timestamp}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-[#006837]/20 text-[#006837] text-sm rounded-full">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Access Logs Tab */}
          {activeTab === "access" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F5F5]">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm text-gray-700">User</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-700">Role</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-700">Document</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-700">Action</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-700">Timestamp</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-700">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {accessLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F5F5F5] transition-colors">
                      <td className="px-6 py-4 text-gray-900">{log.user}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-[#D4AF37]/20 text-[#D4AF37] text-sm rounded">
                          {log.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{log.document}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-sm rounded-full ${
                            log.action === "Edited"
                              ? "bg-[#FDB913]/20 text-[#FDB913]"
                              : log.action === "Downloaded"
                              ? "bg-[#006837]/20 text-[#006837]"
                              : "bg-[#CE0000]/20 text-[#CE0000]"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{log.timestamp}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Version History Tab */}
          {activeTab === "versions" && (
            <div className="space-y-4">
              {versionHistory.map((version) => (
                <div
                  key={version.id}
                  className="border-l-4 border-[#FDB913] bg-[#F5F5F5] rounded-lg p-5 hover:bg-white hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg text-gray-900 mb-1">{version.document}</h3>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-[#CE0000] text-white text-sm rounded">
                          v{version.version}
                        </span>
                        <span className="text-gray-600 text-sm">← v{version.previousVersion}</span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        version.changeType === "Major Update"
                          ? "bg-[#CE0000]/20 text-[#CE0000]"
                          : "bg-[#006837]/20 text-[#006837]"
                      }`}
                    >
                      {version.changeType}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{version.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Changed by: <strong>{version.changedBy}</strong></span>
                    <span>•</span>
                    <span>{version.changeDate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#CE0000]">
          <h3 className="text-3xl text-[#CE0000] mb-2">1,234</h3>
          <p className="text-gray-700">Total Queries</p>
          <p className="text-sm text-gray-500 mt-1">This month</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#FDB913]">
          <h3 className="text-3xl text-[#FDB913] mb-2">456</h3>
          <p className="text-gray-700">Document Accesses</p>
          <p className="text-sm text-gray-500 mt-1">This week</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#006837]">
          <h3 className="text-3xl text-[#006837] mb-2">23</h3>
          <p className="text-gray-700">Version Updates</p>
          <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#D4AF37]">
          <h3 className="text-3xl text-[#D4AF37] mb-2">89</h3>
          <p className="text-gray-700">Active Users</p>
          <p className="text-sm text-gray-500 mt-1">Today</p>
        </div>
      </div>
    </div>
  );
}
