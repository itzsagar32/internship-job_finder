import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ShieldCheck, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import api from "@/utils/api";
import { useDispatch } from "react-redux";
import { login, setToken } from "@/Feature/Userslice";
import { toast } from "react-toastify";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/admin/adminlogin", {
        username,
        password,
      });

      if (res.data.token) {
        dispatch(login(res.data.user));
        dispatch(setToken(res.data.token));
        toast.success("Admin authenticated successfully!");
        router.push("/adminpanel");
      } else {
        toast.error("Invalid response from server");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.error || "Invalid administrator credentials"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 max-w-md w-full rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Administrator Gateway
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Access restricted to system moderators and portal supervisors.
          </p>
        </div>

        
        
        

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Admin Username / Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=""
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Security Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <span>{loading ? "Authenticating..." : "Authorize Access"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-700/60 text-center">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition"
          >
            ← Return to Candidate Portal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
