import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import api from "@/utils/api";
import { toast } from "react-toastify";
import {
  Users,
  Briefcase,
  Send,
  Mail,
  ShieldCheck,
  Trash2,
  Search,
  Filter,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  Sparkles,
  Building,
} from "lucide-react";

const AdminDashboard = () => {
  const router = useRouter();
  const user = useSelector(selectuser);

  const [activeTab, setActiveTab] = useState<"overview" | "users" | "internships" | "jobs" | "applications">("overview");
  const [stats, setStats] = useState<any>({});
  const [usersList, setUsersList] = useState<any[]>([]);
  const [internshipsList, setInternshipsList] = useState<any[]>([]);
  const [jobsList, setJobsList] = useState<any[]>([]);
  const [applicationsList, setApplicationsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, internRes, jobsRes, appsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/internship"),
        api.get("/job"),
        api.get("/application"),
      ]);

      setStats(statsRes.data);
      setUsersList(usersRes.data);
      setInternshipsList(internRes.data);
      setJobsList(jobsRes.data);
      setApplicationsList(appsRes.data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") {
      toast.warn("Admin authorization required.");
      router.push("/adminlogin");
      return;
    }
    fetchData();
  }, [user]);

  // Delete User
  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${name}"?`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success(`User "${name}" deleted successfully`);
      setUsersList((prev) => prev.filter((u) => u._id !== id));
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete user");
    }
  };

  // Delete Inappropriate Internship
  const handleDeleteInternship = async (id: string, title: string) => {
    if (!confirm(`Permanently remove internship "${title}" for content moderation?`)) return;
    try {
      await api.delete(`/admin/internship/${id}`);
      toast.success("Internship removed successfully");
      setInternshipsList((prev) => prev.filter((i) => i._id !== id));
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete internship");
    }
  };

  // Delete Inappropriate Job
  const handleDeleteJob = async (id: string, title: string) => {
    if (!confirm(`Permanently remove job "${title}" for content moderation?`)) return;
    try {
      await api.delete(`/admin/job/${id}`);
      toast.success("Job removed successfully");
      setJobsList((prev) => prev.filter((j) => j._id !== id));
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete job");
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md">
          <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800">Admin Authentication Required</h2>
          <p className="text-sm text-gray-600 mt-2">
            Please log in with system administrator credentials.
          </p>
          <Link
            href="/adminlogin"
            className="mt-5 inline-block bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700"
          >
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Modern Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0 p-5 flex flex-col justify-between">
        <div>
          {/* Admin Header */}
          <div className="flex items-center space-x-3 pb-6 border-b border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold text-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Administrator</h2>
              <span className="text-[11px] text-amber-400 font-medium">Root Controller</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "overview"
                  ? "bg-amber-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2.5" />
              Platform Overview
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "users"
                  ? "bg-amber-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-2.5" />
                Manage Users
              </span>
              <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {usersList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("internships")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "internships"
                  ? "bg-amber-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <span className="flex items-center">
                <Send className="w-4 h-4 mr-2.5" />
                Internship Moderation
              </span>
              <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {internshipsList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("jobs")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "jobs"
                  ? "bg-amber-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <span className="flex items-center">
                <Briefcase className="w-4 h-4 mr-2.5" />
                Job Moderation
              </span>
              <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {jobsList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("applications")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "applications"
                  ? "bg-amber-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <span className="flex items-center">
                <Mail className="w-4 h-4 mr-2.5" />
                All Applications
              </span>
              <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {applicationsList.length}
              </span>
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 text-xs text-slate-500">
          <p>Security Hardened System</p>
          <span className="text-[11px] text-emerald-400">RBAC Active</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === "overview" && "Platform Operations Overview"}
              {activeTab === "users" && "User Account Governance"}
              {activeTab === "internships" && "Internship Moderation"}
              {activeTab === "jobs" && "Job Posting Moderation"}
              {activeTab === "applications" && "Platform-Wide Applications"}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Maintain portal integrity, eliminate inappropriate postings, and manage registered roles.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchData}
              className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 text-gray-700"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
              <span>Total Users</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-gray-900 mt-2">{stats.totalUsers || 0}</p>
            <span className="text-[11px] text-gray-400 mt-1 block">
              {stats.studentsCount || 0} Students, {stats.companiesCount || 0} Companies
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between text-emerald-600 text-xs font-semibold uppercase">
              <span>Active Internships</span>
              <Send className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-emerald-600 mt-2">
              {stats.internshipsCount || 0}
            </p>
            <span className="text-[11px] text-gray-400 mt-1 block">Live listings</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between text-indigo-600 text-xs font-semibold uppercase">
              <span>Active Jobs</span>
              <Briefcase className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black text-indigo-600 mt-2">{stats.jobsCount || 0}</p>
            <span className="text-[11px] text-gray-400 mt-1 block">Full-time opportunities</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between text-amber-600 text-xs font-semibold uppercase">
              <span>Applications</span>
              <Mail className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-600 mt-2">
              {stats.applicationsCount || 0}
            </p>
            <span className="text-[11px] text-gray-400 mt-1 block">
              {stats.pendingApplications || 0} pending review
            </span>
          </div>
        </div>

        {/* TAB: USERS MANAGEMENT TABLE */}
        {activeTab === "users" && (
          <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">Registered Accounts</h3>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Company / Headline</th>
                    <th className="px-5 py-3">Registered On</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersList
                    .filter(
                      (u) =>
                        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3 font-semibold text-gray-900">{u.name}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              u.role === "admin"
                                ? "bg-amber-100 text-amber-800"
                                : u.role === "company"
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-600">{u.email}</td>
                        <td className="px-5 py-3 text-gray-500">
                          {u.profile?.companyName || u.profile?.headline || "—"}
                        </td>
                        <td className="px-5 py-3 text-gray-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {u.role !== "admin" && (
                            <button
                              onClick={() => handleDeleteUser(u._id, u.name)}
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: INTERNSHIP MODERATION TABLE */}
        {activeTab === "internships" && (
          <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">
                Internship Moderation (Delete Inappropriate Content)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3">Title</th>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Stipend</th>
                    <th className="px-5 py-3">Location</th>
                    <th className="px-5 py-3 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {internshipsList.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-semibold text-gray-900">{item.title}</td>
                      <td className="px-5 py-3 text-gray-700">{item.company}</td>
                      <td className="px-5 py-3">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium text-emerald-600">{item.stipend}</td>
                      <td className="px-5 py-3 text-gray-500">{item.location}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleDeleteInternship(item._id, item.title)}
                          className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-2.5 py-1 rounded text-xs font-semibold transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: JOB MODERATION TABLE */}
        {activeTab === "jobs" && (
          <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">
                Job Moderation (Delete Inappropriate Content)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3">Title</th>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Salary</th>
                    <th className="px-5 py-3">Location</th>
                    <th className="px-5 py-3 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {jobsList.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-semibold text-gray-900">{item.title}</td>
                      <td className="px-5 py-3 text-gray-700">{item.company}</td>
                      <td className="px-5 py-3">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium text-emerald-600">{item.Salary}</td>
                      <td className="px-5 py-3 text-gray-500">{item.location}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleDeleteJob(item._id, item.title)}
                          className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-2.5 py-1 rounded text-xs font-semibold transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: ALL APPLICATIONS */}
        {activeTab === "applications" && (
          <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800">All Portal Applications</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Opportunity</th>
                    <th className="px-5 py-3">Applied Date</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {applicationsList.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-semibold text-gray-900">{app.user?.name}</td>
                      <td className="px-5 py-3 text-gray-700">{app.company}</td>
                      <td className="px-5 py-3 text-gray-600">{app.title}</td>
                      <td className="px-5 py-3 text-gray-400">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            app.status === "accepted"
                              ? "bg-emerald-100 text-emerald-800"
                              : app.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h3 className="text-base font-bold text-gray-900 mb-2">
                System Governance & RBAC Status
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                As system administrator, you have full privilege to moderate listings, remove offensive
                or inappropriate jobs/internships, and govern student and employer access.
              </p>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="font-semibold text-gray-700">Security Headers (Helmet)</span>
                  <span className="text-emerald-600 font-bold">Enabled</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="font-semibold text-gray-700">Auth Rate Limiting</span>
                  <span className="text-emerald-600 font-bold">Enforced (30 req / 15 min)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="font-semibold text-gray-700">NoSQL Injection Sanitization</span>
                  <span className="text-emerald-600 font-bold">Protected</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                  <span className="font-semibold text-gray-700">Password Hashing</span>
                  <span className="text-emerald-600 font-bold">bcrypt (10 rounds)</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h3 className="text-base font-bold text-gray-900 mb-2">Quick Actions</h3>
              <div className="space-y-3 mt-4">
                <button
                  onClick={() => setActiveTab("users")}
                  className="w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-slate-50 flex items-center justify-between transition"
                >
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Manage Registered Users</h4>
                    <p className="text-[11px] text-gray-500">
                      Review user accounts, permissions, and roles.
                    </p>
                  </div>
                  <Users className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => setActiveTab("internships")}
                  className="w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-slate-50 flex items-center justify-between transition"
                >
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Moderate Internships</h4>
                    <p className="text-[11px] text-gray-500">
                      Remove outdated or inappropriate internship listings.
                    </p>
                  </div>
                  <Send className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => setActiveTab("jobs")}
                  className="w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-slate-50 flex items-center justify-between transition"
                >
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Moderate Jobs</h4>
                    <p className="text-[11px] text-gray-500">
                      Audit full-time opportunities and remove spam.
                    </p>
                  </div>
                  <Briefcase className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;