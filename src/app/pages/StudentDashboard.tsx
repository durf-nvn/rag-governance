import { useState, useEffect } from "react";
import { BookOpen, MessageSquare, Calendar, GraduationCap, Clock, Search, ArrowRight, TrendingUp, History, FileText, Loader2, X, Radio } from "lucide-react";
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
  
  // --- NEW: Live Announcements State ---
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null); // For the view modal

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const userEmail = localStorage.getItem('userEmail') || '';

        // Fetch all the data we need in parallel (Added /announcements)
        const [statsRes, historyRes, accessRes, queriesRes, announcementsRes] = await Promise.all([
          axios.get("http://localhost:8000/system-stats"),
          axios.get(`http://localhost:8000/chat-history?email=${userEmail}`),
          axios.get("http://localhost:8000/audit/access"),
          axios.get("http://localhost:8000/audit/queries"),
          axios.get("http://localhost:8000/announcements")
        ]);

        // 1. Available Resources (Global)
        setTotalDocs(statsRes.data.documents || 0);

        // 2. My Queries (This Week) 
        const userQueries = historyRes.data.filter((msg: any) => msg.role === 'user');
        setWeeklyQueries(userQueries.length);

        // 3. Process Access Logs for the current student
        const myAccessLogs = accessRes.data.filter((log: any) => log.user === userEmail);
        setRecentViewsCount(myAccessLogs.length);

        const formattedRecentDocs = myAccessLogs.slice(0, 4).map((log: any) => ({
          title: log.document,
          category: log.action, 
          date: log.timestamp.split(' - ')[0] 
        }));
        setRecentDocs(formattedRecentDocs);

        // 4. Process Chart Data
        const myAllTimeQueries = queriesRes.data.filter((log: any) => log.user === userEmail);
        const monthCounts: Record<string, number> = { 
          "Jan": 0, "Feb": 0, "Mar": 0, "Apr": 0, "May": 0, "Jun": 0, 
          "Jul": 0, "Aug": 0, "Sep": 0, "Oct": 0, "Nov": 0, "Dec": 0 
        };

        myAllTimeQueries.forEach((q: any) => {
          const monthStr = q.timestamp.split(' ')[0].substring(0, 3); 
          if (monthCounts[monthStr] !== undefined) {
             monthCounts[monthStr]++;
          }
        });

        const currentMonthIndex = new Date().getMonth();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const displayMonths = [];
        
        for(let i = 5; i >= 0; i--) {
            let mIndex = currentMonthIndex - i;
            if (mIndex < 0) mIndex += 12;
            displayMonths.push(monthNames[mIndex]);
        }

        const finalChartData = displayMonths.map(m => ({ 
          month: m, 
          queries: monthCounts[m] || 0 
        }));
        
        setChartData(finalChartData);

        // --- NEW: Process Live Announcements ---
        const validAnnouncements = announcementsRes.data
          .filter((a: any) => 
            a.status === "Sent" && 
            (a.recipients.includes("All Users") || a.recipients.includes("All Students"))
          )
          .map((a: any) => {
            const d = new Date(a.sent_date);
            return {
              id: a.id,
              title: a.title,
              content: a.content,
              sent_by: a.sent_by,
              date: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            };
          })
          .slice(0, 4); // Only show the 4 most recent ones

        setAnnouncements(validAnnouncements);

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
    <div className="space-y-6 animate-in fade-in duration-500 relative pb-10">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
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
        
        {/* Query Activity Chart */}
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

        {/* Live Announcements */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#CE0000]" />
              <h2 className="text-lg font-bold text-gray-900">Recent Announcements</h2>
            </div>
            {announcements.length > 0 && (
              <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{announcements.length} New</span>
            )}
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {isLoading ? (
               <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
            ) : announcements.length === 0 ? (
               <div className="text-center py-10 text-sm text-gray-500 italic border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center gap-2">
                 <Radio className="h-8 w-8 text-gray-300" />
                 No recent announcements.
               </div>
            ) : (
              announcements.map((announcement, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedAnnouncement(announcement)}
                  className="flex items-start gap-3 p-3.5 bg-[#F9FAFB] rounded-xl hover:bg-white hover:shadow-md transition-all border border-gray-100 cursor-pointer group"
                >
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-[#FDB913] flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                  <div>
                    <p className="text-sm text-gray-900 font-bold leading-snug line-clamp-2 group-hover:text-[#1D6FA3] transition-colors">{announcement.title}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1.5">{announcement.date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recently Viewed Docs & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
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

      {/* --- NEW: ANNOUNCEMENT VIEW MODAL --- */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-[#F5F7FA]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                  <Radio className="h-5 w-5 text-[#CE0000]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Official Broadcast</h3>
                  <p className="text-xs text-gray-500 font-medium">{selectedAnnouncement.date}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAnnouncement(null)} 
                className="text-gray-400 hover:text-gray-900 bg-white hover:bg-gray-50 p-1.5 rounded-full border border-gray-200 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6">
              <h4 className="text-xl font-bold text-[#1F2937] mb-4 leading-tight">{selectedAnnouncement.title}</h4>
              <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                {selectedAnnouncement.content}
              </div>
              
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500 font-medium pt-4 border-t border-gray-100">
                <span>Sender: <span className="text-gray-900">{selectedAnnouncement.sent_by}</span></span>
                <span>CTU Argao Campus</span>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-[#F9FAFB] flex justify-end">
              <button 
                onClick={() => setSelectedAnnouncement(null)} 
                className="px-6 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer shadow-sm active:scale-95"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}