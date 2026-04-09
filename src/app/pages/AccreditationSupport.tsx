import { useState } from "react";
import { Search, CheckCircle, AlertCircle, FileText, Download, Award, ClipboardCheck, TrendingUp, Calendar, Target, BookOpen } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";

export function AccreditationSupport() {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  // AACCUP Areas
  const accreditationAreas = [
    {
      id: "1",
      code: "Area I",
      title: "Vision, Mission, Goals and Outcomes",
      compliance: 92,
      status: "compliant",
      evidenceCount: 15,
      gaps: 2
    },
    {
      id: "2",
      code: "Area II",
      title: "Faculty",
      compliance: 88,
      status: "compliant",
      evidenceCount: 23,
      gaps: 3
    },
    {
      id: "3",
      code: "Area III",
      title: "Curriculum and Instruction",
      compliance: 85,
      status: "needs-improvement",
      evidenceCount: 31,
      gaps: 5
    },
    {
      id: "4",
      code: "Area IV",
      title: "Support for Student Development",
      compliance: 95,
      status: "compliant",
      evidenceCount: 18,
      gaps: 1
    },
    {
      id: "5",
      code: "Area V",
      title: "Research",
      compliance: 78,
      status: "needs-improvement",
      evidenceCount: 12,
      gaps: 7
    },
    {
      id: "6",
      code: "Area VI",
      title: "Extension and Community Involvement",
      compliance: 82,
      status: "needs-improvement",
      evidenceCount: 14,
      gaps: 6
    },
    {
      id: "7",
      code: "Area VII",
      title: "Library",
      compliance: 90,
      status: "compliant",
      evidenceCount: 16,
      gaps: 3
    },
    {
      id: "8",
      code: "Area VIII",
      title: "Physical Plant and Facilities",
      compliance: 86,
      status: "compliant",
      evidenceCount: 20,
      gaps: 4
    },
    {
      id: "9",
      code: "Area IX",
      title: "Laboratories",
      compliance: 80,
      status: "needs-improvement",
      evidenceCount: 17,
      gaps: 6
    },
    {
      id: "10",
      code: "Area X",
      title: "Administration",
      compliance: 93,
      status: "compliant",
      evidenceCount: 25,
      gaps: 2
    },
  ];

  const complianceChecklist = [
    { item: "Program Educational Objectives (PEOs) documented", status: "complete" },
    { item: "Student Outcomes (SOs) aligned with PEOs", status: "complete" },
    { item: "Assessment tools and rubrics available", status: "complete" },
    { item: "Faculty qualifications meet minimum standards", status: "incomplete" },
    { item: "Regular curriculum review process documented", status: "incomplete" },
  ];

  const recentEvidence = [
    { name: "Faculty Credentials Summary 2025-2026", date: "March 5, 2026", area: "Area II" },
    { name: "Student Learning Outcomes Assessment Report", date: "March 3, 2026", area: "Area III" },
    { name: "Research Output Summary 2025", date: "March 1, 2026", area: "Area V" },
  ];

  // ISO Standards Data
  const isoStandards = [
    {
      id: "iso9001",
      name: "ISO 9001:2015",
      title: "Quality Management Systems",
      compliance: 85,
      status: "compliant",
      clauses: 10,
      auditDate: "January 15, 2026",
      certificationStatus: "Certified"
    },
    {
      id: "iso21001",
      name: "ISO 21001:2018",
      title: "Educational Organizations Management Systems",
      compliance: 78,
      status: "needs-improvement",
      clauses: 10,
      auditDate: "February 20, 2026",
      certificationStatus: "In Progress"
    }
  ];

  // CHED Monitoring Data
  const chedRequirements = [
    {
      id: "ched1",
      category: "CMO No. 46, s. 2012",
      title: "Policy-Standard to Enhance Quality Assurance (QA)",
      compliance: 90,
      status: "compliant",
      lastReview: "March 10, 2026",
      documents: 12
    },
    {
      id: "ched2",
      category: "CMO No. 52, s. 2007",
      title: "Institutional Quality Assurance Monitoring",
      compliance: 88,
      status: "compliant",
      lastReview: "February 28, 2026",
      documents: 15
    },
    {
      id: "ched3",
      category: "CMO No. 04, s. 2020",
      title: "Guidelines on Flexible Learning",
      compliance: 82,
      status: "needs-improvement",
      lastReview: "March 5, 2026",
      documents: 8
    }
  ];

  // Accreditation Results Data
  const accreditationHistory = [
    {
      id: "1",
      program: "Bachelor of Science in Computer Science",
      accreditor: "AACCUP",
      level: "Level III",
      date: "June 2024",
      validUntil: "June 2027",
      status: "Accredited"
    },
    {
      id: "2",
      program: "Bachelor of Science in Information Technology",
      accreditor: "AACCUP",
      level: "Level II",
      date: "August 2024",
      validUntil: "August 2027",
      status: "Accredited"
    },
    {
      id: "3",
      program: "Bachelor of Science in Business Administration",
      accreditor: "AACCUP",
      level: "Level II",
      date: "November 2023",
      validUntil: "November 2026",
      status: "Accredited"
    }
  ];

  const upcomingAccreditations = [
    {
      id: "1",
      program: "Bachelor of Science in Civil Engineering",
      accreditor: "AACCUP",
      scheduledDate: "July 2026",
      targetLevel: "Level III",
      preparedness: 75
    },
    {
      id: "2",
      program: "Bachelor of Science in Computer Science",
      accreditor: "AACCUP",
      scheduledDate: "June 2027",
      targetLevel: "Level IV (Re-accreditation)",
      preparedness: 60
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl text-gray-900 mb-2">QA & Accreditation Support</h1>
        <p className="text-gray-600">Comprehensive quality assurance tracking across AACCUP, ISO, CHED monitoring, and accreditation results</p>
      </div>

      {/* Tabs for different accreditation types */}
      <Tabs defaultValue="aaccup" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1">
          <TabsTrigger value="aaccup" className="data-[state=active]:bg-[#CE0000] data-[state=active]:text-white">
            AACCUP
          </TabsTrigger>
          <TabsTrigger value="iso" className="data-[state=active]:bg-[#CE0000] data-[state=active]:text-white">
            ISO Standards
          </TabsTrigger>
          <TabsTrigger value="ched" className="data-[state=active]:bg-[#CE0000] data-[state=active]:text-white">
            CHED Monitoring
          </TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:bg-[#CE0000] data-[state=active]:text-white">
            Accreditation Results
          </TabsTrigger>
        </TabsList>

        {/* AACCUP Tab Content */}
        <TabsContent value="aaccup" className="space-y-6 mt-6">
          {/* Overall Compliance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#006837]">
              <h3 className="text-3xl text-[#006837] mb-2">87%</h3>
              <p className="text-gray-700">Overall Compliance</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#CE0000]">
              <h3 className="text-3xl text-[#CE0000] mb-2">39</h3>
              <p className="text-gray-700">Total Gaps Identified</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#FDB913]">
              <h3 className="text-3xl text-[#FDB913] mb-2">191</h3>
              <p className="text-gray-700">Evidence Documents</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#D4AF37]">
              <h3 className="text-3xl text-[#D4AF37] mb-2">10</h3>
              <p className="text-gray-700">Accreditation Areas</p>
            </div>
          </div>

          {/* Evidence Locator */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl mb-4 text-[#CE0000]">Evidence Locator</h2>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for evidence by area, parameter, or keyword..."
                  className="w-full pl-10 pr-4 py-3 bg-[#F5F5F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913]"
                />
              </div>
              <button className="px-6 py-3 bg-[#FDB913] text-gray-900 rounded-lg hover:bg-[#e5a610] transition-colors">
                Search
              </button>
            </div>
          </div>

          {/* Accreditation Areas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl mb-4 text-[#CE0000]">AACCUP Accreditation Areas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accreditationAreas.map((area) => (
                <div
                  key={area.id}
                  className="border-2 border-[#D4AF37]/30 rounded-lg p-4 hover:border-[#D4AF37] transition-colors cursor-pointer"
                  onClick={() => setSelectedArea(area.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg text-gray-900 mb-1">
                        {area.code}: {area.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {area.status === "compliant" ? (
                          <CheckCircle className="h-4 w-4 text-[#006837]" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-[#FDB913]" />
                        )}
                        <span
                          className={`text-sm ${
                            area.status === "compliant" ? "text-[#006837]" : "text-[#FDB913]"
                          }`}
                        >
                          {area.status === "compliant" ? "Compliant" : "Needs Improvement"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl text-[#CE0000]">{area.compliance}%</div>
                      <div className="text-xs text-gray-500">Compliance</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full ${
                        area.compliance >= 85 ? "bg-[#006837]" : "bg-[#FDB913]"
                      }`}
                      style={{ width: `${area.compliance}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{area.evidenceCount} Evidence Documents</span>
                    <span className="text-[#CE0000]">{area.gaps} Gaps</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Checklist */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl mb-4 text-[#CE0000]">Compliance Checklist</h2>
              <div className="space-y-3">
                {complianceChecklist.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F5F5F5] transition-colors"
                  >
                    {item.status === "complete" ? (
                      <CheckCircle className="h-5 w-5 text-[#006837] flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-[#FDB913] flex-shrink-0 mt-0.5" />
                    )}
                    <span className="text-gray-900">{item.item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Evidence */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl mb-4 text-[#CE0000]">Recent Evidence Added</h2>
              <div className="space-y-3">
                {recentEvidence.map((evidence, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:border-[#FDB913] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-[#CE0000] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-gray-900 mb-1">{evidence.name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{evidence.date}</span>
                          <span>•</span>
                          <span className="text-[#D4AF37]">{evidence.area}</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 text-gray-600 hover:text-[#CE0000] transition-colors">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ISO Standards Tab Content */}
        <TabsContent value="iso" className="space-y-6 mt-6">
          {/* ISO Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#006837]">
              <div className="flex items-center gap-3 mb-2">
                <Award className="h-6 w-6 text-[#006837]" />
                <h3 className="text-3xl text-[#006837]">2</h3>
              </div>
              <p className="text-gray-700">Active ISO Certifications</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#FDB913]">
              <div className="flex items-center gap-3 mb-2">
                <ClipboardCheck className="h-6 w-6 text-[#FDB913]" />
                <h3 className="text-3xl text-[#FDB913]">82%</h3>
              </div>
              <p className="text-gray-700">Average ISO Compliance</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#CE0000]">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-6 w-6 text-[#CE0000]" />
                <h3 className="text-3xl text-[#CE0000]">Next</h3>
              </div>
              <p className="text-gray-700">Audit: June 2026</p>
            </div>
          </div>

          {/* ISO Standards Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl mb-4 text-[#CE0000]">ISO Standards Tracking</h2>
            <div className="space-y-4">
              {isoStandards.map((standard) => (
                <div
                  key={standard.id}
                  className="border-2 border-[#D4AF37]/30 rounded-lg p-5 hover:border-[#D4AF37] transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg text-gray-900 mb-1">{standard.name}</h3>
                      <p className="text-gray-600">{standard.title}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        standard.certificationStatus === "Certified"
                          ? "bg-[#006837] text-white"
                          : "bg-[#FDB913] text-gray-900"
                      }`}
                    >
                      {standard.certificationStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Compliance</p>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl text-[#CE0000]">{standard.compliance}%</div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Clauses</p>
                      <div className="text-xl text-gray-900">{standard.clauses} Clauses</div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Last Audit</p>
                      <div className="text-xl text-gray-900">{standard.auditDate}</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        standard.compliance >= 80 ? "bg-[#006837]" : "bg-[#FDB913]"
                      }`}
                      style={{ width: `${standard.compliance}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ISO Documentation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl mb-4 text-[#CE0000]">ISO Documentation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4 hover:border-[#FDB913] transition-colors">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-[#CE0000] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-gray-900 mb-1">Quality Manual ISO 9001:2015</h3>
                    <p className="text-sm text-gray-600 mb-2">Updated: March 15, 2026</p>
                    <button className="text-sm text-[#CE0000] hover:underline">Download PDF</button>
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 hover:border-[#FDB913] transition-colors">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-[#CE0000] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-gray-900 mb-1">ISO 21001 Implementation Plan</h3>
                    <p className="text-sm text-gray-600 mb-2">Updated: March 10, 2026</p>
                    <button className="text-sm text-[#CE0000] hover:underline">Download PDF</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* CHED Monitoring Tab Content */}
        <TabsContent value="ched" className="space-y-6 mt-6">
          {/* CHED Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#006837]">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-6 w-6 text-[#006837]" />
                <h3 className="text-3xl text-[#006837]">87%</h3>
              </div>
              <p className="text-gray-700">CHED Compliance Rate</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#FDB913]">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-6 w-6 text-[#FDB913]" />
                <h3 className="text-3xl text-[#FDB913]">35</h3>
              </div>
              <p className="text-gray-700">Supporting Documents</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#CE0000]">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-6 w-6 text-[#CE0000]" />
                <h3 className="text-3xl text-[#CE0000]">3</h3>
              </div>
              <p className="text-gray-700">Active CMO Requirements</p>
            </div>
          </div>

          {/* CHED Requirements */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl mb-4 text-[#CE0000]">CHED Memorandum Orders (CMO) Compliance</h2>
            <div className="space-y-4">
              {chedRequirements.map((req) => (
                <div
                  key={req.id}
                  className="border-2 border-[#D4AF37]/30 rounded-lg p-5 hover:border-[#D4AF37] transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-[#CE0000] text-white text-xs rounded">
                          {req.category}
                        </span>
                        {req.status === "compliant" ? (
                          <CheckCircle className="h-4 w-4 text-[#006837]" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-[#FDB913]" />
                        )}
                      </div>
                      <h3 className="text-lg text-gray-900 mb-1">{req.title}</h3>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl text-[#CE0000]">{req.compliance}%</div>
                      <div className="text-xs text-gray-500">Compliance</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full ${
                        req.compliance >= 85 ? "bg-[#006837]" : "bg-[#FDB913]"
                      }`}
                      style={{ width: `${req.compliance}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{req.documents} Supporting Documents</span>
                    <span>Last Review: {req.lastReview}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CHED Reporting */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl mb-4 text-[#CE0000]">CHED Reporting & Submissions</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#FDB913] transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[#CE0000]" />
                  <div>
                    <p className="text-gray-900">Annual Accomplishment Report 2025</p>
                    <p className="text-sm text-gray-600">Due: April 30, 2026</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-[#FDB913] text-gray-900 text-sm rounded-full">
                  In Progress
                </span>
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#FDB913] transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[#CE0000]" />
                  <div>
                    <p className="text-gray-900">Student Enrollment Data (SY 2025-2026)</p>
                    <p className="text-sm text-gray-600">Submitted: March 1, 2026</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-[#006837] text-white text-sm rounded-full">
                  Submitted
                </span>
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#FDB913] transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[#CE0000]" />
                  <div>
                    <p className="text-gray-900">Faculty Roster & Qualifications</p>
                    <p className="text-sm text-gray-600">Submitted: February 15, 2026</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-[#006837] text-white text-sm rounded-full">
                  Submitted
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Accreditation Results Tab Content */}
        <TabsContent value="results" className="space-y-6 mt-6">
          {/* Results Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#006837]">
              <h3 className="text-3xl text-[#006837] mb-2">3</h3>
              <p className="text-gray-700">Accredited Programs</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#D4AF37]">
              <h3 className="text-3xl text-[#D4AF37] mb-2">Level III</h3>
              <p className="text-gray-700">Highest Accreditation</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#FDB913]">
              <h3 className="text-3xl text-[#FDB913] mb-2">2</h3>
              <p className="text-gray-700">Upcoming Visits</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#CE0000]">
              <h3 className="text-3xl text-[#CE0000] mb-2">100%</h3>
              <p className="text-gray-700">Success Rate</p>
            </div>
          </div>

          {/* Accreditation History */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl mb-4 text-[#CE0000]">Accreditation History</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-700">Program</th>
                    <th className="text-left py-3 px-4 text-gray-700">Accreditor</th>
                    <th className="text-left py-3 px-4 text-gray-700">Level</th>
                    <th className="text-left py-3 px-4 text-gray-700">Date Awarded</th>
                    <th className="text-left py-3 px-4 text-gray-700">Valid Until</th>
                    <th className="text-left py-3 px-4 text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {accreditationHistory.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-[#F5F5F5] transition-colors">
                      <td className="py-4 px-4 text-gray-900">{item.program}</td>
                      <td className="py-4 px-4 text-gray-600">{item.accreditor}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-[#D4AF37] text-white text-sm rounded">
                          {item.level}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{item.date}</td>
                      <td className="py-4 px-4 text-gray-600">{item.validUntil}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-[#006837] text-white text-sm rounded">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Accreditations */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl mb-4 text-[#CE0000]">Upcoming Accreditation Visits</h2>
            <div className="space-y-4">
              {upcomingAccreditations.map((visit) => (
                <div
                  key={visit.id}
                  className="border-2 border-[#D4AF37]/30 rounded-lg p-5 hover:border-[#D4AF37] transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg text-gray-900 mb-1">{visit.program}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {visit.scheduledDate}
                        </span>
                        <span>Accreditor: {visit.accreditor}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-[#FDB913] text-gray-900 text-sm rounded-full">
                      {visit.targetLevel}
                    </span>
                  </div>

                  <div className="mb-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Preparedness</span>
                      <span className="text-[#CE0000]">{visit.preparedness}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          visit.preparedness >= 75 ? "bg-[#006837]" : "bg-[#FDB913]"
                        }`}
                        style={{ width: `${visit.preparedness}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl mb-4 text-[#CE0000]">Action Items & Recommendations</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-[#FFF9E6] border-l-4 border-[#FDB913] rounded">
                <AlertCircle className="h-5 w-5 text-[#FDB913] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-900 mb-1">Complete faculty qualifications documentation for BSCE</p>
                  <p className="text-sm text-gray-600">Target completion: May 2026</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-[#FFF9E6] border-l-4 border-[#FDB913] rounded">
                <AlertCircle className="h-5 w-5 text-[#FDB913] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-900 mb-1">Update research output evidence for BSCS re-accreditation</p>
                  <p className="text-sm text-gray-600">Target completion: January 2027</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-[#E6F7ED] border-l-4 border-[#006837] rounded">
                <CheckCircle className="h-5 w-5 text-[#006837] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-900 mb-1">All laboratory equipment inventories up to date</p>
                  <p className="text-sm text-gray-600">Completed: March 2026</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}