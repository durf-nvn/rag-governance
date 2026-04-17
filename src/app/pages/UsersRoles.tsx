import { useState, useEffect } from "react";
import { Search, UserPlus, Edit, Lock, UserX, CheckCircle, Clock } from "lucide-react";
import axios from "axios";

export function UsersRoles() {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real users from FastAPI
  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8000/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle Faculty Approval
  const handleApprove = async (userId: string) => {
    try {
      await axios.put(`http://localhost:8000/users/${userId}/verify`);
      fetchUsers(); // Refresh the list instantly
    } catch (error) {
      alert("Failed to approve faculty account.");
    }
  };

  // Separate pending faculty from active users
  const pendingFaculty = users.filter(u => u.role === "FACULTY" && !u.is_verified);
  const activeUsers = users.filter(u => u.is_verified || u.role === "ADMIN");

  const roleStats = [
    {
      role: "Administrator",
      permissions: ["Full system access", "User management", "System configuration"],
      userCount: users.filter(u => u.role === "ADMIN").length,
      color: "#1D6FA3"
    },
    {
      role: "Faculty",
      permissions: ["Upload documents", "View governance reference", "Ask AI questions"],
      userCount: users.filter(u => u.role === "FACULTY").length,
      color: "#FDB913"
    },
    {
      role: "Student",
      permissions: ["View basic documents", "Ask AI questions", "Basic access"],
      userCount: users.filter(u => u.role === "STUDENT").length,
      color: "#006837"
    }
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading user database...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Users & Roles</h1>
          <p className="text-gray-600">Manage user accounts and role-based access control</p>
        </div>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] transition-colors shadow-md"
        >
          <UserPlus className="h-5 w-5" />
          Add User
        </button>
      </div>

      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roleStats.map((role) => (
          <div
            key={role.role}
            className="bg-white rounded-lg shadow-md p-6 border-t-4"
            style={{ borderColor: role.color }}
          >
            <h3 className="text-lg text-gray-900 mb-2">{role.role}</h3>
            <div className="text-3xl mb-4" style={{ color: role.color }}>
              {role.userCount}
            </div>
            <p className="text-sm text-gray-600">Registered users</p>
          </div>
        ))}
      </div>

      {/* PENDING FACULTY APPROVALS SECTION */}
      {pendingFaculty.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border-l-4 border-[#FDB913] overflow-hidden">
          <div className="bg-[#FDB913]/10 p-4 border-b border-gray-200 flex items-center gap-3">
            <Clock className="h-5 w-5 text-[#FDB913]" />
            <h2 className="text-lg font-semibold text-gray-900">Pending Faculty Approvals ({pendingFaculty.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F5F5]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">Registration Date</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingFaculty.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F5F5F5] transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{user.full_name || "N/A"}</td>
                    <td className="px-6 py-4 text-gray-700">{user.email}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#006837] text-white text-sm rounded hover:bg-[#004a27] transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Users Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl text-gray-900">Active Users</h2>
          <div className="flex gap-4 w-1/2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 bg-[#F5F5F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Role</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {activeUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#F5F5F5] transition-colors">
                  <td className="px-6 py-4 text-gray-900 font-medium">{user.full_name || "N/A"}</td>
                  <td className="px-6 py-4 text-gray-700">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-sm rounded ${
                      user.role === 'ADMIN' ? 'bg-[#1D6FA3]/10 text-[#1D6FA3]' :
                      user.role === 'FACULTY' ? 'bg-[#FDB913]/20 text-[#D4AF37]' :
                      'bg-[#006837]/10 text-[#006837]'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-sm bg-[#006837]/20 text-[#006837]">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-600 hover:text-[#1D6FA3] hover:bg-blue-50 rounded transition-colors" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Deactivate">
                        <UserX className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}