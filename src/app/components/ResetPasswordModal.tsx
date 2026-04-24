import React, { useState } from "react";
import { X, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import axios from "axios";

interface ResetPasswordModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
}

export default function ResetPasswordModal({ isOpen, email, onClose }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', msg: "Passwords do not match." });
      return;
    }

    if (newPassword.length < 6) {
      setStatus({ type: 'error', msg: "Password must be at least 6 characters." });
      return;
    }

    setIsLoading(true);
    setStatus(null);

    try {
      const response = await axios.post("http://localhost:8000/update-password", {
        email: email,
        new_password: newPassword
      });
      
      setStatus({ type: 'success', msg: response.data.message });
      
      // Close modal after 2 seconds on success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error: any) {
      setStatus({ 
        type: 'error', 
        msg: error.response?.data?.detail || "Failed to update password." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E7EB] w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB] bg-[#F5F7FA]">
          <div>
            <h3 className="text-lg font-semibold text-[#1F2937]">Set New Password</h3>
            <p className="text-xs text-[#6B7280]">{email}</p>
          </div>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#1F2937]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {status && (
            <div className={`p-4 rounded-md flex items-start gap-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {status.type === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
              <p className="text-sm font-medium">{status.msg}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-[#1F2937]">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6B7280]" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]"
                placeholder="Enter new password"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[#1F2937]">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6B7280]" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D6FA3]"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || (status?.type === 'success')}
            className="w-full py-3 bg-[#1D6FA3] text-white rounded-lg hover:bg-[#0B3C5D] font-medium disabled:opacity-70 flex justify-center items-center transition-colors"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}