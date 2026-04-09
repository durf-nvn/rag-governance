import { FileText, MessageSquare, CheckCircle, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export function Dashboard() {
  const stats = [
    {
      label: "Total Documents",
      value: "487",
      icon: FileText,
      color: "#CE0000",
      change: "+12 this month"
    },
    {
      label: "Recent Queries",
      value: "1,234",
      icon: MessageSquare,
      color: "#FDB913",
      change: "+45 today"
    },
    {
      label: "Accreditation Status",
      value: "85%",
      icon: CheckCircle,
      color: "#006837",
      change: "Compliance"
    },
    {
      label: "Recently Updated",
      value: "23",
      icon: Clock,
      color: "#D4AF37",
      change: "Last 7 days"
    }
  ];

  const documentActivityData = [
    { month: "Jan", documents: 45 },
    { month: "Feb", documents: 52 },
    { month: "Mar", documents: 48 },
    { month: "Apr", documents: 61 },
    { month: "May", documents: 55 },
    { month: "Jun", documents: 67 }
  ];

  const documentCategoryData = [
    { name: "Policies", value: 145 },
    { name: "Procedures", value: 98 },
    { name: "Guidelines", value: 123 },
    { name: "Memoranda", value: 121 }
  ];

  const COLORS = ["#CE0000", "#FDB913", "#006837", "#D4AF37"];

  const recentActivities = [
    { action: "Policy Update", document: "Student Handbook 2026", time: "2 hours ago", user: "Dr. Maria Santos" },
    { action: "New Document", document: "Research Ethics Guidelines", time: "5 hours ago", user: "Prof. Juan Cruz" },
    { action: "Query", document: "Grading System Policy", time: "1 day ago", user: "Faculty User" },
    { action: "Document Review", document: "Accreditation Report", time: "2 days ago", user: "QA Officer" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's an overview of your institutional knowledge system.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon className="h-6 w-6" style={{ color: stat.color }} />
                </div>
              </div>
              <div>
                <h3 className="text-3xl mb-1" style={{ color: stat.color }}>
                  {stat.value}
                </h3>
                <p className="text-gray-700 text-sm mb-1">{stat.label}</p>
                <p className="text-xs text-gray-500">{stat.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Activity Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl mb-4 text-[#CE0000]">Document Activity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={documentActivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="documents" fill="#CE0000" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Document Categories Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl mb-4 text-[#CE0000]">Document Categories</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={documentCategoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {documentCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl mb-4 text-[#CE0000]">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-l-4 border-[#FDB913] pl-4 py-3 hover:bg-[#F5F5F5] transition-colors"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-1 bg-[#CE0000] text-white text-xs rounded">
                    {activity.action}
                  </span>
                  <span className="text-gray-900">{activity.document}</span>
                </div>
                <p className="text-sm text-gray-600">by {activity.user}</p>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-shadow border-t-4 border-[#CE0000]">
          <h3 className="text-lg mb-2 text-gray-900">Upload New Document</h3>
          <p className="text-sm text-gray-600">Add policies, procedures, or guidelines to the repository</p>
        </button>

        <button className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-shadow border-t-4 border-[#FDB913]">
          <h3 className="text-lg mb-2 text-gray-900">Ask AI Assistant</h3>
          <p className="text-sm text-gray-600">Get instant answers to policy and governance questions</p>
        </button>

        <button className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-shadow border-t-4 border-[#006837]">
          <h3 className="text-lg mb-2 text-gray-900">Check Compliance</h3>
          <p className="text-sm text-gray-600">Review accreditation requirements and evidence</p>
        </button>
      </div>
    </div>
  );
}
