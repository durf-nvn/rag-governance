import { useState } from "react";
import { Search, Filter, Download, Eye, ChevronDown, ChevronRight, Users, GraduationCap } from "lucide-react";

interface Student {
  id: string;
  name: string;
  studentId: string;
  strand: string;
  year: number;
  email: string;
  status: "Active" | "Inactive";
}

interface CourseData {
  name: string;
  code: string;
  students: Student[];
}

export function StudentRecords() {
  const [expandedCourse, setExpandedCourse] = useState<string | null>("BSIT");
  const [searchQuery, setSearchQuery] = useState("");

  const courses: CourseData[] = [
    {
      name: "Bachelor of Science in Information Technology",
      code: "BSIT",
      students: [
        {
          id: "1",
          name: "Juan Dela Cruz",
          studentId: "2023-001-BSIT",
          strand: "STEM",
          year: 2,
          email: "juan.delacruz@ctu.edu.ph",
          status: "Active"
        },
        {
          id: "2",
          name: "Maria Santos",
          studentId: "2023-002-BSIT",
          strand: "STEM",
          year: 2,
          email: "maria.santos@ctu.edu.ph",
          status: "Active"
        },
        {
          id: "3",
          name: "Pedro Garcia",
          studentId: "2024-001-BSIT",
          strand: "TVL-ICT",
          year: 1,
          email: "pedro.garcia@ctu.edu.ph",
          status: "Active"
        },
        {
          id: "4",
          name: "Ana Reyes",
          studentId: "2024-002-BSIT",
          strand: "STEM",
          year: 1,
          email: "ana.reyes@ctu.edu.ph",
          status: "Active"
        },
        {
          id: "5",
          name: "Carlos Lopez",
          studentId: "2022-001-BSIT",
          strand: "STEM",
          year: 3,
          email: "carlos.lopez@ctu.edu.ph",
          status: "Active"
        }
      ]
    },
    {
      name: "Bachelor in Industrial Technology",
      code: "BIT",
      students: [
        {
          id: "6",
          name: "Roberto Fernandez",
          studentId: "2023-003-BIT",
          strand: "TVL-IA",
          year: 2,
          email: "roberto.fernandez@ctu.edu.ph",
          status: "Active"
        },
        {
          id: "7",
          name: "Sofia Martinez",
          studentId: "2023-004-BIT",
          strand: "TVL-HE",
          year: 2,
          email: "sofia.martinez@ctu.edu.ph",
          status: "Active"
        },
        {
          id: "8",
          name: "Miguel Torres",
          studentId: "2024-003-BIT",
          strand: "TVL-IA",
          year: 1,
          email: "miguel.torres@ctu.edu.ph",
          status: "Active"
        },
        {
          id: "9",
          name: "Isabella Ramos",
          studentId: "2024-004-BIT",
          strand: "STEM",
          year: 1,
          email: "isabella.ramos@ctu.edu.ph",
          status: "Active"
        }
      ]
    },
    {
      name: "Hospitality Management",
      code: "HM",
      students: [
        {
          id: "10",
          name: "Gabriel Cruz",
          studentId: "2023-005-HM",
          strand: "TVL-HE",
          year: 2,
          email: "gabriel.cruz@ctu.edu.ph",
          status: "Active"
        },
        {
          id: "11",
          name: "Lucia Navarro",
          studentId: "2023-006-HM",
          strand: "TVL-HE",
          year: 2,
          email: "lucia.navarro@ctu.edu.ph",
          status: "Active"
        },
        {
          id: "12",
          name: "Diego Morales",
          studentId: "2024-005-HM",
          strand: "ABM",
          year: 1,
          email: "diego.morales@ctu.edu.ph",
          status: "Active"
        },
        {
          id: "13",
          name: "Carmen Diaz",
          studentId: "2024-006-HM",
          strand: "TVL-HE",
          year: 1,
          email: "carmen.diaz@ctu.edu.ph",
          status: "Active"
        },
        {
          id: "14",
          name: "Antonio Silva",
          studentId: "2022-002-HM",
          strand: "HUMSS",
          year: 3,
          email: "antonio.silva@ctu.edu.ph",
          status: "Active"
        }
      ]
    },
    {
      name: "Tourism Management",
      code: "TOURISM",
      students: [
        {
          id: "15",
          name: "Elena Vargas",
          studentId: "2023-007-TOUR",
          strand: "ABM",
          year: 2,
          email: "elena.vargas@ctu.edu.ph",
          status: "Active"
        },
        {
          id: "16",
          name: "Fernando Castro",
          studentId: "2023-008-TOUR",
          strand: "HUMSS",
          year: 2,
          email: "fernando.castro@ctu.edu.ph",
          status: "Active"
        },
        {
          id: "17",
          name: "Gabriela Mendez",
          studentId: "2024-007-TOUR",
          strand: "ABM",
          year: 1,
          email: "gabriela.mendez@ctu.edu.ph",
          status: "Active"
        },
        {
          id: "18",
          name: "Ricardo Ortiz",
          studentId: "2024-008-TOUR",
          strand: "HUMSS",
          year: 1,
          email: "ricardo.ortiz@ctu.edu.ph",
          status: "Active"
        }
      ]
    }
  ];

  const toggleCourse = (courseCode: string) => {
    setExpandedCourse(expandedCourse === courseCode ? null : courseCode);
  };

  const getStrandColor = (strand: string) => {
    const colors: Record<string, string> = {
      "STEM": "bg-green-50 text-green-700 border-green-200",
      "ABM": "bg-yellow-50 text-yellow-700 border-yellow-200",
      "HUMSS": "bg-purple-50 text-purple-700 border-purple-200",
      "TVL-ICT": "bg-blue-50 text-blue-700 border-blue-200",
      "TVL-IA": "bg-orange-50 text-orange-700 border-orange-200",
      "TVL-HE": "bg-pink-50 text-pink-700 border-pink-200"
    };
    return colors[strand] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const filteredCourses = courses.map(course => ({
    ...course,
    students: course.students.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.strand.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }));

  const totalStudents = courses.reduce((acc, course) => acc + course.students.length, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2937] mb-1">Student Records</h1>
          <p className="text-sm text-[#6B7280]">View student information organized by course and strand</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-xl hover:shadow-md transition-all">
          <Download className="h-4 w-4" />
          <span className="text-sm font-medium">Export Records</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0B3C5D] to-[#1D6FA3] rounded-xl flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0B3C5D]">{totalStudents}</p>
              <p className="text-xs text-[#6B7280]">Total Students</p>
            </div>
          </div>
        </div>
        {courses.map((course) => (
          <div
            key={course.code}
            className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-5 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#1D6FA3]/10 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-[#1D6FA3]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1D6FA3]">{course.students.length}</p>
                <p className="text-xs text-[#6B7280]">{course.code}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search by student name, ID, or strand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1D6FA3] focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#6B7280] hover:bg-[#F5F7FA] rounded-lg transition-colors border border-[#E5E7EB]">
            <Filter className="h-4 w-4" />
            More Filters
          </button>
        </div>
      </div>

      {/* Course Categories with Students */}
      <div className="space-y-4">
        {filteredCourses.map((course) => (
          <div key={course.code} className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden">
            {/* Course Header */}
            <button
              onClick={() => toggleCourse(course.code)}
              className="w-full flex items-center justify-between p-6 hover:bg-[#F5F7FA] transition-colors"
            >
              <div className="flex items-center gap-4">
                {expandedCourse === course.code ? (
                  <ChevronDown className="h-5 w-5 text-[#1D6FA3]" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-[#6B7280]" />
                )}
                <div className="text-left">
                  <h2 className="text-base font-semibold text-[#1F2937]">{course.name}</h2>
                  <p className="text-sm text-[#6B7280]">
                    {course.code} • {course.students.length} Students Enrolled
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 bg-gradient-to-r from-[#0B3C5D] to-[#1D6FA3] text-white rounded-lg text-sm font-medium">
                  {course.students.length} Students
                </span>
              </div>
            </button>

            {/* Student List */}
            {expandedCourse === course.code && (
              <div className="border-t border-[#E5E7EB]">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F5F7FA]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">Student ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">Strand</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">Year Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {course.students.map((student) => (
                        <tr key={student.id} className="hover:bg-[#F5F7FA] transition-colors">
                          <td className="px-6 py-4 text-sm text-[#1F2937] font-medium">{student.studentId}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-[#10B981] to-[#059669] text-white rounded-lg flex items-center justify-center text-xs font-semibold">
                                {student.name.split(" ").map(n => n[0]).join("")}
                              </div>
                              <span className="text-sm text-[#1F2937] font-medium">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStrandColor(student.strand)}`}>
                              {student.strand}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#1F2937]">Year {student.year}</td>
                          <td className="px-6 py-4 text-sm text-[#6B7280]">{student.email}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                student.status === "Active"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {student.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              className="p-2 text-[#6B7280] hover:text-[#1D6FA3] hover:bg-[#1D6FA3]/10 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Strand Summary */}
                <div className="p-6 bg-[#F5F7FA] border-t border-[#E5E7EB]">
                  <h3 className="text-sm font-medium text-[#1F2937] mb-3">Strand Distribution:</h3>
                  <div className="flex flex-wrap gap-3">
                    {Array.from(new Set(course.students.map(s => s.strand))).map(strand => {
                      const count = course.students.filter(s => s.strand === strand).length;
                      return (
                        <div
                          key={strand}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStrandColor(strand)}`}
                        >
                          <span className="text-sm font-medium">
                            {strand}: {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6">
        <h3 className="text-base font-semibold text-[#1F2937] mb-4">Senior High School Strand Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-200">STEM</span>
            <span className="text-sm text-[#6B7280]">Science, Technology, Engineering, Mathematics</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-medium border border-yellow-200">ABM</span>
            <span className="text-sm text-[#6B7280]">Accountancy, Business, Management</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-200">HUMSS</span>
            <span className="text-sm text-[#6B7280]">Humanities and Social Sciences</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">TVL-ICT</span>
            <span className="text-sm text-[#6B7280]">Technical-Vocational-Livelihood ICT</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium border border-orange-200">TVL-IA</span>
            <span className="text-sm text-[#6B7280]">TVL Industrial Arts</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="px-3 py-1 bg-pink-50 text-pink-700 rounded-lg text-xs font-medium border border-pink-200">TVL-HE</span>
            <span className="text-sm text-[#6B7280]">TVL Home Economics</span>
          </div>
        </div>
      </div>
    </div>
  );
}
