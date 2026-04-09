import { BookOpen, MessageSquare, FileText, Calendar, GraduationCap, Clock, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function StudentDashboard() {
  const stats = [
    {
      label: "Available Resources",
      value: "487",
      icon: BookOpen,
      color: "#1D6FA3",
      subtitle: "documents"
    },
    {
      label: "My Queries",
      value: "12",
      icon: MessageSquare,
      color: "#1D6FA3",
      subtitle: "this week"
    },
    {
      label: "Bookmarked",
      value: "8",
      icon: FileText,
      color: "#10B981",
      subtitle: "saved"
    },
    {
      label: "Recent Views",
      value: "23",
      icon: Clock,
      color: "#1D6FA3",
      subtitle: "last 30 days"
    }
  ];

  const queryActivityData = [
    { month: "Jan", queries: 2 },
    { month: "Feb", queries: 3 },
    { month: "Mar", queries: 1 },
    { month: "Apr", queries: 4 },
    { month: "May", queries: 5 },
    { month: "Jun", queries: 3 }
  ];

  const recentlyViewed = [
    { title: "Student Handbook 2026", category: "Policies", date: "1 day ago" },
    { title: "Enrollment Guidelines", category: "Procedures", date: "3 days ago" },
    { title: "Scholarship Requirements", category: "Guidelines", date: "1 week ago" },
    { title: "Grading System Policy", category: "Policies", date: "1 week ago" },
  ];

  const quickLinks = [
    { title: "Academic Calendar", category: "Reference", color: "#1D6FA3" },
    { title: "Course Offerings", category: "Academic", color: "#3B82F6" },
    { title: "Student Services", category: "Support", color: "#60A5FA" },
    { title: "Campus Facilities", category: "Information", color: "#93C5FD" },
  ];

  const announcements = [
    { title: "Midterm Examination Schedule Released", date: "March 10, 2026" },
    { title: "Library Extended Hours This Week", date: "March 9, 2026" },
    { title: "New Research Database Available", date: "March 8, 2026" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2937]">Student Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-1">Access your learning resources and university information</p>
        </div>
        <div className="flex items-center gap-2 bg-[#10B981] text-white px-4 py-2 rounded-lg">
          <GraduationCap className="h-4 w-4" />
          <span className="text-sm font-medium">Student</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-lg border border-[#E5E7EB] p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon className="h-6 w-6" style={{ color: stat.color }} />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-1" style={{ color: stat.color }}>
                  {stat.value}
                </h3>
                <p className="text-sm text-[#1F2937] font-medium mb-1">{stat.label}</p>
                <p className="text-xs text-[#6B7280]">{stat.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Announcements */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-[#1D6FA3]" />
          <h2 className="text-lg font-semibold text-[#1F2937]">Recent Announcements</h2>
        </div>
        <div className="space-y-3">
          {announcements.map((announcement, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-[#F5F7FA] rounded-lg hover:bg-[#E5E7EB] transition-colors"
            >
              <div>
                <p className="text-sm text-[#1F2937] font-medium">{announcement.title}</p>
                <p className="text-xs text-[#6B7280] mt-1">{announcement.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts and Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Query Activity */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <h2 className="text-lg font-semibold text-[#1F2937] mb-4">My Query Activity</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={queryActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="queries" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <h2 className="text-lg font-semibold text-[#1F2937] mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link, index) => (
              <button
                key={index}
                className="p-4 bg-[#F5F7FA] rounded-lg hover:shadow-md transition-all text-left border-l-4"
                style={{ borderColor: link.color }}
              >
                <p className="text-sm text-[#1F2937] font-medium mb-1">{link.title}</p>
                <p className="text-xs text-[#6B7280]">{link.category}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recently Viewed Documents */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
        <h2 className="text-lg font-semibold text-[#1F2937] mb-4">Recently Viewed Documents</h2>
        <div className="space-y-3">
          {recentlyViewed.map((doc, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-[#F5F7FA] rounded-lg hover:bg-[#E5E7EB] transition-colors"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-[#1F2937] font-medium">{doc.title}</span>
                </div>
                <p className="text-xs text-[#6B7280]">{doc.category}</p>
              </div>
              <span className="text-xs text-[#6B7280]">{doc.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button className="bg-white rounded-lg border border-[#E5E7EB] p-6 text-left hover:border-[#1D6FA3] hover:shadow-md transition-all group">
          <div className="w-12 h-12 bg-[#1D6FA3]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#1D6FA3] transition-colors">
            <BookOpen className="h-6 w-6 text-[#1D6FA3] group-hover:text-white" />
          </div>
          <h3 className="text-base font-semibold text-[#1F2937] mb-1">Browse Resources</h3>
          <p className="text-sm text-[#6B7280]">Search policies and handbooks</p>
        </button>

        <button className="bg-white rounded-lg border border-[#E5E7EB] p-6 text-left hover:border-[#1D6FA3] hover:shadow-md transition-all group">
          <div className="w-12 h-12 bg-[#1D6FA3]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#1D6FA3] transition-colors">
            <MessageSquare className="h-6 w-6 text-[#1D6FA3] group-hover:text-white" />
          </div>
          <h3 className="text-base font-semibold text-[#1F2937] mb-1">Ask AI Assistant</h3>
          <p className="text-sm text-[#6B7280]">Get answers about policies</p>
        </button>
      </div>
    </div>
  );
}
