import Footer from "@/Components/Fotter";
import Navbar from "@/Components/Navbar";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { store } from "../store/store";
import { Provider, useDispatch, useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import { login, logout, selectuser, setToken } from "@/Feature/Userslice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/utils/api";
import { I18nProvider } from "@/utils/i18n";

function GlobalRealtimeListener() {
  const user = useSelector(selectuser);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to real-time socket server
    const socket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[SOCKET] Connected to real-time server:", socket.id);
      if (user && user.role === "company") {
        const companyName = user.profile?.companyName || user.name;
        socket.emit("join_company", companyName);
        socket.emit("join_company", user.id || user._id);
      }
    });

    // Listen for new application notifications (for companies)
    socket.on("new_application", (data: any) => {
      if (user && (user.role === "company" || user.role === "admin")) {
        const candidateName = data.user?.name || "A candidate";
        const roleTitle = data.title || data.Application?.title || "your opportunity";
        toast.info(
          `🔔 New Application Received! ${candidateName} applied for "${roleTitle}"`,
          {
            position: "top-right",
            autoClose: 6000,
            theme: "colored",
          }
        );
      }
    });

    // Listen for status updates (for students)
    socket.on("application_status_updated", (data: any) => {
      if (user && user.role === "student") {
        const myId = user.id || user._id;
        if (
          (data.user && (data.user._id === myId || data.user.id === myId)) ||
          data.user?.email === user.email
        ) {
          const status = data.status?.toUpperCase();
          if (status === "ACCEPTED") {
            toast.success(
              `🎉 Congratulations! Your application for "${data.title}" was ACCEPTED!`,
              { position: "top-center", autoClose: 8000, theme: "colored" }
            );
          } else if (status === "REJECTED") {
            toast.warn(
              `Application Update: Your application for "${data.title}" was not selected.`,
              { position: "top-center", autoClose: 6000 }
            );
          }
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return null;
}

function AuthInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedUser = localStorage.getItem("internshala_user");
        const savedToken = localStorage.getItem("internshala_token");
        if (savedUser && savedToken) {
          dispatch(login(JSON.parse(savedUser)));
          dispatch(setToken(savedToken));
        }
      } catch (err) {
        console.error("Error restoring session:", err);
      }
    }
  }, [dispatch]);

  return null;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <I18nProvider>
        <AuthInitializer />
        <GlobalRealtimeListener />
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 overflow-x-hidden">
          <ToastContainer position="top-right" autoClose={4000} />
          <Navbar />
          <main className="flex-grow">
            <Component {...pageProps} />
          </main>
          <Footer />
        </div>
      </I18nProvider>
    </Provider>
  );
}
