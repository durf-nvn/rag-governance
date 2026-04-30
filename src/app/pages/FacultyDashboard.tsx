import { useState, useEffect } from "react";
import { FileText, MessageSquare, BookOpen, Award, TrendingUp, Clock, UploadCloud, Search, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import axios from "axios";
import { useNavigate } from "react-router";

export function FacultyDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Real Data States
  const [totalDocs, setTotalDocs] = useState(0);
  const [myQueriesCount, setMyQueriesCount] = useState(0);
  const [myAccessCount, setMyAccessCount] = useState(0);
  
  // Charts & Lists
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  // Accreditation State
  const [accreditationScore, setAccreditationScore] = useState(0);
  const [missingEvidence, setMissingEvidence] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const userEmail = localStorage.getItem('userEmail') || '';

        // Fetch all data in parallel! Notice the ?role=FACULTY on the stats route
        const [statsRes, historyRes, accessRes, accredRes] = await Promise.all([
          axios.get("http://localhost:8000/system-stats?role=FACULTY"),
          axios.get(`http://localhost:8000/chat-history?email=${userEmail}`),
          axios.get("http://localhost:8000/audit/access"),
          axios.get("http://localhost:8000/accreditation-status/BSIT") 
        ]);

        // 1. Top Level Stats
        setTotalDocs(statsRes.data.documents || 0);
        
        const userQueries = historyRes.data.filter((msg: any) => msg.role === 'user');
        setMyQueriesCount(userQueries.length);

        const myAccessLogs = accessRes.data.filter((log: any) => log.user === userEmail);
        setMyAccessCount(myAccessLogs.length);

        // 2. Accreditation Widget
        setAccreditationScore(accredRes.data.overall || 0);
        setMissingEvidence(accredRes.data.gaps || 0);

        // 3. Process Recent Activity (Views & Downloads)
        const formattedActivity = myAccessLogs.slice(0, 5).map((log: any) => ({
          title: log.document,
          action: log.action, 
          date: log.timestamp.split(' - ')[0],
          time: log.timestamp.split(' - ')[1]
        }));
        setRecentActivity(formattedActivity);

        // 4. Process Engagement Chart 
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentMonthIndex = new Date().getMonth();
        const displayMonths = [];
        
        for(let i = 5; i >= 0; i--) {
            let mIndex = currentMonthIndex - i;
            if (mIndex < 0) mIndex += 12;
            displayMonths.push(monthNames[mIndex]);
        }

        const counts: Record<string, { queries: number, access: number }> = {};
        displayMonths.forEach(m => counts[m] = { queries: 0, access: 0 });

        userQueries.forEach((q: any) => {
          const monthStr = q.created_at ? new Date(q.created_at).toLocaleString('default', { month: 'short' }) : "Jan";
          if (counts[monthStr]) counts[monthStr].queries++;
        });

        myAccessLogs.forEach((a: any) => {
          const monthStr = a.timestamp.split(' ')[0].substring(0, 3);
          if (counts[monthStr]) counts[monthStr].access++;
        });

        const finalChartData = displayMonths.map(m => ({
          month: m,
          Queries: counts[m].queries,
          Views: counts[m].access
        }));

        setChartData(finalChartData);

      } catch (error) {
        console.error("Failed to fetch faculty dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    {
      label: "Institutional Documents",
      value: totalDocs,
      icon: BookOpen,
      color: "#1D6FA3",
      subtitle: "Active in repository"
    },
    {
      label: "My AI Queries",
      value: myQueriesCount,
      icon: MessageSquare,
      color: "#006837",
      subtitle: "Last 7 days"
    },
    {
      label: "My Document Access",
      value: myAccessCount,
      icon: FileText,
      color: "#FDB913",
      subtitle: "Total views & downloads"
    },
    {
      label: "QA Pending Tasks",
      value: missingEvidence,
      icon: Clock,
      color: "#CE0000",
      subtitle: "Missing BSIT evidence"
    }
  ];

  const pieData = [
    { name: "Compliant", value: accreditationScore },
    { name: "Missing", value: 100 - accreditationScore }
  ];
  const PIE_COLORS = ["#006837", "#E5E7EB"];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2937]">Faculty Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-1">Manage institutional knowledge and accreditation compliance</p>
        </div>
        <div className="flex items-center gap-2 bg-[#1D6FA3] text-white px-4 py-2 rounded-lg shadow-sm">
          <Award className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-wider">Faculty Portal</span>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 pointer-events-none" style={{ backgroundColor: stat.color }}></div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${stat.color}15` }}>
                  <Icon className="h-6 w-6" style={{ color: stat.color }} />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-1" style={{ color: stat.color }}>
                  {isLoading ? "..." : stat.value}
                </h3>
                <p className="text-sm text-gray-900 font-bold mb-1">{stat.label}</p>
                <p className="text-xs text-gray-500 font-medium">{stat.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Engagement Activity Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#1D6FA3]" />
            My System Engagement (6 Months)
          </h2>
          {isLoading ? (
            <div className="h-[250px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="Views" fill="#FDB913" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Queries" fill="#006837" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Accreditation Readiness Widget */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#006837] to-[#10B981]"></div>
          <h2 className="text-lg font-bold text-gray-900 mb-2 w-full text-left flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#006837]" />
            BSIT QA Readiness
          </h2>
          <p className="text-xs text-gray-500 mb-4 w-full text-left">Real-time accreditation compliance</p>
          
          {isLoading ? (
            <div className="h-[180px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
          ) : (
            <div className="relative w-full h-[180px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-[#006837]">{accreditationScore}%</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Compliant</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Activity List */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#1D6FA3]" />
            My Recent Activity
          </h2>
          {isLoading ? (
             <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
          ) : recentActivity.length === 0 ? (
             <div className="text-center py-8 text-sm text-gray-500 italic border-2 border-dashed border-gray-100 rounded-xl">
               No recent activity found.
             </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((log, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-xl hover:bg-[#F3F4F6] transition-colors border border-gray-100">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${log.action === 'Download' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {log.action === 'Download' ? <UploadCloud className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <div className="truncate">
                      <p className="text-sm text-gray-900 font-bold truncate">{log.title}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">{log.action} • {log.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/app/accreditation-support')} 
            className="bg-gradient-to-br from-[#006837] to-[#004d28] rounded-xl p-6 text-left hover:shadow-lg transition-all group flex flex-col justify-between relative overflow-hidden active:scale-95 cursor-pointer"
          >
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6 shadow-inner">
              <UploadCloud className="h-6 w-6 text-white" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white mb-1">Submit Evidence</h3>
              <p className="text-sm text-white/80 font-medium">Upload QA documents</p>
            </div>
            <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>

          <button 
            onClick={() => navigate('/app/knowledge-repository')} 
            className="bg-gradient-to-br from-[#1D6FA3] to-[#0B3C5D] rounded-xl p-6 text-left hover:shadow-lg transition-all group flex flex-col justify-between relative overflow-hidden active:scale-95 cursor-pointer"
          >
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6 shadow-inner">
              <Search className="h-6 w-6 text-white" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white mb-1">Browse Policies</h3>
              <p className="text-sm text-white/80 font-medium">Access global repository</p>
            </div>
            <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>
        </div>

      </div>
    </div>
  );
}