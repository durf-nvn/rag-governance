import { FileText, MessageSquare, CheckCircle, Clock, Users, Shield, AlertCircle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

export function AdminDashboard() {
  const stats = [
    {
      label: "Total Documents",
      value: "487",
      icon: FileText,
      color: "#1D6FA3",
      change: "+12",
      subtitle: "from last month"
    },
    {
      label: "AI Queries",
      value: "1,234",
      icon: MessageSquare,
      color: "#1D6FA3",
      change: "+45",
      subtitle: "this week"
    },
    {
      label: "Accreditation",
      value: "85%",
      icon: CheckCircle,
      color: "#10B981",
      change: "On Track",
      subtitle: "compliance rate"
    },
    {
      label: "Active Users",
      value: "156",
      icon: Users,
      color: "#1D6FA3",
      change: "23 online",
      subtitle: "right now"
    }
  ];

  const activityData = [
    { month: "Jan", documents: 45, queries: 234 },
    { month: "Feb", documents: 52, queries: 298 },
    { month: "Mar", documents: 48, queries: 312 },
    { month: "Apr", documents: 61, queries: 389 },
    { month: "May", documents: 55, queries: 421 },
    { month: "Jun", documents: 67, queries: 456 }
  ];

  const documentCategoryData = [
    { name: "Policies", value: 145, color: "#1D6FA3" },
    { name: "Procedures", value: 98, color: "#3B82F6" },
    { name: "Guidelines", value: 123, color: "#60A5FA" },
    { name: "Memoranda", value: 121, color: "#93C5FD" }
  ];

  const userActivityData = [
    { role: "Admin", count: 12 },
    { role: "Faculty", count: 89 },
    { role: "Student", count: 55 }
  ];

  const recentActivities = [
    { action: "Policy Update", document: "Student Handbook 2026", time: "2 hours ago", user: "Dr. Maria Santos", type: "update" },
    { action: "New Upload", document: "Research Ethics Guidelines", time: "5 hours ago", user: "Prof. Juan Cruz", type: "upload" },
    { action: "User Added", document: "Faculty Member: John Doe", time: "1 day ago", user: "Admin User", type: "user" },
    { action: "Document Review", document: "Accreditation Report", time: "2 days ago", user: "QA Officer", type: "review" },
  ];

  const systemAlerts = [
    { message: "5 documents pending review", severity: "warning", icon: AlertCircle },
    { message: "Accreditation deadline in 30 days", severity: "info", icon: Clock },
    { message: "System backup completed", severity: "success", icon: CheckCircle }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2937]">Admin Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-1">Complete system overview and management controls</p>
        </div>
        <div className="flex items-center gap-2 bg-[#1D6FA3] text-white px-4 py-2 rounded-lg">
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
              className="bg-white rounded-lg border border-[#E5E7EB] p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon className="h-6 w-6" style={{ color: stat.color }} />
                </div>
                {stat.change && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-[#F5F7FA] text-[#6B7280] rounded text-xs font-medium">
                    <TrendingUp className="h-3 w-3" />
                    {stat.change}
                  </div>
                )}
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

      {/* System Alerts */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-[#1D6FA3]" />
          <h2 className="text-lg font-semibold text-[#1F2937]">System Alerts</h2>
        </div>
        <div className="space-y-3">
          {systemAlerts.map((alert, index) => {
            const Icon = alert.icon;
            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-4 rounded-lg ${
                  alert.severity === "warning"
                    ? "bg-[#FFC107]/10 border-l-4 border-[#FFC107]"
                    : alert.severity === "info"
                    ? "bg-blue-50 border-l-4 border-blue-400"
                    : "bg-green-50 border-l-4 border-green-400"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    alert.severity === "warning"
                      ? "text-[#FFC107]"
                      : alert.severity === "info"
                      ? "text-blue-600"
                      : "text-green-600"
                  }`}
                />
                <span className="text-sm text-[#1F2937] font-medium">{alert.message}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Trend Chart */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <h2 className="text-lg font-semibold text-[#1F2937] mb-4">Activity Trends</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={activityData}>
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
              <Legend />
              <Line type="monotone" dataKey="documents" stroke="#1D6FA3" strokeWidth={2} name="Documents" />
              <Line type="monotone" dataKey="queries" stroke="#60A5FA" strokeWidth={2} name="Queries" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Document Categories Chart */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <h2 className="text-lg font-semibold text-[#1F2937] mb-4">Document Distribution</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={documentCategoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {documentCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* User Distribution */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <h2 className="text-lg font-semibold text-[#1F2937] mb-4">User Distribution</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={userActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="role" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" fill="#1D6FA3" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <h2 className="text-lg font-semibold text-[#1F2937] mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-[#F5F7FA] rounded-lg hover:bg-[#E5E7EB] transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-[#1D6FA3] text-white text-xs rounded font-medium">
                      {activity.action}
                    </span>
                    <span className="text-sm text-[#1F2937] font-medium">{activity.document}</span>
                  </div>
                  <p className="text-xs text-[#6B7280]">by {activity.user}</p>
                </div>
                <span className="text-xs text-[#6B7280]">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button className="bg-white rounded-lg border border-[#E5E7EB] p-6 text-left hover:border-[#1D6FA3] hover:shadow-md transition-all group">
          <div className="w-12 h-12 bg-[#1D6FA3]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#1D6FA3] transition-colors">
            <FileText className="h-6 w-6 text-[#1D6FA3] group-hover:text-white" />
          </div>
          <h3 className="text-base font-semibold text-[#1F2937] mb-1">Upload Document</h3>
          <p className="text-sm text-[#6B7280]">Add new policies or procedures</p>
        </button>

        <button className="bg-white rounded-lg border border-[#E5E7EB] p-6 text-left hover:border-[#1D6FA3] hover:shadow-md transition-all group">
          <div className="w-12 h-12 bg-[#1D6FA3]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#1D6FA3] transition-colors">
            <Users className="h-6 w-6 text-[#1D6FA3] group-hover:text-white" />
          </div>
          <h3 className="text-base font-semibold text-[#1F2937] mb-1">Manage Users</h3>
          <p className="text-sm text-[#6B7280]">Add or edit user accounts</p>
        </button>

        <button className="bg-white rounded-lg border border-[#E5E7EB] p-6 text-left hover:border-[#1D6FA3] hover:shadow-md transition-all group">
          <div className="w-12 h-12 bg-[#1D6FA3]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#1D6FA3] transition-colors">
            <Clock className="h-6 w-6 text-[#1D6FA3] group-hover:text-white" />
          </div>
          <h3 className="text-base font-semibold text-[#1F2937] mb-1">View Audit Trail</h3>
          <p className="text-sm text-[#6B7280]">Track all system activities</p>
        </button>

        <button className="bg-white rounded-lg border border-[#E5E7EB] p-6 text-left hover:border-[#1D6FA3] hover:shadow-md transition-all group">
          <div className="w-12 h-12 bg-[#1D6FA3]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#1D6FA3] transition-colors">
            <Shield className="h-6 w-6 text-[#1D6FA3] group-hover:text-white" />
          </div>
          <h3 className="text-base font-semibold text-[#1F2937] mb-1">System Settings</h3>
          <p className="text-sm text-[#6B7280]">Configure system parameters</p>
        </button>
      </div>
    </div>
  );
}
