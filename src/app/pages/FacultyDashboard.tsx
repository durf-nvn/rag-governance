import { FileText, MessageSquare, CheckCircle, BookOpen, Award, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export function FacultyDashboard() {
  const stats = [
    {
      label: "My Documents",
      value: "34",
      icon: FileText,
      color: "#CE0000",
      change: "+3 this month"
    },
    {
      label: "My Queries",
      value: "87",
      icon: MessageSquare,
      color: "#FDB913",
      change: "+12 this week"
    },
    {
      label: "Courses",
      value: "5",
      icon: BookOpen,
      color: "#006837",
      change: "Active"
    },
    {
      label: "Accreditation Tasks",
      value: "8",
      icon: Award,
      color: "#D4AF37",
      change: "3 pending"
    }
  ];

  const myActivityData = [
    { month: "Jan", uploads: 5, queries: 12 },
    { month: "Feb", uploads: 7, queries: 15 },
    { month: "Mar", uploads: 6, queries: 18 },
    { month: "Apr", uploads: 9, queries: 21 },
    { month: "May", uploads: 4, queries: 14 },
    { month: "Jun", uploads: 8, queries: 17 }
  ];

  const documentTypeData = [
    { name: "Syllabus", value: 12 },
    { name: "Handouts", value: 15 },
    { name: "Assessments", value: 5 },
    { name: "Research", value: 2 }
  ];

  const COLORS = ["#CE0000", "#FDB913", "#006837", "#D4AF37"];

  const recentDocuments = [
    { title: "Data Structures Syllabus", type: "Syllabus", date: "2 days ago", status: "Approved" },
    { title: "Midterm Exam Questions", type: "Assessment", date: "5 days ago", status: "Pending Review" },
    { title: "Algorithm Analysis Handout", type: "Handout", date: "1 week ago", status: "Approved" },
    { title: "Research Proposal Template", type: "Research", date: "2 weeks ago", status: "Approved" },
  ];

  const upcomingTasks = [
    { task: "Submit Course Syllabi", deadline: "March 15, 2026", priority: "High" },
    { task: "Update Student Grades", deadline: "March 20, 2026", priority: "Medium" },
    { task: "Accreditation Documentation", deadline: "March 25, 2026", priority: "High" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Faculty Dashboard</h1>
          <p className="text-gray-600">Your teaching materials and academic resources</p>
        </div>
        <div className="flex items-center gap-2 bg-[#FDB913] text-gray-900 px-4 py-2 rounded-lg">
          <BookOpen className="h-5 w-5" />
          <span className="font-semibold">Faculty</span>
        </div>
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

      {/* Upcoming Tasks */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl mb-4 text-[#CE0000]">Upcoming Tasks & Deadlines</h2>
        <div className="space-y-3">
          {upcomingTasks.map((task, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-[#F5F5F5] rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${task.priority === "High" ? "bg-[#CE0000]" : "bg-[#FDB913]"}`}></div>
                <div>
                  <p className="text-gray-900 font-medium">{task.task}</p>
                  <p className="text-sm text-gray-600">Due: {task.deadline}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs ${task.priority === "High" ? "bg-[#CE0000] text-white" : "bg-[#FDB913] text-gray-900"}`}>
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Activity Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl mb-4 text-[#CE0000]">My Activity Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={myActivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="uploads" fill="#CE0000" />
              <Bar dataKey="queries" fill="#FDB913" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Document Type Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl mb-4 text-[#CE0000]">My Documents by Type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={documentTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {documentTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl mb-4 text-[#CE0000]">Recent Documents</h2>
        <div className="space-y-4">
          {recentDocuments.map((doc, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-l-4 border-[#FDB913] pl-4 py-3 hover:bg-[#F5F5F5] transition-colors"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-900 font-medium">{doc.title}</span>
                </div>
                <p className="text-sm text-gray-600">{doc.type} • {doc.date}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs ${doc.status === "Approved" ? "bg-[#006837] text-white" : "bg-[#FDB913] text-gray-900"}`}>
                {doc.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-shadow border-t-4 border-[#CE0000]">
          <h3 className="text-lg mb-2 text-gray-900">Upload Document</h3>
          <p className="text-sm text-gray-600">Add course materials or resources</p>
        </button>

        <button className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-shadow border-t-4 border-[#FDB913]">
          <h3 className="text-lg mb-2 text-gray-900">Ask AI Assistant</h3>
          <p className="text-sm text-gray-600">Get help with policies and procedures</p>
        </button>

        <button className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-shadow border-t-4 border-[#006837]">
          <h3 className="text-lg mb-2 text-gray-900">View Resources</h3>
          <p className="text-sm text-gray-600">Browse knowledge repository</p>
        </button>
      </div>
    </div>
  );
}
