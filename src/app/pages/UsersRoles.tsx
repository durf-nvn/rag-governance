import { useState, useEffect } from "react";
import { Search, UserPlus, Ban, UserX, CheckCircle, Clock, XCircle, AlertCircle, X, ShieldAlert } from "lucide-react";
import axios from "axios";

export function UsersRoles() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // --- TOAST NOTIFICATIONS ---
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- MODAL STATES ---
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [addUserData, setAddUserData] = useState({ name: "", email: "", role: "", password: "" });

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [userToReject, setUserToReject] = useState<any>(null);

  const [showDisableModal, setShowDisableModal] = useState(false);
  const [userToDisable, setUserToDisable] = useState<any>(null);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8000/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      showToast("Failed to load users from database.", "error");
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
      showToast("Faculty account approved successfully!", "success");
    } catch (error) {
      showToast("Failed to approve faculty account.", "error");
    }
  };

  // Hard Delete for Pending (Never approved)
  const executeReject = async () => {
    if (!userToReject) return;
    try {
      await axios.delete(`http://localhost:8000/users/${userToReject.id}`);
      fetchUsers();
      setShowRejectModal(false);
      setUserToReject(null);
      showToast("Pending request rejected and removed.", "success");
    } catch (error) {
      showToast("Failed to reject faculty account.", "error");
    }
  };

  // Soft Delete for Active Users
  const executeDisable = async () => {
    if (!userToDisable) return;
    try {
      await axios.put(`http://localhost:8000/users/${userToDisable.id}/disable`);
      fetchUsers();
      setShowDisableModal(false);
      setUserToDisable(null);
      showToast("User account has been disabled.", "success");
    } catch (error) {
      showToast("Failed to disable user account.", "error");
    }
  };

  const handleAddUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddUserData({ ...addUserData, [e.target.name]: e.target.value });
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUserData.name || !addUserData.email || !addUserData.role || !addUserData.password) {
      showToast("Please fill out all fields.", "error");
      return;
    }
    setIsCreating(true);
    try {
      await axios.post("http://localhost:8000/users", {
        full_name: addUserData.name,
        email: addUserData.email,
        role: addUserData.role,
        password: addUserData.password
      });

      showToast(`${addUserData.role} ${addUserData.name} created successfully!`, "success");
      setShowAddUserModal(false);
      setAddUserData({ name: "", email: "", role: "", password: "" });
      fetchUsers();
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Failed to create user.", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const pendingFaculty = users.filter(u => u.role === "FACULTY" && !u.is_verified);
  const registeredUsers = users.filter(u => u.is_verified || u.role === "ADMIN");

  // Multi-parameter filtering!
  const filteredUsers = registeredUsers.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const matchesName = user.full_name?.toLowerCase().includes(searchLower) || false;
    const matchesEmail = user.email?.toLowerCase().includes(searchLower) || false;
    const matchesSearch = matchesName || matchesEmail;
    
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    
    const userStatus = user.status || "Active";
    const matchesStatus = selectedStatus === "all" || userStatus === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleStats = [
    { role: "Administrator", userCount: users.filter(u => u.role === "ADMIN").length, color: "#1D6FA3" },
    { role: "Faculty", userCount: users.filter(u => u.role === "FACULTY").length, color: "#FDB913" },
    { role: "Student", userCount: users.filter(u => u.role === "STUDENT").length, color: "#006837" }
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading user database...</div>;
  }

  return (
    <div className="space-y-6 relative">
      
      {/* --- TOAST NOTIFICATION --- */}
      {toast && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-bold z-[100] transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${
          toast.type === 'success' ? 'bg-[#E6F7ED] text-[#006837] border-2 border-[#006837]/20' : 'bg-red-50 text-red-700 border-2 border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Users & Roles</h1>
          <p className="text-gray-600">Manage user accounts, roles, and access status</p>
        </div>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] transition-colors shadow-sm"
        >
          <UserPlus className="h-5 w-5" />
          Add User
        </button>
      </div>

      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roleStats.map((role) => (
          <div key={role.role} className="bg-white rounded-xl shadow-sm p-6 border-t-4" style={{ borderColor: role.color }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{role.role}</h3>
            <div className="text-4xl font-bold mb-2" style={{ color: role.color }}>{role.userCount}</div>
            <p className="text-sm text-gray-500 font-medium">Registered accounts</p>
          </div>
        ))}
      </div>

      {/* Pending Faculty */}
      {pendingFaculty.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-[#FDB913] overflow-hidden">
          <div className="bg-[#FDB913]/10 p-5 border-b border-gray-100 flex items-center gap-3">
            <Clock className="h-6 w-6 text-[#FDB913]" />
            <h2 className="text-lg font-bold text-gray-900">Pending Faculty Approvals ({pendingFaculty.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F9FAFB] border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Registration Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingFaculty.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{user.full_name || "N/A"}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{user.email}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleApprove(user.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 font-semibold text-xs rounded border border-green-200 hover:bg-green-100 transition-colors">
                          <CheckCircle className="h-4 w-4" /> Approve
                        </button>
                        <button onClick={() => { setUserToReject(user); setShowRejectModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 font-semibold text-xs rounded hover:bg-red-100 transition-colors">
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

      {/* Main Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-[#F9FAFB]">
          <h2 className="text-xl font-bold text-gray-900 mb-4">User Directory</h2>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]" 
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <select 
                value={selectedRole} 
                onChange={(e) => setSelectedRole(e.target.value)} 
                className="sm:w-40 px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="FACULTY">Faculty</option>
                <option value="STUDENT">Student</option>
              </select>

              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)} 
                className="sm:w-40 px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F5F7FA] border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">No users found matching your filters.</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 font-bold">{user.full_name || "N/A"}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                        user.role === 'ADMIN' ? 'bg-blue-50 text-[#1D6FA3] border-blue-200' : 
                        user.role === 'FACULTY' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                        'bg-green-50 text-[#006837] border-green-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        (user.status || 'Active') === 'Active' 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'bg-gray-100 border-gray-200 text-gray-500'
                      }`}>
                        {user.status || "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(user.status || 'Active') === 'Active' && user.role !== 'ADMIN' && (
                        <button 
                          onClick={() => { setUserToDisable(user); setShowDisableModal(true); }} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" 
                          title="Disable Account"
                        >
                          <Ban className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD USER MODAL --- */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F5F7FA]">
              <h2 className="text-xl font-bold text-[#1F2937]">Create User Account</h2>
              <button onClick={() => setShowAddUserModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                <input type="text" name="name" value={addUserData.name} onChange={handleAddUserChange} className="w-full px-4 py-3 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]" placeholder="e.g., Jane Doe" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                <input type="email" name="email" value={addUserData.email} onChange={handleAddUserChange} className="w-full px-4 py-3 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]" placeholder="jane.doe@ctu.edu.ph" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">System Role</label>
                <select name="role" value={addUserData.role} onChange={handleAddUserChange} className="w-full px-4 py-3 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] cursor-pointer">
                  <option value="" disabled>Select User Role</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="STUDENT">Student</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Temporary Password</label>
                <input type="password" name="password" value={addUserData.password} onChange={handleAddUserChange} className="w-full px-4 py-3 bg-[#F5F7FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]" placeholder="Enter secure password" />
              </div>
            
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddUserModal(false)} className="flex-1 px-5 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating} className="flex-1 px-5 py-3 text-sm font-bold bg-[#1D6FA3] text-white rounded-xl hover:bg-[#0B3C5D] transition-colors disabled:opacity-50">
                   {isCreating ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DISABLE ACTIVE ACCOUNT MODAL --- */}
      {showDisableModal && userToDisable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-red-100 bg-red-50 flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-bold text-red-700">Disable Account</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                You are about to disable the account for <span className="font-bold text-gray-900">{userToDisable.full_name} ({userToDisable.email})</span>.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                They will immediately lose access to log into the system. However, any documents or evidence they previously uploaded will remain intact for audit purposes.
              </p>
            </div>

            <div className="p-6 border-t border-gray-100 bg-[#F9FAFB] flex justify-end gap-3">
              <button onClick={() => setShowDisableModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={executeDisable} className="px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-red-600 hover:bg-red-700 transition-colors">
                Yes, Disable Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- REJECT PENDING ACCOUNT MODAL --- */}
      {showRejectModal && userToReject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-red-100 bg-red-50 flex items-center gap-3">
              <UserX className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-bold text-red-700">Reject Registration</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Are you sure you want to reject the faculty registration for <span className="font-bold text-gray-900">{userToReject.email}</span>?
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Since this account was never approved, this action will permanently delete their request from the system.
              </p>
            </div>

            <div className="p-6 border-t border-gray-100 bg-[#F9FAFB] flex justify-end gap-3">
              <button onClick={() => setShowRejectModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={executeReject} className="px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-red-600 hover:bg-red-700 transition-colors">
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}