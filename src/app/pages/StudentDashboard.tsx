import { useState, useEffect } from "react";
import { BookOpen, MessageSquare, Calendar, GraduationCap, Clock, Search, ArrowRight, TrendingUp, History, FileText, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";
import { useNavigate } from "react-router";

export function StudentDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Real Data States
  const [totalDocs, setTotalDocs] = useState(0);
  const [weeklyQueries, setWeeklyQueries] = useState(0);
  const [recentViewsCount, setRecentViewsCount] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);

  // Mock Announcements (As requested)
  const announcements = [
    { title: "Midterm Examination Schedule Released", date: "March 10, 2026" },
    { title: "Library Extended Hours This Week", date: "March 9, 2026" },
    { title: "New Research Database Available", date: "March 8, 2026" },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const userEmail = localStorage.getItem('userEmail') || '';

        // Fetch all the data we need in parallel!
        const [statsRes, historyRes, accessRes, queriesRes] = await Promise.all([
          axios.get("http://localhost:8000/system-stats"),
          axios.get(`http://localhost:8000/chat-history?email=${userEmail}`),
          axios.get("http://localhost:8000/audit/access"),
          axios.get("http://localhost:8000/audit/queries")
        ]);

        // 1. Available Resources (Global)
        setTotalDocs(statsRes.data.documents || 0);

        // 2. My Queries (This Week) 
        // The backend already filters history to the last 7 days!
        const userQueries = historyRes.data.filter((msg: any) => msg.role === 'user');
        setWeeklyQueries(userQueries.length);

        // 3. Process Access Logs for the current student
        const myAccessLogs = accessRes.data.filter((log: any) => log.user === userEmail);
        setRecentViewsCount(myAccessLogs.length);

        // Map the most recent 4 views for the UI list
        const formattedRecentDocs = myAccessLogs.slice(0, 4).map((log: any) => ({
          title: log.document,
          category: log.action, // e.g., "View" or "Download"
          date: log.timestamp.split(' - ')[0] // Just taking the date part
        }));
        setRecentDocs(formattedRecentDocs);

        // 4. Process Chart Data
        const myAllTimeQueries = queriesRes.data.filter((log: any) => log.user === userEmail);
        
        // Initialize an object to count queries per month
        const monthCounts: Record<string, number> = { 
          "Jan": 0, "Feb": 0, "Mar": 0, "Apr": 0, "May": 0, "Jun": 0, 
          "Jul": 0, "Aug": 0, "Sep": 0, "Oct": 0, "Nov": 0, "Dec": 0 
        };

        myAllTimeQueries.forEach((q: any) => {
          // The timestamp from backend looks like "April 29, 2026 - 05:51 PM"
          const monthStr = q.timestamp.split(' ')[0].substring(0, 3); // Extracts "Apr"
          if (monthCounts[monthStr] !== undefined) {
             monthCounts[monthStr]++;
          }
        });

        // Get the last 6 months dynamically based on the current date
        const currentMonthIndex = new Date().getMonth();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const displayMonths = [];
        
        for(let i = 5; i >= 0; i--) {
            let mIndex = currentMonthIndex - i;
            if (mIndex < 0) mIndex += 12;
            displayMonths.push(monthNames[mIndex]);
        }

        // Finalize the array for Recharts
        const finalChartData = displayMonths.map(m => ({ 
          month: m, 
          queries: monthCounts[m] || 0 
        }));
        
        setChartData(finalChartData);

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    {
      label: "Available Resources",
      value: totalDocs,
      icon: BookOpen,
      color: "#1D6FA3",
      subtitle: "indexed documents"
    },
    {
      label: "My Queries",
      value: weeklyQueries,
      icon: MessageSquare,
      color: "#10B981",
      subtitle: "this week"
    },
    {
      label: "Recent Access",
      value: recentViewsCount,
      icon: Clock,
      color: "#FDB913",
      subtitle: "tracked events"
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2937]">Student Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-1">Access your learning resources and university information</p>
        </div>
        <div className="flex items-center gap-2 bg-[#10B981] text-white px-4 py-2 rounded-lg shadow-sm">
          <GraduationCap className="h-4 w-4" />
          <span className="text-sm font-medium">Student</span>
        </div>
      </div>

      {/* Stats Cards (Updated to 3 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Decorative background accent */}
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 pointer-events-none" style={{ backgroundColor: stat.color }}></div>
              
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon className="h-6 w-6" style={{ color: stat.color }} />
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-bold mb-1" style={{ color: stat.color }}>
                  {isLoading ? "..." : stat.value}
                </h3>
                <p className="text-sm text-gray-900 font-bold tracking-wide mb-1">{stat.label}</p>
                <p className="text-xs text-gray-500 font-medium">{stat.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Row: Chart & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Query Activity Chart (Takes up 2/3 of the space) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#1D6FA3]" />
            My Query Activity (6 Months)
          </h2>
          
          {isLoading ? (
            <div className="h-[280px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#F9FAFB' }}
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#10B981' }}
                />
                <Bar dataKey="queries" fill="#1D6FA3" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Announcements (Takes up 1/3 of the space) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-5 w-5 text-[#CE0000]" />
            <h2 className="text-lg font-bold text-gray-900">Recent Announcements</h2>
          </div>
          <div className="space-y-4 flex-1">
            {announcements.map((announcement, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-[#F9FAFB] rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-200 cursor-pointer"
              >
                <div className="mt-1 w-2 h-2 rounded-full bg-[#FDB913] flex-shrink-0"></div>
                <div>
                  <p className="text-sm text-gray-900 font-bold leading-snug">{announcement.title}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1.5">{announcement.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recently Viewed Docs & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recently Viewed Documents */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <History className="h-5 w-5 text-[#006837]" />
            Recently Accessed Documents
          </h2>
          
          {isLoading ? (
             <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
          ) : recentDocs.length === 0 ? (
             <div className="text-center py-8 text-sm text-gray-500 italic border-2 border-dashed border-gray-100 rounded-xl">
               No documents accessed yet.
             </div>
          ) : (
            <div className="space-y-3">
              {recentDocs.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-xl hover:bg-[#F3F4F6] transition-colors border border-gray-100"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="truncate">
                      <p className="text-sm text-gray-900 font-bold truncate">{doc.title}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5 uppercase tracking-wider">{doc.category}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 font-medium whitespace-nowrap pl-4">{doc.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions (Two large buttons) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <button 
            onClick={() => navigate('/app/knowledge-repository')} 
            className="bg-gradient-to-br from-[#1D6FA3] to-[#0B3C5D] rounded-xl p-6 text-left hover:shadow-lg transition-all group flex flex-col justify-between relative overflow-hidden active:scale-95 cursor-pointer"
          >
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6 shadow-inner">
              <Search className="h-6 w-6 text-white" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white mb-1">Browse Repository</h3>
              <p className="text-sm text-white/80 font-medium">Search policies & manuals</p>
            </div>
            <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>

          <button 
            onClick={() => navigate('/app/ask-policy')} 
            className="bg-gradient-to-br from-[#006837] to-[#004d28] rounded-xl p-6 text-left hover:shadow-lg transition-all group flex flex-col justify-between relative overflow-hidden active:scale-95 cursor-pointer"
          >
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6 shadow-inner">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white mb-1">Ask AskPolicy AI</h3>
              <p className="text-sm text-white/80 font-medium">Get instant policy answers</p>
            </div>
            <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>
        </div>

      </div>
    </div>
  );
}