import { useState } from "react";
import { Search, UserPlus, Edit, Lock, UserX } from "lucide-react";

export function UsersRoles() {
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const users = [
    {
      id: 1,
      name: "Dr. Maria Santos",
      email: "maria.santos@ctu.edu.ph",
      role: "Faculty",
      office: "Academic Affairs",
      status: "Active",
      lastLogin: "March 7, 2026 - 10:30 AM"
    },
    {
      id: 2,
      name: "Juan Cruz",
      email: "juan.cruz@ctu.edu.ph",
      role: "QA Officer",
      office: "Quality Assurance",
      status: "Active",
      lastLogin: "March 7, 2026 - 09:15 AM"
    },
    {
      id: 3,
      name: "Admin User",
      email: "admin@ctu.edu.ph",
      role: "Administrator",
      office: "Administration",
      status: "Active",
      lastLogin: "March 7, 2026 - 08:00 AM"
    },
    {
      id: 4,
      name: "Faculty User",
      email: "faculty@ctu.edu.ph",
      role: "Faculty",
      office: "Engineering",
      status: "Active",
      lastLogin: "March 6, 2026 - 04:30 PM"
    },
    {
      id: 5,
      name: "Staff User",
      email: "staff@ctu.edu.ph",
      role: "Staff",
      office: "Student Affairs",
      status: "Inactive",
      lastLogin: "February 28, 2026"
    },
  ];

  const rolePermissions = [
    {
      role: "Administrator",
      permissions: [
        "Full system access",
        "User management",
        "Document upload/edit/delete",
        "Access all audit logs",
        "System configuration"
      ],
      userCount: 3,
      color: "#CE0000"
    },
    {
      role: "QA Officer",
      permissions: [
        "View all documents",
        "Upload documents",
        "Access accreditation tools",
        "Generate reports",
        "View audit logs"
      ],
      userCount: 5,
      color: "#FDB913"
    },
    {
      role: "Faculty",
      permissions: [
        "View documents",
        "Ask AI questions",
        "Download documents",
        "View governance reference",
        "Limited access"
      ],
      userCount: 45,
      color: "#006837"
    },
    {
      role: "Staff",
      permissions: [
        "View basic documents",
        "Ask AI questions",
        "View governance reference",
        "Limited download access",
        "Basic access"
      ],
      userCount: 12,
      color: "#D4AF37"
    },
  ];

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
          className="flex items-center gap-2 px-6 py-3 bg-[#FDB913] text-gray-900 rounded-lg hover:bg-[#e5a610] transition-colors shadow-md"
        >
          <UserPlus className="h-5 w-5" />
          Add User
        </button>
      </div>

      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {rolePermissions.map((role) => (
          <div
            key={role.role}
            className="bg-white rounded-lg shadow-md p-6 border-t-4"
            style={{ borderColor: role.color }}
          >
            <h3 className="text-lg text-gray-900 mb-2">{role.role}</h3>
            <div className="text-3xl mb-4" style={{ color: role.color }}>
              {role.userCount}
            </div>
            <p className="text-sm text-gray-600">Users with this role</p>
          </div>
        ))}
      </div>

      {/* Role Permissions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl mb-6 text-[#CE0000]">Role Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rolePermissions.map((role) => (
            <div
              key={role.role}
              className="border-2 rounded-lg p-5"
              style={{ borderColor: `${role.color}40` }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg text-gray-900">{role.role}</h3>
                <span className="px-3 py-1 rounded-full text-sm" style={{ 
                  backgroundColor: `${role.color}20`,
                  color: role.color
                }}>
                  {role.userCount} users
                </span>
              </div>
              <ul className="space-y-2">
                {role.permissions.map((permission, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: role.color }}></div>
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                className="w-full pl-10 pr-4 py-3 bg-[#F5F5F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913]"
              />
            </div>
            <select className="px-4 py-3 bg-[#F5F5F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913]">
              <option value="all">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="qa">QA Officer</option>
              <option value="faculty">Faculty</option>
              <option value="staff">Staff</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Role</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Office</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Last Login</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#F5F5F5] transition-colors">
                  <td className="px-6 py-4 text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-gray-700">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-[#D4AF37]/20 text-[#D4AF37] text-sm rounded">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{user.office}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        user.status === "Active"
                          ? "bg-[#006837]/20 text-[#006837]"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{user.lastLogin}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 text-gray-600 hover:text-[#FDB913] hover:bg-[#FDB913]/10 rounded transition-colors"
                        title="Edit Role"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-gray-600 hover:text-[#006837] hover:bg-[#006837]/10 rounded transition-colors"
                        title="Reset Password"
                      >
                        <Lock className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-gray-600 hover:text-[#CE0000] hover:bg-[#CE0000]/10 rounded transition-colors"
                        title="Deactivate"
                      >
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

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl mb-6 text-gray-900">Add New User</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-[#F5F5F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913]"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-[#F5F5F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913]"
                    placeholder="email@ctu.edu.ph"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Role</label>
                  <select className="w-full px-4 py-3 bg-[#F5F5F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913]">
                    <option>Administrator</option>
                    <option>QA Officer</option>
                    <option>Faculty</option>
                    <option>Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">Office</label>
                  <select className="w-full px-4 py-3 bg-[#F5F5F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913]">
                    <option>Academic Affairs</option>
                    <option>Student Affairs</option>
                    <option>Research Office</option>
                    <option>Quality Assurance</option>
                    <option>Administration</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Initial Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 bg-[#F5F5F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913]"
                  placeholder="Enter temporary password"
                />
                <p className="text-sm text-gray-500 mt-1">User will be required to change password on first login</p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowAddUserModal(false);
                    alert("User added successfully!");
                  }}
                  className="px-6 py-2 bg-[#CE0000] text-white rounded-lg hover:bg-[#b50000] transition-colors"
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
