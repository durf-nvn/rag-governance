import { useState, useEffect } from "react";
import { Link } from "react-router";
import { GraduationCap, Database, MessageSquare, Award, FileSearch, Shield, Users, ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import axios from "axios";

export function LandingPage() {
  // --- NEW: State for sticky navbar ---
  const [isScrolled, setIsScrolled] = useState(false);

  // --- NEW: State for real-time statistics ---
  const [stats, setStats] = useState({
    documents: 0,
    queries: 0,
    users: 0,
    isLoading: true
  });

  // Track scrolling to update the navbar style
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get("http://localhost:8000/system-stats");
        setStats({
          documents: response.data.documents,
          queries: response.data.queries,
          users: response.data.users,
          isLoading: false
        });
      } catch (error) {
        console.error("Failed to fetch system stats:", error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };
    fetchStats();
  }, []);
  // -------------------------------------------

  const features = [
    {
      icon: Database,
      title: "Knowledge Repository",
      description: "Store and manage all institutional policies, procedures, and documents in one secure, searchable location.",
      color: "#FF9501"
    },
    {
      icon: MessageSquare,
      title: "AI Policy Q&A",
      description: "Ask questions in natural language and receive instant, accurate answers with source citations from documents.",
      color: "#FF9501"
    },
    {
      icon: Award,
      title: "Accreditation Support",
      description: "Streamline accreditation processes with evidence locators, compliance checklists, and gap identification.",
      color: "#10B981"
    },
    {
      icon: FileSearch,
      title: "Governance Reference",
      description: "Quick access to CHED memoranda, university policies, and regulatory frameworks with advanced search.",
      color: "#FF9501"
    },
    {
      icon: Shield,
      title: "Audit Trail",
      description: "Complete tracking of all system activities including queries, document access, and version changes.",
      color: "#FF9501"
    },
    {
      icon: Users,
      title: "Role-Based Access",
      description: "Secure access control with different permissions for administrators, faculty, and students.",
      color: "#10B981"
    }
  ];

  const benefits = [
    "AI-powered intelligent search",
    "Secure document management",
    "Real-time compliance tracking",
    "Automated accreditation support"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation - Sticky with dynamic styling */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-[#E5E7EB]" 
            : "bg-transparent"
        }`}
      >
        <div 
          className={`container mx-auto px-8 flex items-center justify-between transition-all duration-300 ${
            isScrolled ? "py-4" : "py-6"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 flex items-center justify-center">
              <img 
                src="/ctu-logo.png" 
                alt="CTU Logo" 
                className="h-8 w-8 object-contain" 
              />
            </div>
            <div>
              <div className="text-base font-semibold text-[#1F2937] tracking-tight">CTU Argao</div>
              <div className="text-xs text-[#6B7280] tracking-wide">Knowledge System</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="px-6 py-2.5 text-sm font-medium text-[#D97E00] hover:text-[#FF9501] transition-colors"
            >
              Sign In
            </Link>
            <Link 
              to="/signup" 
              className="px-6 py-2.5 text-sm font-medium bg-[#FF9501] text-white rounded-full hover:bg-[#D97E00] transition-all shadow-sm hover:shadow-md"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="container mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column */}
            <div className="space-y-8">
              

              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#1F2937] leading-tight tracking-tight">
                  RAG-Powered
                  <br />
                  <span className="text-[#FF9501]">Knowledge</span>
                  <br />
                  System
                </h1>
              </div>

              <p className="text-xl text-[#6B7280] leading-relaxed max-w-xl">
                Empowering quality assurance and academic governance with intelligent 
                document management and AI-powered insights.
              </p>

              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-50 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-[#10B981]" />
                    </div>
                    <span className="text-base text-[#1F2937]">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link 
                  to="/signup" 
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#FF9501] text-white rounded-2xl hover:bg-[#D97E00] transition-all font-medium shadow-lg hover:shadow-xl"
                >
                  Get Started
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/login" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-[#E5E7EB] text-[#1F2937] rounded-2xl hover:border-[#FF9501] hover:text-[#FF9501] transition-all font-medium"
                >
                  Login to System
                </Link>
              </div>

              <div className="pt-8 flex items-center gap-4 text-sm text-[#6B7280]">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Secure & Compliant</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-[#E5E7EB]"></div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {/* DYNAMIC USER COUNT */}
                  <span>Trusted by {stats.isLoading ? "..." : stats.users} Users</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="relative hidden lg:block">
              <div className="relative">
                <div className="rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="/ctuac-bg.png"
                    alt="CTU Knowledge System"
                    className="w-full h-auto object-cover"
                  />
                </div>

                <div className="absolute -bottom-8 -left-8 bg-white rounded-2xl shadow-xl p-6 border border-[#E5E7EB]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#FFF4E5] rounded-xl flex items-center justify-center">
                      <Database className="h-6 w-6 text-[#FF9501]" />
                    </div>
                    <div>
                      {/* DYNAMIC DOCUMENT COUNT */}
                      <div className="text-2xl font-bold text-[#1F2937]">
                        {stats.isLoading ? "..." : stats.documents}
                      </div>
                      <div className="text-sm text-[#6B7280]">Documents</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-8 -right-8 bg-white rounded-2xl shadow-xl p-6 border border-[#E5E7EB]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-[#10B981]" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#1F2937]">95%</div>
                      <div className="text-sm text-[#6B7280]">Accuracy</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-white to-[#F5F7FA]">
        <div className="container mx-auto px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1F2937] tracking-tight">
              Everything You Need
            </h2>
            <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
              Comprehensive tools designed to streamline institutional knowledge management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="group bg-white rounded-3xl border border-[#E5E7EB] p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <Icon className="h-7 w-7" style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[#1F2937]">
                    {feature.title}
                  </h3>
                  <p className="text-base text-[#6B7280] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-8">
          <div className="bg-gradient-to-br from-[#FF9501] to-[#D97E00] rounded-[3rem] p-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Trusted by CTU Community
              </h2>
              <p className="text-lg text-white/80 max-w-2xl mx-auto">
                Join hundreds of faculty, staff, and students using our platform
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                {/* DYNAMIC DOCUMENTS */}
                <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                  {stats.isLoading ? "-" : stats.documents}
                </div>
                <div className="text-base text-white/80">Documents Managed</div>
              </div>
              <div className="text-center">
                {/* DYNAMIC QUERIES */}
                <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                  {stats.isLoading ? "-" : stats.queries}
                </div>
                <div className="text-base text-white/80">AI Queries Processed</div>
              </div>
              <div className="text-center">
                <div className="text-5xl md:text-6xl font-bold text-white mb-2">95%</div>
                <div className="text-base text-white/80">System Availability</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#F5F7FA]">
        <div className="container mx-auto px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1F2937] tracking-tight">
              Ready to Transform Your
              <br />
              Knowledge Management?
            </h2>
            <p className="text-xl text-[#6B7280] max-w-2xl mx-auto leading-relaxed">
              Join CTU Argao Campus in modernizing institutional knowledge management 
              with AI-powered solutions.
            </p>
            <div className="pt-4">
              <Link 
                to="/signup" 
                className="group inline-flex items-center justify-center gap-2 px-10 py-5 bg-[#FF9501] text-white rounded-2xl hover:bg-[#D97E00] transition-all font-medium text-lg shadow-xl hover:shadow-2xl"
              >
                Get Started Today
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-12">
        <div className="container mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 flex items-center justify-center">
                <img 
                  src="/ctu-logo.png" 
                  alt="CTU Logo" 
                  className="h-8 w-8 object-contain" 
                />
              </div>
              <div className="text-sm text-[#6B7280]">
                © 2026 Cebu Technological University - Argao Campus
              </div>
            </div>
            <div className="flex gap-8 text-sm text-[#6B7280]">
              <a href="#" className="hover:text-[#FF9501] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#FF9501] transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-[#FF9501] transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}