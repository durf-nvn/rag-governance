import { useState, useEffect } from "react";
import { Search, UserPlus, Edit, Lock, UserX, CheckCircle, Clock, XCircle, FileText, Upload } from "lucide-react";
import axios from "axios";

export function UsersRoles() {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // NEW: State for Add User Form Data
  const [addUserData, setAddUserData] = useState({
    name: "",
    email: "",
    role: "", // No default selection for validation and consistency
    password: ""
  });

  const [isCreating, setIsCreating] = useState(false); // Track creation state

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

  const handleApprove = async (userId: string) => {
    try {
      await axios.put(`http://localhost:8000/users/${userId}/verify`);
      fetchUsers();
    } catch (error) {
      alert("Failed to approve faculty account.");
    }
  };

  const handleReject = async (userId: string) => {
    if (window.confirm("Are you sure you want to reject this request? This will delete their pending account.")) {
      try {
        await axios.delete(`http://localhost:8000/users/${userId}`);
        fetchUsers();
      } catch (error) {
        alert("Failed to reject faculty account.");
      }
    }
  };

  // NEW: Add User Modal Input Change Handler
  const handleAddUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddUserData({ ...addUserData, [e.target.name]: e.target.value });
  };

  // NEW: Add User Form Submission Handler (simulated success here, connect to actual backend endpoint later!)
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent standard form submission

    if (!addUserData.name || !addUserData.email || !addUserData.role || !addUserData.password) {
      alert("Please fill out all fields.");
      return;
    }

    setIsCreating(true); // Track creation state
    try {
      // Connect to your actual backend user creation endpoint with axois call
      const response = await axios.post("http://localhost:8000/users", {
        full_name: addUserData.name,
        email: addUserData.email,
        role: addUserData.role,
        password: addUserData.password
      });

      // Simulation/Placeholder success handling for now - actual backend would re-fetch or confirm
      alert(`${addUserData.role.capitalize()} ${addUserData.name} created successfully! (Simulation - backend logic pending)`);
      setShowAddUserModal(false); // Close modal on success
      setAddUserData({ name: "", email: "", role: "", password: "" }); // Reset form state
      
      // OPTIONAL: Immediately re-fetch users if your simulate success would actually affect the displayed users in a real implementation
      // const res = await axios.get("http://localhost:8000/users");
      // setUsers(res.data);

    } catch (error) {
      console.error("Failed to create user:", error);
      alert("An error occurred during user creation. Please try again.");
    } finally {
      setIsCreating(false); // Reset creation state
    }
  };

  const pendingFaculty = users.filter(u => u.role === "FACULTY" && !u.is_verified);
  const activeUsers = users.filter(u => u.is_verified || u.role === "ADMIN");

  const filteredActiveUsers = activeUsers.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const matchesName = user.full_name?.toLowerCase().includes(searchLower) || false;
    const matchesEmail = user.email?.toLowerCase().includes(searchLower) || false;
    return matchesName || matchesEmail;
  });

  const roleStats = [
    { role: "Administrator", permissions: ["Full system access", "User management", "System configuration"], userCount: users.filter(u => u.role === "ADMIN").length, color: "#1D6FA3" },
    { role: "Faculty", permissions: ["Upload documents", "View governance reference", "Ask AI questions"], userCount: users.filter(u => u.role === "FACULTY").length, color: "#FDB913" },
    { role: "Student", permissions: ["View basic documents", "Ask AI questions", "Basic access"], userCount: users.filter(u => u.role === "STUDENT").length, color: "#006837" }
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading user database...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header (unchanged) ... */}
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

      {/* Role Overview Cards (unchanged) ... */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roleStats.map((role) => (
          <div key={role.role} className="bg-white rounded-lg shadow-md p-6 border-t-4" style={{ borderColor: role.color }}>
            <h3 className="text-lg text-gray-900 mb-2">{role.role}</h3>
            <div className="text-3xl mb-4" style={{ color: role.color }}>{role.userCount}</div>
            <p className="text-sm text-gray-600">Registered users</p>
          </div>
        ))}
      </div>

      {/* PENDING FACULTY APPROVALS SECTION (unchanged) ... */}
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
                    <td className="px-6 py-4 text-gray-600 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleApprove(user.id)} className="flex items-center gap-1 px-3 py-1.5 bg-[#006837] text-white text-sm rounded hover:bg-[#004a27] transition-colors">
                          <CheckCircle className="h-4 w-4" /> Approve
                        </button>
                        <button onClick={() => handleReject(user.id)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 text-red-600 text-sm rounded hover:bg-red-50 transition-colors">
                          <XCircle className="h-4 w-4" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Users Table (unchanged) ... */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl text-gray-900">Active Users</h2>
          <div className="flex gap-4 w-1/2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-[#F5F5F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]" />
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
              {filteredActiveUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No active users found matching your search.</td></tr>
              ) : (
                filteredActiveUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F5F5F5] transition-colors">
                    <td className="px-6 py-4 text-gray-900 font-medium">{user.full_name || "N/A"}</td>
                    <td className="px-6 py-4 text-gray-700">{user.email}</td>
                    <td className="px-6 py-4"><span className={`px-3 py-1 text-sm font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700 border border-blue-200' : user.role === 'FACULTY' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>{user.role}</span></td>
                    <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-50 border border-green-200 text-green-700">Active</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        
                        <button onClick={() => handleReject(user.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Remove User"><UserX className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW: ADD USER MODAL INTEGRATION (Limited Roles, pending functional connection) */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-[#E5E7EB]">
              <h2 className="text-xl font-semibold text-[#1F2937]">Add New User</h2>
            </div>
            
            {/* Modal Content - Form fields vertically stacked, mimicking form layout strategically but within 3 roles constraint */}
            <form onSubmit={handleAddUserSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={addUserData.name}
                  onChange={handleAddUserChange}
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]"
                  placeholder="Enter user's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={addUserData.email}
                  onChange={handleAddUserChange}
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]"
                  placeholder="Enter user's email address"
                />
              </div>

              {/* STRICTLY LIMITED ROLES - mimics strategic form layout structure but functional dropdown for actual roles */}
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-2">Role</label>
                <select name="role" value={addUserData.role} onChange={handleAddUserChange} className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]">
                  <option value="" disabled>Select User Role</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="STUDENT">Student</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={addUserData.password}
                  onChange={handleAddUserChange}
                  className="w-full px-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]"
                  placeholder="Enter secure password"
                />
              </div>

              {/* ... Other fields from reference could be added if needed, sticking to core fields and strictly limited roles description ... */}
            
              {/* Modal Actions (buttons vertically stacked below form conceptually, no vertical splits description) */}
              <div className="p-6 border-t border-[#E5E7EB] bg-[#F9FAFB] flex justify-end gap-3 rounded-b-xl mt-6">
                <button
                  type="button" // Important for cancel/modal closing within form
                  onClick={() => {
                    setShowAddUserModal(false);
                    setAddUserData({ name: "", email: "", role: "", password: "" }); // Reset state on cancel
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" // Trigger form submission
                  disabled={!addUserData.name || !addUserData.email || !addUserData.role || !addUserData.password || isCreating}
                  className="px-5 py-2.5 text-sm font-semibold bg-[#1D6FA3] text-white rounded-lg disabled:opacity-50 hover:bg-[#0B3C5D] transition-colors flex items-center gap-2"
                >
                   {isCreating ? "Creating..." : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}