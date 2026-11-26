import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import api, { API_BASE_URL } from "@/utils/api";
import { toast } from "react-toastify";
import { io, Socket } from "socket.io-client";
import {
  Users,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Building,
  FileText,
  ExternalLink,
  Search,
  Filter,
  Bell,
  Sparkles,
  ChevronRight,
  Eye,
  AlertTriangle,
} from "lucide-react";

interface ApplicationItem {
  _id: string;
  company: string;
  category: string;
  coverLetter: string;
  title: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  user: {
    _id?: string;
    name: string;
    email: string;
    phone?: string;
    resume?: string;
    skills?: string[];
  };
}

const CompanyDashboard = () => {
  const router = useRouter();
  const user = useSelector(selectuser);

  const [activeTab, setActiveTab] = useState<"overview" | "applicants" | "profile">("applicants");
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [liveNotification, setLiveNotification] = useState<string | null>(null);

  // Fetch company applications
  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/application/company");
      setApplications(res.data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    if (user.role !== "company" && user.role !== "admin") {
      toast.warn("Company access required. Please login with a company account.");
      router.push("/");
      return;
    }

    fetchApplications();

    // Setup private socket listener for this company
    const socket: Socket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      const companyName = user.profile?.companyName || user.name;
      socket.emit("join_company", companyName);
      socket.emit("join_company", user.id || user._id);
    });

    socket.on("new_application", (newApp: ApplicationItem) => {
      setApplications((prev) => [newApp, ...prev]);
      const candidate = newApp.user?.name || "A candidate";
      setLiveNotification(`🔔 ${candidate} just applied for "${newApp.title}"!`);
      setTimeout(() => setLiveNotification(null), 8000);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Handle Accept / Reject
  const handleStatusChange = async (id: string, newStatus: "accepted" | "rejected") => {
    try {
      const res = await api.put(`/application/${id}`, { action: newStatus });
      toast.success(`Application marked as ${newStatus.toUpperCase()}`);
      setApplications((prev) =>
        prev.map((app) => (app._id === id ? { ...app, status: newStatus } : app))
      );
      if (selectedApp && selectedApp._id === id) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to update status");
    }
  };

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      (app.user?.name && app.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.title && app.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.user?.email && app.user.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ? true : app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalApps = applications.length;
  const pendingApps = applications.filter((a) => a.status === "pending").length;
  const acceptedApps = applications.filter((a) => a.status === "accepted").length;
  const rejectedApps = applications.filter((a) => a.status === "rejected").length;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800">Company Login Required</h2>
          <p className="text-sm text-gray-600 mt-2">
            Please log in with your recruiter/employer account to view the company portal.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700"
          >
            Go to Home & Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Modern Left Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0 p-5 flex flex-col justify-between">
        <div>
          {/* Company Branding */}
          <div className="flex items-center space-x-3 pb-6 border-b border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white truncate">
                {user.profile?.companyName || user.name}
              </h2>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Recruiter Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "overview"
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <span className="flex items-center">
                <Briefcase className="w-4 h-4 mr-2.5" />
                Overview & Stats
              </span>
            </button>

            <button
              onClick={() => setActiveTab("applicants")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "applicants"
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-2.5" />
                Applicant Pipeline
              </span>
              {pendingApps > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {pendingApps}
                </span>
              )}
            </button>

            <Link
              href="/postInternship"
              className="w-full flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 text-slate-300 transition"
            >
              <Send className="w-4 h-4 mr-2.5 text-indigo-400" />
              Post Internship
            </Link>

            <Link
              href="/postJob"
              className="w-full flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 text-slate-300 transition"
            >
              <Briefcase className="w-4 h-4 mr-2.5 text-emerald-400" />
              Post Full-Time Job
            </Link>

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "profile"
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <Building className="w-4 h-4 mr-2.5" />
              Company Profile
            </button>
          </nav>
        </div>

        {/* Real-time Indicator Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Real-Time Socket Connected</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-600">
            Instant applicant notifications active
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        {/* Real-Time Live Notification Banner */}
        {liveNotification && (
          <div className="mb-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-bounce">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 animate-spin" />
              <span className="text-sm font-semibold">{liveNotification}</span>
            </div>
            <button
              onClick={() => setLiveNotification(null)}
              className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-md"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "applicants" && "Applicant Management Pipeline"}
              {activeTab === "profile" && "Company Profile Settings"}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Empower your recruitment process with live applicant reviews and instant decision making.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/postInternship"
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Post Internship
            </Link>
            <Link
              href="/postJob"
              className="inline-flex items-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition"
            >
              <Briefcase className="w-3.5 h-3.5 mr-1.5" />
              Post Job
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Applicants
              </span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black text-gray-900 mt-2">{totalApps}</p>
            <span className="text-[11px] text-gray-400 mt-1 block">Lifetime candidates</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                Pending Review
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-600 mt-2">{pendingApps}</p>
            <span className="text-[11px] text-gray-400 mt-1 block">Awaiting decision</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Accepted Candidates
              </span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-emerald-600 mt-2">{acceptedApps}</p>
            <span className="text-[11px] text-gray-400 mt-1 block">Offers extended</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                Rejected
              </span>
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-black text-red-600 mt-2">{rejectedApps}</p>
            <span className="text-[11px] text-gray-400 mt-1 block">Declined applications</span>
          </div>
        </div>

        {/* TAB: APPLICANTS DATA TABLE */}
        {activeTab === "applicants" && (
          <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            {/* Filter & Search Bar */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by student name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Status Filter Pill buttons */}
              <div className="flex items-center space-x-1.5 self-start sm:self-auto">
                {["all", "pending", "accepted", "rejected"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition ${
                      statusFilter === s
                        ? "bg-slate-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Applications Data Table */}
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="py-12 text-center text-gray-500 text-sm">
                  Loading applicant pipeline...
                </div>
              ) : filteredApps.length === 0 ? (
                <div className="py-16 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">No applicants found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    When students apply to your postings, they will appear here in real time.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3">Applicant Name</th>
                      <th className="px-5 py-3">Target Opportunity</th>
                      <th className="px-5 py-3">Contact</th>
                      <th className="px-5 py-3">Applied On</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredApps.map((app) => (
                      <tr key={app._id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                              {app.user?.name ? app.user.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{app.user?.name}</p>
                              {app.user?.skills && app.user.skills.length > 0 && (
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {app.user.skills.slice(0, 3).join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-800">{app.title}</p>
                          <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            {app.category}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-gray-600">
                          <p>{app.user?.email}</p>
                          {app.user?.phone && (
                            <p className="text-[10px] text-gray-400">{app.user.phone}</p>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-gray-500">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                              app.status === "accepted"
                                ? "bg-emerald-100 text-emerald-800"
                                : app.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {app.status === "accepted" && (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            )}
                            {app.status === "rejected" && (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {app.status === "pending" && (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            {app.status}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                            title="View Cover Letter"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleStatusChange(app._id, "accepted")}
                            disabled={app.status === "accepted"}
                            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition disabled:opacity-30"
                            title="Accept Candidate"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleStatusChange(app._id, "rejected")}
                            disabled={app.status === "rejected"}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition disabled:opacity-30"
                            title="Reject Candidate"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="mt-8 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <h3 className="text-base font-bold text-gray-900 mb-2">
                Recruitment Automation Active
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Your hiring dashboard receives instant WebSocket push events whenever candidates apply.
                Applications undergo strict Role-Based Access Control (RBAC) to ensure student and
                employer privacy.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="border border-indigo-100 bg-indigo-50/50 p-4 rounded-xl">
                  <h4 className="font-semibold text-indigo-900 text-sm">Post Internship</h4>
                  <p className="text-xs text-indigo-700 mt-1">
                    Publish a 1-6 month internship offering with stipend, perks, and openings.
                  </p>
                  <Link
                    href="/postInternship"
                    className="inline-block mt-3 text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Create internship posting →
                  </Link>
                </div>

                <div className="border border-emerald-100 bg-emerald-50/50 p-4 rounded-xl">
                  <h4 className="font-semibold text-emerald-900 text-sm">Post Full-Time Job</h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Hire experienced or fresh talent for engineering, marketing, and design roles.
                  </p>
                  <Link
                    href="/postJob"
                    className="inline-block mt-3 text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Create job posting →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PROFILE */}
        {activeTab === "profile" && (
          <div className="mt-8 bg-white p-6 rounded-2xl border border-gray-200 max-w-xl">
            <h3 className="text-base font-bold text-gray-900 mb-4">
              Company Information
            </h3>
            <div className="space-y-4 text-xs">
              <div>
                <span className="font-semibold text-gray-500">Recruiter Contact:</span>
                <p className="text-sm font-medium text-gray-800">{user.name}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Account Email:</span>
                <p className="text-sm font-medium text-gray-800">{user.email}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Company Name:</span>
                <p className="text-sm font-medium text-gray-800">
                  {user.profile?.companyName || user.name}
                </p>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Company Description:</span>
                <p className="text-sm text-gray-700 mt-1">
                  {user.profile?.companyDescription || "Leading technology and service provider."}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================== */}
      {/* CANDIDATE COVER LETTER & DETAILS MODAL */}
      {/* ========================================== */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedApp.user?.name}&apos;s Application
                </h3>
                <p className="text-xs text-indigo-600 font-semibold">{selectedApp.title}</p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <span className="font-semibold text-gray-500 block mb-1">
                  Cover Letter / Statement:
                </span>
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-gray-700 leading-relaxed max-h-48 overflow-y-auto">
                  {selectedApp.coverLetter || "No cover letter provided."}
                </div>
              </div>

              {selectedApp.user?.skills && selectedApp.user.skills.length > 0 && (
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApp.user.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedApp.user?.resume && (
                <div>
                  <span className="font-semibold text-gray-500 block mb-1">Resume:</span>
                  <a
                    href={selectedApp.user.resume}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-blue-600 hover:underline font-semibold"
                  >
                    View Candidate Resume <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="font-medium text-gray-500">
                  Current Status:{" "}
                  <strong className="text-gray-900 uppercase">
                    {selectedApp.status}
                  </strong>
                </span>

                <div className="space-x-2">
                  <button
                    onClick={() => handleStatusChange(selectedApp._id, "accepted")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedApp._id, "rejected")}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded-lg"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDashboard;
