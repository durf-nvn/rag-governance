import { Search, FileText, ExternalLink, Calendar } from "lucide-react";

export function GovernanceReference() {
  const categories = [
    {
      id: "ched",
      name: "CHED Memoranda",
      count: 45,
      color: "#CE0000"
    },
    {
      id: "university",
      name: "University Policies",
      count: 78,
      color: "#FDB913"
    },
    {
      id: "ra",
      name: "Republic Acts",
      count: 23,
      color: "#006837"
    },
    {
      id: "bor",
      name: "Board Resolutions",
      count: 56,
      color: "#D4AF37"
    },
  ];

  const documents = [
    {
      id: 1,
      title: "CHED Memorandum Order No. 46, Series of 2012",
      category: "CHED Memoranda",
      summary: "Policy-Standard to Enhance Quality Assurance (QA) in Philippine Higher Education through an Outcomes-Based and Typology-Based QA",
      effectivityDate: "May 20, 2012",
      link: "#"
    },
    {
      id: 2,
      title: "CMO No. 104, Series of 2017",
      category: "CHED Memoranda",
      summary: "Revised Guidelines for Voluntary Accreditation of Higher Education Institutions",
      effectivityDate: "November 20, 2017",
      link: "#"
    },
    {
      id: 3,
      title: "Republic Act No. 7722",
      category: "Republic Acts",
      summary: "Higher Education Act of 1994 - An Act Creating the Commission on Higher Education",
      effectivityDate: "May 18, 1994",
      link: "#"
    },
    {
      id: 4,
      title: "CTU Board Resolution No. 023-2025",
      category: "Board Resolutions",
      summary: "Approval of the Quality Assurance Manual and Implementation Guidelines for Academic Year 2025-2026",
      effectivityDate: "March 15, 2025",
      link: "#"
    },
    {
      id: 5,
      title: "CTU Student Handbook 2026",
      category: "University Policies",
      summary: "Comprehensive guide to student rights, responsibilities, and institutional policies",
      effectivityDate: "January 15, 2026",
      link: "#"
    },
    {
      id: 6,
      title: "Data Privacy Policy",
      category: "University Policies",
      summary: "Implementation of Republic Act No. 10173 (Data Privacy Act) within CTU",
      effectivityDate: "June 1, 2023",
      link: "#"
    },
    {
      id: 7,
      title: "CMO No. 52, Series of 2007",
      category: "CHED Memoranda",
      summary: "Revised Guidelines for the Operationalization of Voluntary Accreditation",
      effectivityDate: "October 2, 2007",
      link: "#"
    },
    {
      id: 8,
      title: "Republic Act No. 10173",
      category: "Republic Acts",
      summary: "Data Privacy Act of 2012 - An Act Protecting Individual Personal Information",
      effectivityDate: "August 15, 2012",
      link: "#"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl text-gray-900 mb-2">Governance Reference</h1>
        <p className="text-gray-600">Quick access to CHED memoranda, university policies, and regulatory frameworks</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for policies, memoranda, or regulations by keyword, number, or date..."
              className="w-full pl-10 pr-4 py-3 bg-[#F5F5F5] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913]"
            />
          </div>
          <button className="px-6 py-3 bg-[#FDB913] text-gray-900 rounded-lg hover:bg-[#e5a610] transition-colors">
            Search
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {categories.map((category) => (
          <button
            key={category.id}
            className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-shadow border-t-4"
            style={{ borderColor: category.color }}
          >
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-8 w-8" style={{ color: category.color }} />
              <span
                className="text-2xl"
                style={{ color: category.color }}
              >
                {category.count}
              </span>
            </div>
            <h3 className="text-lg text-gray-900">{category.name}</h3>
          </button>
        ))}
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl mb-6 text-[#CE0000]">Governance Documents</h2>
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="border-l-4 border-[#D4AF37] bg-[#F5F5F5] rounded-lg p-5 hover:bg-white hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <FileText className="h-5 w-5 text-[#CE0000] flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg text-gray-900 mb-1">{doc.title}</h3>
                      <span className="inline-block px-3 py-1 bg-white text-gray-700 text-xs rounded-full border border-gray-300">
                        {doc.category}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3 ml-8">{doc.summary}</p>
                  
                  <div className="flex items-center gap-4 ml-8 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Effectivity: {doc.effectivityDate}</span>
                    </div>
                    <a
                      href={doc.link}
                      className="flex items-center gap-1 text-[#006837] hover:text-[#004d26] transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>View Document</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl mb-4 text-[#CE0000]">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="#"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-[#FDB913] transition-colors"
          >
            <ExternalLink className="h-5 w-5 text-[#CE0000]" />
            <div>
              <h4 className="text-gray-900">CHED Official Website</h4>
              <p className="text-sm text-gray-600">Access latest CMOs and policies</p>
            </div>
          </a>

          <a
            href="#"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-[#FDB913] transition-colors"
          >
            <ExternalLink className="h-5 w-5 text-[#CE0000]" />
            <div>
              <h4 className="text-gray-900">CTU Official Portal</h4>
              <p className="text-sm text-gray-600">University policies and guidelines</p>
            </div>
          </a>

          <a
            href="#"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-[#FDB913] transition-colors"
          >
            <ExternalLink className="h-5 w-5 text-[#CE0000]" />
            <div>
              <h4 className="text-gray-900">Philippine Laws Database</h4>
              <p className="text-sm text-gray-600">Republic Acts and legal references</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
