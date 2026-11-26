import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectuser, updateProfile } from "@/Feature/Userslice";
import Link from "next/link";
import {
  ExternalLink,
  Mail,
  User,
  Phone,
  Briefcase,
  GraduationCap,
  FileText,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Sparkles,
  Monitor,
  Smartphone,
  Tablet,
  Shield,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  MapPin,
} from "lucide-react";
import api from "@/utils/api";
import { toast } from "react-toastify";

const ProfilePage = () => {
  const user = useSelector(selectuser);
  const dispatch = useDispatch();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [resume, setResume] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [education, setEducation] = useState<any[]>([]);

  // Education form state
  const [degInput, setDegInput] = useState("");
  const [collegeInput, setCollegeInput] = useState("");
  const [startYearInput, setStartYearInput] = useState("");
  const [endYearInput, setEndYearInput] = useState("");

  const [activeAppsCount, setActiveAppsCount] = useState(0);
  const [acceptedAppsCount, setAcceptedAppsCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [isLoggingOutOther, setIsLoggingOutOther] = useState(false);

  const fetchLoginHistory = () => {
    api
      .get("/auth/login-history")
      .then((res) => {
        setLoginHistory(res.data.loginHistory || []);
      })
      .catch((err) => console.warn("Failed to load login history:", err.message));
  };

  // Sync state from logged-in user
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setHeadline(user.profile?.headline || "");
      setBio(user.profile?.bio || "");
      setResume(user.profile?.resume || "");
      setSkills(user.profile?.skills || []);
      setEducation(user.profile?.education || []);

      // Fetch student stats
      api
        .get("/application/my")
        .then((res) => {
          const apps = res.data;
          setActiveAppsCount(apps.filter((a: any) => a.status === "pending").length);
          setAcceptedAppsCount(apps.filter((a: any) => a.status === "accepted").length);
        })
        .catch(() => {});

      fetchLoginHistory();
    }
  }, [user]);

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill.trim())) {
      toast.warn("Skill already added");
      return;
    }
    setSkills([...skills, newSkill.trim()]);
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleAddEducation = () => {
    if (!degInput || !collegeInput) {
      toast.warn("Please enter degree and college");
      return;
    }
    const newEdu = {
      degree: degInput,
      college: collegeInput,
      startYear: startYearInput || "2021",
      endYear: endYearInput || "2025",
    };
    setEducation([...education, newEdu]);
    setDegInput("");
    setCollegeInput("");
    setStartYearInput("");
    setEndYearInput("");
  };

  const handleRemoveEducation = (index: number) => {
    setEducation(education.filter((_, idx) => idx !== index));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        name,
        phone,
        profile: {
          headline,
          bio,
          skills,
          education,
          resume,
          avatar: user?.profile?.avatar,
        },
      };

      const res = await api.put("/profile/me", payload);
      dispatch(updateProfile(res.data.user));
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md">
          <User className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800">Login Required</h2>
          <p className="text-sm text-gray-600 mt-2">
            Please log in to manage your student profile and job applications.
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
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Banner */}
          <div className="relative h-36 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
            <div className="absolute -bottom-12 left-8">
              <div className="w-24 h-24 rounded-2xl border-4 border-white bg-blue-600 text-white shadow-lg flex items-center justify-center font-black text-3xl">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            </div>
          </div>

          {/* User Basic Info Header */}
          <div className="pt-16 pb-6 px-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">{name || user.name}</h1>
                <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {user.role}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{headline || "Student & Opportunity Seeker"}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2">
                <span className="flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  {user.email}
                </span>
                {phone && (
                  <span className="flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    {phone}
                  </span>
                )}
              </div>
            </div>

            <Link
              href="/userapplication"
              className="inline-flex items-center text-xs font-semibold px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition self-start sm:self-auto"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              My Applications ({activeAppsCount + acceptedAppsCount})
            </Link>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 p-8 border-b border-gray-100 bg-slate-50/50">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center space-x-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{activeAppsCount}</p>
                <span className="text-xs text-gray-500">In Review Applications</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center space-x-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{acceptedAppsCount}</p>
                <span className="text-xs text-gray-500">Accepted Applications</span>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} className="p-8 space-y-6">
            <h2 className="text-base font-bold text-gray-900">Edit Profile Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full text-xs px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Headline / Professional Title
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Aspiring Frontend Engineer | Computer Science Undergrad"
                className="w-full text-xs px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Bio / About Me
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your technical interests, projects, and career aspirations..."
                className="w-full text-xs px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Resume URL / Document Link
              </label>
              <input
                type="url"
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="https://drive.google.com/your_resume_link or portfolio URL"
                className="w-full text-xs px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {resume && (
                <a
                  href={resume}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-xs text-blue-600 hover:underline mt-1.5"
                >
                  Verify Resume Link <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>

            {/* Skills Tag Management */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Technical Skills
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-md font-medium"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1.5 text-blue-400 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-sm">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="e.g. Next.js, Python, SQL"
                  className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg flex-1 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700"
                >
                  Add Skill
                </button>
              </div>
            </div>

            {/* Education History */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Education Background
              </label>
              {education.length > 0 && (
                <div className="space-y-2 mb-3">
                  {education.map((edu, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-slate-50/60 text-xs"
                    >
                      <div>
                        <p className="font-bold text-gray-800">{edu.degree}</p>
                        <p className="text-gray-500">
                          {edu.college} ({edu.startYear} - {edu.endYear})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEducation(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Education Section */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-dashed border-gray-300">
                <input
                  type="text"
                  placeholder="Degree (e.g. B.Tech CSE)"
                  value={degInput}
                  onChange={(e) => setDegInput(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-gray-300 rounded bg-white"
                />
                <input
                  type="text"
                  placeholder="College / University"
                  value={collegeInput}
                  onChange={(e) => setCollegeInput(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-gray-300 rounded bg-white"
                />
                <input
                  type="text"
                  placeholder="Start Year (2021)"
                  value={startYearInput}
                  onChange={(e) => setStartYearInput(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-gray-300 rounded bg-white"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="End Year (2025)"
                    value={endYearInput}
                    onChange={(e) => setEndYearInput(e.target.value)}
                    className="text-xs px-2.5 py-1.5 border border-gray-300 rounded bg-white flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddEducation}
                    className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded hover:bg-slate-900"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {isSaving ? "Saving..." : "Save Profile Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Task 6: Context-Aware Security & Login Activity History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3 mb-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-bold mb-1">
                <Shield className="w-3 h-3 text-indigo-600" />
                <span>Task 6 Account Security & Device Auditing</span>
              </div>
              <h3 className="text-base font-bold text-gray-900">
                Login Activity & Active Device Sessions
              </h3>
              <p className="text-xs text-gray-500">
                Track login timestamps, operating systems, browsers, and security verification logs.
              </p>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  setIsLoggingOutOther(true);
                  const res = await api.post("/auth/logout-other-devices");
                  toast.success(res.data.message || "Signed out from other devices");
                  fetchLoginHistory();
                } catch {
                  toast.error("Failed to sign out from other devices");
                } finally {
                  setIsLoggingOutOther(false);
                }
              }}
              disabled={isLoggingOutOther}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out From Other Devices</span>
            </button>
          </div>

          {/* Context-Aware Security Rule Notice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-xs">
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start space-x-2 text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Google Chrome Policy:</strong> Logins originating from Chrome require instant email OTP identity verification before access is authorized.
              </div>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 flex items-start space-x-2 text-amber-900">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Mobile Access Restriction:</strong> Mobile logins are strictly permitted only between <strong>10:00 AM and 1:00 PM IST</strong>.
              </div>
            </div>
          </div>

          {/* Login Logs Table */}
          {loginHistory.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">No login logs recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Device / OS</th>
                    <th className="py-2.5 px-3">Browser</th>
                    <th className="py-2.5 px-3">IP & Location</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loginHistory.map((log: any, idx: number) => {
                    const isMobile = log.deviceType === "mobile";
                    const isTablet = log.deviceType === "tablet";

                    return (
                      <tr key={log._id || idx} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-2 font-medium text-gray-900">
                            {isMobile ? (
                              <Smartphone className="w-4 h-4 text-purple-600" />
                            ) : isTablet ? (
                              <Tablet className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Monitor className="w-4 h-4 text-slate-700" />
                            )}
                            <span>
                              {log.os} ({log.deviceModel || log.deviceType})
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-gray-700">
                          {log.browser}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span>{log.ip}</span>
                            <span className="text-[10px] text-gray-400">({log.location})</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          {log.status === "success" ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                              SUCCESS
                            </span>
                          ) : log.status === "rejected_mobile_time" ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full font-bold text-[10px]">
                              BLOCKED (Mobile Time)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                              {log.status.toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
