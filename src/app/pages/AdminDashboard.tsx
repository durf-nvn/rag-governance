import { useState, useEffect } from "react";
import { FileText, MessageSquare, CheckCircle, Clock, Users, Shield, AlertCircle, TrendingUp, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import axios from "axios";

export function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Dynamic States
  const [globalStats, setGlobalStats] = useState({ documents: 0, queries: 0, users: 0 });
  const [userDistribution, setUserDistribution] = useState<any[]>([]);
  const [documentDistribution, setDocumentDistribution] = useState<any[]>([]);
  const [activityTrend, setActivityTrend] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch all necessary data in parallel
        const [statsRes, userCountsRes, docsRes, queriesRes, versionsRes, systemEventsRes, pendingRes] = await Promise.all([
          axios.get("http://localhost:8000/system-stats"),
          axios.get("http://localhost:8000/users/counts"),
          axios.get("http://localhost:8000/documents"),
          axios.get("http://localhost:8000/audit/queries"),
          axios.get("http://localhost:8000/audit/versions"),
          axios.get("http://localhost:8000/audit/system"),
          axios.get("http://localhost:8000/admin/accreditation-pending")
        ]);

        // 1. Set Global Stats
        setGlobalStats({
          documents: statsRes.data.documents || 0,
          queries: statsRes.data.queries || 0,
          users: userCountsRes.data.all || 0
        });

        // 2. Set User Distribution Chart
        setUserDistribution([
          { role: "Admin", count: userCountsRes.data.all - userCountsRes.data.students - userCountsRes.data.faculty },
          { role: "Faculty", count: userCountsRes.data.faculty },
          { role: "Student", count: userCountsRes.data.students }
        ]);

        // 3. Set Document Categories Pie Chart
        const catCounts: Record<string, number> = {};
        docsRes.data.forEach((doc: any) => {
          const cat = doc.category || "Uncategorized";
          catCounts[cat] = (catCounts[cat] || 0) + 1;
        });
        
        const pieColors = ["#1D6FA3", "#3B82F6", "#60A5FA", "#93C5FD", "#006837", "#FDB913"];
        const formattedPieData = Object.keys(catCounts).map((key, index) => ({
          name: key,
          value: catCounts[key],
          color: pieColors[index % pieColors.length]
        }));
        setDocumentDistribution(formattedPieData);

        // 4. Calculate 6-Month Trend Data
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const displayMonths: string[] = [];
        const currentMonthIdx = new Date().getMonth();
        
        for(let i = 5; i >= 0; i--) {
            let mIndex = currentMonthIdx - i;
            if (mIndex < 0) mIndex += 12;
            displayMonths.push(monthNames[mIndex]);
        }

        const trendMap: Record<string, { month: string, documents: number, queries: number }> = {};
        displayMonths.forEach(m => trendMap[m] = { month: m, documents: 0, queries: 0 });

        // Helper to parse dynamic dates safely
        const extractMonth = (dateStr: string) => {
          if (!dateStr) return "";
          try {
            if (dateStr.includes("-") && !dateStr.includes(",")) {
              return monthNames[new Date(dateStr.split('T')[0]).getMonth()];
            }
            return dateStr.substring(0, 3); // Extracts "Apr" from "April 29..."
          } catch (e) { return ""; }
        };

        queriesRes.data.forEach((q: any) => {
          const m = extractMonth(q.timestamp);
          if (trendMap[m]) trendMap[m].queries++;
        });

        versionsRes.data.forEach((v: any) => {
          const m = extractMonth(v.timestamp);
          if (trendMap[m]) trendMap[m].documents++;
        });

        setActivityTrend(displayMonths.map(m => trendMap[m]));

        // 5. System Alerts (Pending Docs)
        setPendingReviewCount(pendingRes.data.length);

        // 6. Recent Activity List
        const recent = systemEventsRes.data.slice(0, 4).map((event: any) => ({
          action: event.type,
          document: event.description.length > 40 ? event.description.substring(0, 40) + "..." : event.description,
          time: event.timestamp.split(' - ')[0],
          user: event.user
        }));
        setRecentActivities(recent);

      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    {
      label: "Total Documents",
      value: globalStats.documents,
      icon: FileText,
      color: "#1D6FA3",
      subtitle: "active in repository"
    },
    {
      label: "AI Queries",
      value: globalStats.queries,
      icon: MessageSquare,
      color: "#10B981",
      subtitle: "all-time interactions"
    },
    {
      label: "Accreditation",
      value: "85%", // Placeholder until global calculation is built
      icon: CheckCircle,
      color: "#FDB913",
      subtitle: "avg. campus compliance"
    },
    {
      label: "Active Users",
      value: globalStats.users,
      icon: Users,
      color: "#006837",
      subtitle: "registered accounts"
    }
  ];

  const systemAlerts = [
    { 
      message: `${pendingReviewCount} document${pendingReviewCount !== 1 ? 's' : ''} pending QA review`, 
      severity: pendingReviewCount > 0 ? "warning" : "success", 
      icon: pendingReviewCount > 0 ? AlertCircle : CheckCircle 
    },
    { message: "AACCUP Level III Accreditation targeted in 6 months", severity: "info", icon: Clock },
    { message: "Nightly system backup & vector indexing completed", severity: "success", icon: CheckCircle }
  ];

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#1D6FA3]" />
        <p className="text-gray-500 font-medium">Compiling Institutional Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2937]">Admin Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-1">Complete system overview and management controls</p>
        </div>
        <div className="flex items-center gap-2 bg-[#1D6FA3] text-white px-4 py-2 rounded-lg shadow-sm">
          <Shield className="h-4 w-4" />
          <span className="text-sm font-medium">Administrator</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-[#E5E7EB] p-6 hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 pointer-events-none" style={{ backgroundColor: stat.color }}></div>
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon className="h-6 w-6" style={{ color: stat.color }} />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-1" style={{ color: stat.color }}>
                  {stat.value}
                </h3>
                <p className="text-sm text-[#1F2937] font-bold mb-1">{stat.label}</p>
                <p className="text-xs text-[#6B7280] font-medium">{stat.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Alerts */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-[#1D6FA3]" />
          <h2 className="text-lg font-bold text-[#1F2937]">System Health & Alerts</h2>
        </div>
        <div className="space-y-3">
          {systemAlerts.map((alert, index) => {
            const Icon = alert.icon;
            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-4 rounded-xl ${
                  alert.severity === "warning"
                    ? "bg-[#FFC107]/10 border border-[#FFC107]/20 text-yellow-800"
                    : alert.severity === "info"
                    ? "bg-blue-50 border border-blue-100 text-blue-800"
                    : "bg-green-50 border border-green-100 text-green-800"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    alert.severity === "warning"
                      ? "text-[#FFC107]"
                      : alert.severity === "info"
                      ? "text-[#1D6FA3]"
                      : "text-[#006837]"
                  }`}
                />
                <span className="text-sm font-semibold">{alert.message}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Activity Trend Chart */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm h-[400px] flex flex-col">
          <h2 className="text-lg font-bold text-[#1F2937] mb-6 flex items-center gap-2 flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-[#1D6FA3]" /> Activity Trends (6 Months)
          </h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 500 }} />
                <Line type="monotone" dataKey="documents" stroke="#1D6FA3" strokeWidth={3} dot={{ r: 4 }} name="Documents Uploaded" activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="queries" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} name="AI Queries" activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Document Categories Chart */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm h-[400px] flex flex-col">
          <h2 className="text-lg font-bold text-[#1F2937] mb-6 flex items-center gap-2 flex-shrink-0">
            <FileText className="h-5 w-5 text-[#FDB913]" /> Document Taxonomy
          </h2>
          <div className="flex-1 min-h-0">
            {documentDistribution.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400 font-medium italic">No documents uploaded yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={documentDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                    outerRadius={100}
                    innerRadius={40}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {documentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* User Distribution */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm h-[400px] flex flex-col">
          <h2 className="text-lg font-bold text-[#1F2937] mb-6 flex items-center gap-2 flex-shrink-0">
            <Users className="h-5 w-5 text-[#006837]" /> Active Demographics
          </h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="role" tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#1D6FA3" radius={[6, 6, 0, 0]} barSize={50} name="Total Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm h-[400px] flex flex-col">
          <h2 className="text-lg font-bold text-[#1F2937] mb-6 flex items-center gap-2 flex-shrink-0">
            <Clock className="h-5 w-5 text-[#CE0000]" /> Recent Audit Trail
          </h2>
          <div className="space-y-3 flex-1 overflow-y-auto pr-2 min-h-0 custom-scrollbar">
            {recentActivities.length === 0 ? (
               <div className="flex h-full items-center justify-center text-sm text-gray-400 font-medium italic">No recent system events.</div>
            ) : (
              recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-[#F9FAFB] border border-gray-100 rounded-xl hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex-1 overflow-hidden pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-1 bg-[#1D6FA3]/10 text-[#1D6FA3] text-[10px] uppercase tracking-wider rounded-md font-bold whitespace-nowrap">
                        {activity.action}
                      </span>
                      <span className="text-sm text-gray-500 font-medium whitespace-nowrap">{activity.time}</span>
                    </div>
                    <p className="text-sm text-[#1F2937] font-semibold truncate">{activity.document}</p>
                    <p className="text-xs text-[#6B7280] font-medium mt-1 truncate">Executed by: {activity.user}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}