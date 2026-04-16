"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, Calendar, ShieldCheck,
  CheckCircle, XCircle, Loader2, ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../lib/useUser";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import "../../styles/account.css";

// Animation Variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
};

type TabId = "resources" | "events";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: "resources", label: "Pending Resources", icon: <FileText className="w-5 h-5" /> },
  { id: "events", label: "Pending Events", icon: <Calendar className="w-5 h-5" /> },
];

export default function AdminPanel() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("resources");
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  // Data states
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pendingResources, setPendingResources] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [resourcesFetched, setResourcesFetched] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsFetched, setEventsFetched] = useState(false);

  // Security check: only allow admin
  useEffect(() => {
    if (!loading && user) {
      if (user.email !== "admin@navihub.com") {
        router.push('/');
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || user.email !== "admin@navihub.com") return;
    
    if (activeTab === "resources" && !resourcesFetched && !loadingResources) {
      setLoadingResources(true);
      supabase.from("resources").select("*").eq("status", "pending").order("created_at", { ascending: false }).then(({ data }) => {
        if (data) setPendingResources(data);
        setResourcesFetched(true);
        setLoadingResources(false);
      });
    }

    if (activeTab === "events" && !eventsFetched && !loadingEvents) {
      setLoadingEvents(true);
      supabase.from("events").select("*").eq("status", "pending").order("created_at", { ascending: false }).then(({ data }) => {
        if (data) setPendingEvents(data);
        setEventsFetched(true);
        setLoadingEvents(false);
      });
    }
  }, [activeTab, user, resourcesFetched, loadingResources, eventsFetched, loadingEvents]);

  // Handle Approve/Reject
  const handleResourceStatus = async (id: string, newStatus: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("resources")
        .update({ status: newStatus })
        .eq("id", id);
      
      if (error) throw error;
      
      setPendingResources((prev) => prev.filter(r => r.id !== id));
      setMessage({ type: "success", text: `Resource has been ${newStatus}.` });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update resource." });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleEventStatus = async (id: string, newStatus: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ status: newStatus })
        .eq("id", id);
      
      if (error) throw error;
      
      setPendingEvents((prev) => prev.filter(e => e.id !== id));
      setMessage({ type: "success", text: `Event has been ${newStatus}.` });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update event." });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading || (user && user.email !== "admin@navihub.com")) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#997e67] animate-spin" />
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex flex-col items-center justify-center text-[#4a3b32]! gap-6">
        <p className="text-xl font-medium">Please sign in as Admin to view this panel.</p>
        <button 
          onClick={() => router.push('/pages/signin')}
          className="px-8 py-3 bg-[#997e67] text-white font-semibold rounded-2xl hover:bg-[#866d58] transition-colors shadow-md hover:shadow-lg"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "resources":
        return (
          <motion.div key="resources" variants={fadeIn} initial="hidden" animate="visible" exit={{ opacity: 0 }} className="p-8 sm:p-10 h-full flex flex-col relative w-full text-left">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-6 text-[#4a3b32]! tracking-tight flex items-center gap-3">
              Approve Resources
            </h2>
            
            {message && (
              <div className={`p-4 rounded-xl mb-6 text-sm font-semibold transition-all shadow-sm border ${
                message.type === 'success' 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {loadingResources ? (
              <div className="flex-1 flex items-center justify-center min-h-[300px]">
                <Loader2 className="w-8 h-8 text-[#997e67] animate-spin" />
              </div>
            ) : pendingResources.length > 0 ? (
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[500px] hide-scrollbar">
                {pendingResources.map(resource => (
                  <div key={resource.id} className="bg-white border border-[#eae0d5] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#4a3b32]! mb-1">{resource.title}</h3>
                        <p className="text-[#6b5a4e]! text-sm mb-2">{resource.description}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="bg-[#fdfaf7] text-[#997e67] px-3 py-1 rounded-full text-xs font-bold border border-[#eae0d5]">
                            {resource.category}
                          </span>
                          <span className="bg-[#fdfaf7] text-[#997e67] px-3 py-1 rounded-full text-xs font-bold border border-[#eae0d5]">
                            {resource.location}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button 
                          onClick={() => handleResourceStatus(resource.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button 
                          onClick={() => handleResourceStatus(resource.id, 'rejected')}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 bg-gradient-to-b from-[#fdfaf7] to-white border border-dashed border-[#eae0d5] rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
                <ShieldCheck className="w-12 h-12 text-[#997e67]/50 mb-4" />
                <p className="text-xl font-bold text-[#4a3b32]! mb-2">No Pending Resources</p>
                <p className="text-[#a3958a]! max-w-sm text-base">You have caught up with all user submissions!</p>
              </div>
            )}
          </motion.div>
        );
      
      case "events":
        return (
          <motion.div key="events" variants={fadeIn} initial="hidden" animate="visible" exit={{ opacity: 0 }} className="p-8 sm:p-10 h-full flex flex-col relative w-full text-left">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-6 text-[#4a3b32]! tracking-tight flex items-center gap-3">
              Approve Events
            </h2>
            
            {message && (
              <div className={`p-4 rounded-xl mb-6 text-sm font-semibold transition-all shadow-sm border ${
                message.type === 'success' 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {loadingEvents ? (
              <div className="flex-1 flex items-center justify-center min-h-[300px]">
                <Loader2 className="w-8 h-8 text-[#997e67] animate-spin" />
              </div>
            ) : pendingEvents.length > 0 ? (
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[500px] hide-scrollbar">
                {pendingEvents.map(event => (
                  <div key={event.id} className="bg-white border border-[#eae0d5] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#4a3b32]! mb-1">{event.title}</h3>
                        <p className="text-[#6b5a4e]! text-sm mb-2">{event.description}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="bg-[#fdfaf7] text-[#997e67] px-3 py-1 rounded-full text-xs font-bold border border-[#eae0d5]">
                            {event.category}
                          </span>
                          <span className="bg-[#fdfaf7] text-[#997e67] px-3 py-1 rounded-full text-xs font-bold border border-[#eae0d5]">
                            {event.location_name}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button 
                          onClick={() => handleEventStatus(event.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button 
                          onClick={() => handleEventStatus(event.id, 'rejected')}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 bg-gradient-to-b from-[#fdfaf7] to-white border border-dashed border-[#eae0d5] rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
                <Calendar className="w-12 h-12 text-[#997e67]/50 mb-4" />
                <p className="text-xl font-bold text-[#4a3b32]! mb-2">No Pending Events</p>
                <p className="text-[#a3958a]! max-w-sm text-base">You have caught up with all user submissions!</p>
              </div>
            )}
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] pt-28 pb-12 font-sans overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 md:mb-10 max-w-2xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm text-[#a3958a] hover:text-[#4a3b32] font-bold transition-colors group md:mt-2"
          >
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
          <div className="text-center md:text-left flex-1 md:pl-8">
            <h1 className="text-4xl md:text-5xl font-black mb-4 text-[#4a3b32]! tracking-tighter">
              Admin Panel
            </h1>
            <p className="text-lg text-[#6b5a4e]! leading-relaxed">
              Manage approvals and moderation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-3 bg-white/50 backdrop-blur-md rounded-[2rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#eae0d5]/60 sticky top-32">
            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 hide-scrollbar scroll-smooth">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative flex items-center gap-3.5 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 w-full text-left shrink-0
                      ${isActive 
                        ? "text-white bg-gradient-to-br from-[#997e67] to-[#866d58] shadow-md hover:shadow-lg! scale-[1.02]" 
                        : "text-[#6b5a4e] opacity-80 hover:opacity-100 hover:bg-white hover:shadow-sm"
                      }
                    `}
                  >
                    <span className="relative z-10 flex items-center justify-center p-1.5 rounded-lg bg-white/10 shrink-0">
                      {tab.icon}
                    </span>
                    <span className="relative z-10 leading-none tracking-wide">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-9 bg-white rounded-[2rem] lg:min-h-[600px] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-[#eae0d5]/60 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#997e67]/[0.02] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
