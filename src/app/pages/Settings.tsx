import { useState } from "react";
import { Save, Plus, Trash2, Settings as SettingsIcon } from "lucide-react";

type TabType = "categories" | "metadata" | "permissions" | "system";

export function Settings() {
  const [activeTab, setActiveTab] = useState<TabType>("categories");

  const categories = [
    { id: 1, name: "Policy", count: 145, color: "#CE0000" },
    { id: 2, name: "Procedure", count: 98, color: "#FDB913" },
    { id: 3, name: "Guideline", count: 123, color: "#006837" },
    { id: 4, name: "Memorandum", count: 121, color: "#D4AF37" },
  ];

  const metadataTags = [
    "Academic Affairs",
    "Student Affairs",
    "Research",
    "Quality Assurance",
    "Human Resources",
    "Finance",
    "Administration",
    "Accreditation",
    "CHED",
    "Governance"
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Configure system settings, categories, and permissions</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("categories")}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "categories"
                  ? "border-b-2 border-[#CE0000] text-[#CE0000]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Manage Categories
            </button>
            <button
              onClick={() => setActiveTab("metadata")}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "metadata"
                  ? "border-b-2 border-[#CE0000] text-[#CE0000]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Metadata Tags
            </button>
            <button
              onClick={() => setActiveTab("permissions")}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "permissions"
                  ? "border-b-2 border-[#CE0000] text-[#CE0000]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              User Permissions
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "system"
                  ? "border-b-2 border-[#CE0000] text-[#CE0000]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              System Settings
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Categories Tab */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl text-gray-900">Document Categories</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#FDB913] text-gray-900 rounded-lg hover:bg-[#e5a610] transition-colors">
                  <Plus className="h-4 w-4" />
                  Add Category
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between border-2 rounded-lg p-4"
                    style={{ borderColor: `${category.color}40` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <div>
                        <h3 className="text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-600">{category.count} documents</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-600 hover:text-[#006837] hover:bg-[#006837]/10 rounded transition-colors">
                        <SettingsIcon className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-[#CE0000] hover:bg-[#CE0000]/10 rounded transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Tags Tab */}
          {activeTab === "metadata" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl text-gray-900">Metadata Tags</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#FDB913] text-gray-900 rounded-lg hover:bg-[#e5a610] transition-colors">
                  <Plus className="h-4 w-4" />
                  Add Tag
                </button>
              </div>

              <div className="bg-[#F5F5F5] rounded-lg p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Metadata tags help organize and categorize documents for easier search and retrieval.
                </p>
                <div className="flex flex-wrap gap-2">
                  {metadataTags.map((tag, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg"
                    >
                      <span className="text-gray-900">{tag}</span>
                      <button className="text-gray-500 hover:text-[#CE0000] transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Add New Tag</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-4 py-3 bg-[#F5F5F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913]"
                    placeholder="Enter tag name"
                  />
                  <button className="px-6 py-3 bg-[#CE0000] text-white rounded-lg hover:bg-[#b50000] transition-colors">
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Permissions Tab */}
          {activeTab === "permissions" && (
            <div className="space-y-6">
              <h2 className="text-xl text-gray-900">Default Role Permissions</h2>

              <div className="space-y-4">
                {/* Administrator Permissions */}
                <div className="border-2 border-[#CE0000]/30 rounded-lg p-6">
                  <h3 className="text-lg text-gray-900 mb-4">Administrator</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "View all documents",
                      "Upload documents",
                      "Edit documents",
                      "Delete documents",
                      "Manage users",
                      "Access audit logs",
                      "System configuration",
                      "Export data"
                    ].map((permission, index) => (
                      <label key={index} className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                        <span className="text-gray-700">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* QA Officer Permissions */}
                <div className="border-2 border-[#FDB913]/30 rounded-lg p-6">
                  <h3 className="text-lg text-gray-900 mb-4">QA Officer</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "View all documents",
                      "Upload documents",
                      "Edit documents",
                      "Access accreditation tools",
                      "Generate reports",
                      "View audit logs"
                    ].map((permission, index) => (
                      <label key={index} className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                        <span className="text-gray-700">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Faculty Permissions */}
                <div className="border-2 border-[#006837]/30 rounded-lg p-6">
                  <h3 className="text-lg text-gray-900 mb-4">Faculty</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "View documents",
                      "Download documents",
                      "Ask AI questions",
                      "View governance reference"
                    ].map((permission, index) => (
                      <label key={index} className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                        <span className="text-gray-700">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="flex items-center gap-2 px-6 py-3 bg-[#CE0000] text-white rounded-lg hover:bg-[#b50000] transition-colors">
                  <Save className="h-5 w-5" />
                  Save Permissions
                </button>
              </div>
            </div>
          )}

          {/* System Settings Tab */}
          {activeTab === "system" && (
            <div className="space-y-6">
              <h2 className="text-xl text-gray-900">System Configuration</h2>

              <div className="space-y-6">
                {/* General Settings */}
                <div className="border-2 border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg text-gray-900 mb-4">General Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2 text-gray-700">System Name</label>
                      <input
                        type="text"
                        defaultValue="CTU Institutional Knowledge System"
                        className="w-full px-4 py-3 bg-[#F5F5F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2 text-gray-700">Institution Name</label>
                      <input
                        type="text"
                        defaultValue="Cebu Technological University – Argao Campus"
                        className="w-full px-4 py-3 bg-[#F5F5F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2 text-gray-700">Contact Email</label>
                      <input
                        type="email"
                        defaultValue="argao@ctu.edu.ph"
                        className="w-full px-4 py-3 bg-[#F5F5F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913]"
                      />
                    </div>
                  </div>
                </div>

                {/* AI Settings */}
                <div className="border-2 border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg text-gray-900 mb-4">AI Assistant Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                        <span className="text-gray-700">Enable AI Policy Assistant</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm mb-2 text-gray-700">Minimum Confidence Score (%)</label>
                      <input
                        type="number"
                        defaultValue="85"
                        min="0"
                        max="100"
                        className="w-full px-4 py-3 bg-[#F5F5F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913]"
                      />
                      <p className="text-sm text-gray-500 mt-1">AI will only show answers with confidence above this threshold</p>
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                        <span className="text-gray-700">Show source citations</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="border-2 border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg text-gray-900 mb-4">Security Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                        <span className="text-gray-700">Enable audit logging</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                        <span className="text-gray-700">Require password change on first login</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm mb-2 text-gray-700">Session Timeout (minutes)</label>
                      <input
                        type="number"
                        defaultValue="30"
                        min="5"
                        max="120"
                        className="w-full px-4 py-3 bg-[#F5F5F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="flex items-center gap-2 px-6 py-3 bg-[#CE0000] text-white rounded-lg hover:bg-[#b50000] transition-colors">
                  <Save className="h-5 w-5" />
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
