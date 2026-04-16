"use client";

import React, { useState, useEffect } from "react";
import { 
  User, FileText, Calendar, ShieldCheck, Bell, 
  ChevronRight, Save, Loader2, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../lib/useUser";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import "../../styles/account.css";

// Animation Variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" as const } }
};

type TabId = "profile" | "posts" | "events" | "approvals" | "notifications";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: "profile", label: "Profile Settings", icon: <User className="w-5 h-5" /> },
  { id: "posts", label: "My Posts", icon: <FileText className="w-5 h-5" /> },
  { id: "events", label: "Signed-Up Events", icon: <Calendar className="w-5 h-5" /> },
  { id: "approvals", label: "Approvals & Moderation", icon: <ShieldCheck className="w-5 h-5" /> },
  { id: "notifications", label: "GC Notifications", icon: <Bell className="w-5 h-5" /> },
];

export default function AccountPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Data states
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsFetched, setPostsFetched] = useState(false);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsFetched, setEventsFetched] = useState(false);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [myNotifications, setMyNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsFetched, setNotificationsFetched] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [myApprovals, setMyApprovals] = useState<any[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [approvalsFetched, setApprovalsFetched] = useState(false);

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    if (activeTab === "posts" && !postsFetched && !loadingPosts) {
      setLoadingPosts(true);
      supabase.from("navilink_posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
        if (data) setMyPosts(data);
        setPostsFetched(true);
        setLoadingPosts(false);
      });
    }
    
    if (activeTab === "events" && !eventsFetched && !loadingEvents) {
      setLoadingEvents(true);
      supabase.from("event_signups").select("event_id").eq("user_id", user.id).then(({ data: signups }) => {
        if (signups && signups.length > 0) {
          const eventIds = signups.map(s => s.event_id);
          supabase.from("events").select("*").in("id", eventIds).order("event_date", { ascending: true }).then(({ data: events }) => {
             if (events) setMyEvents(events);
             setEventsFetched(true);
             setLoadingEvents(false);
          });
        } else {
          setEventsFetched(true);
          setLoadingEvents(false);
        }
      });
    }
    
    if (activeTab === "approvals" && !approvalsFetched && !loadingApprovals) {
      setLoadingApprovals(true);

      const fetchApprovals = async () => {
        const { data: resources } = await supabase.from("resources").select("id, title, description, status, created_at").eq("user_id", user.id).in("status", ["pending", "rejected", "approved"]);
        const { data: events } = await supabase.from("events").select("id, title, description, status, created_at").eq("user_id", user.id).in("status", ["pending", "rejected", "approved"]);
        
        const combined = [
          ...(resources || []).map(r => ({ ...r, type: "Resource" })),
          ...(events || []).map(e => ({ ...e, type: "Event" }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        if (combined.length > 0) setMyApprovals(combined);
        setApprovalsFetched(true);
        setLoadingApprovals(false);
      };
      
      fetchApprovals();
    }

    if (activeTab === "notifications" && !notificationsFetched && !loadingNotifications) {
      setLoadingNotifications(true);
      supabase.from("event_signups").select("event_id").eq("user_id", user.id).then(({ data: signups }) => {
        if (signups && signups.length > 0) {
          const eventIds = signups.map(s => s.event_id);
          supabase.from("event_messages").select("*").in("event_id", eventIds).neq("user_id", user.id).order("created_at", { ascending: false }).limit(8).then(({ data: msgs }) => {
            if (msgs) setMyNotifications(msgs);
            setNotificationsFetched(true);
            setLoadingNotifications(false);
          });
        } else {
          setNotificationsFetched(true);
          setLoadingNotifications(false);
        }
      });
    }
  }, [activeTab, user, postsFetched, loadingPosts, eventsFetched, loadingEvents, notificationsFetched, loadingNotifications, approvalsFetched, loadingApprovals]);

  // If user is not logged in after loading, you might want to redirect.
  // For now, we'll just show a placeholder or loading state.
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#997e67] animate-spin" />
      </div>
    );
  }

  if (!user && !loading) {
    // If there's a routing error or user is unauthenticated, show a neat error and home button
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex flex-col items-center justify-center text-[#4a3b32]! gap-6">
        <p className="text-xl font-medium">Please sign in to view your account.</p>
        <button 
          onClick={() => router.push('/pages/signin')}
          className="px-8 py-3 bg-[#997e67] text-white font-semibold rounded-2xl hover:bg-[#866d58] transition-colors shadow-md hover:shadow-lg"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);

    const updates: { data?: { full_name?: string }; password?: string } = {};
    let shouldUpdate = false;

    if (fullName && fullName !== user?.user_metadata?.full_name) {
      updates.data = { full_name: fullName };
      shouldUpdate = true;
    }

    if (password) {
      if (password.length < 6) {
        setMessage({ type: "error", text: "Password must be at least 6 characters." });
        setIsUpdating(false);
        return;
      }
      if (password !== confirmPassword) {
        setMessage({ type: "error", text: "Passwords do not match." });
        setIsUpdating(false);
        return;
      }
      updates.password = password;
      shouldUpdate = true;
    }

    if (!shouldUpdate) {
      setMessage({ type: "error", text: "No changes made." });
      setIsUpdating(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage({ type: "error", text: err.message || "Failed to update profile." });
      } else {
        setMessage({ type: "error", text: "Failed to update profile." });
      }
    } finally {
      setIsUpdating(false);
      // Auto-clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <motion.div 
            key="profile"
            variants={fadeIn} initial="hidden" animate="visible" exit={{ opacity: 0 }}
            className="p-8 sm:p-10 max-w-3xl"
          >
            <h2 className="text-2xl md:text-3xl font-extrabold mb-6 text-[#4a3b32]! tracking-tight flex items-center gap-3">
              Profile Settings
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

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#6b5a4e]!">Email Address <span className="text-xs font-medium text-[#a3958a]! ml-1">(Read Only)</span></label>
                <div className="w-full bg-[#fdfaf7] border border-[#eae0d5] rounded-xl px-4 py-3.5 text-[#a3958a]! cursor-not-allowed shadow-inner shadow-black/2 text-base flex items-center">
                   <div className="w-2 h-2 rounded-full bg-[#eae0d5] mr-3" />
                  {user?.email}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#6b5a4e]!">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="account-input text-base py-3.5 px-4 rounded-xl border border-[#eae0d5] focus:border-[#997e67] bg-white w-full text-[#4a3b32]! placeholder-[#a3958a]! transition-all outline-none focus:ring-4 focus:ring-[#997e67]/10"
                />
              </div>

              <div className="border-t border-[#eae0d5] pt-8 mt-8 relative">
                <div className="absolute top-0 right-0 w-32 h-px bg-linear-to-l from-transparent to-[#eae0d5]" />
                <h3 className="text-lg font-bold text-[#4a3b32]! mb-6">Security & Password</h3>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#6b5a4e]!">New Password</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="account-input text-base py-3.5 px-4 rounded-xl border border-[#eae0d5] focus:border-[#997e67] bg-white w-full text-[#4a3b32]! placeholder-[#a3958a]! transition-all outline-none focus:ring-4 focus:ring-[#997e67]/10 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#6b5a4e]!">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Must match new password"
                      className="account-input text-base py-3.5 px-4 rounded-xl border border-[#eae0d5] focus:border-[#997e67] bg-white w-full text-[#4a3b32]! placeholder-[#a3958a]! transition-all outline-none focus:ring-4 focus:ring-[#997e67]/10 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isUpdating}
                  className="bg-[#997e67] hover:bg-[#866d58] text-white font-semibold py-3 px-6 rounded-xl flex items-center transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        );
      
      case "posts":
        return (
          <motion.div key="posts" variants={fadeIn} initial="hidden" animate="visible" exit={{ opacity: 0 }} className="p-8 sm:p-10 h-full flex flex-col relative w-full text-left">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-6 text-[#4a3b32]! tracking-tight">My Posts</h2>
            
            {loadingPosts ? (
              <div className="flex-1 flex items-center justify-center min-h-75"><Loader2 className="w-8 h-8 text-[#997e67] animate-spin" /></div>
            ) : myPosts.length > 0 ? (
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-125 hide-scrollbar">
                {myPosts.map(post => (
                  <div key={post.id} className="bg-white border border-[#eae0d5] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#4a3b32]! mb-1">{post.title}</h3>
                        {post.content && <p className="text-[#6b5a4e]! text-sm line-clamp-2 pr-4">{post.content}</p>}
                      </div>
                      <span className="shrink-0 bg-[#fdfaf7] text-[#997e67]! px-3 py-1 rounded-full text-xs font-bold border border-[#eae0d5]">NaviLink</span>
                    </div>
                    <div className="mt-4 flex items-center gap-3 text-xs text-[#a3958a]! font-medium">
                      <span>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {post.category_id && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-[#eae0d5]" />
                          <span className="capitalize">{post.category_id.replace('-', ' ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 bg-linear-to-b from-[#fdfaf7] to-white border border-dashed border-[#eae0d5] rounded-3xl p-10 text-center text-[#6b5a4e]! flex flex-col items-center justify-center min-h-75 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#997e67]/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#eae0d5]/60 relative z-10">
                  <FileText className="w-8 h-8 text-[#997e67]!" />
                </div>
                <p className="text-xl font-bold text-[#4a3b32]! mb-2 relative z-10">No Posts Yet</p>
                <p className="text-[#a3958a]! mb-8 max-w-sm text-base leading-relaxed relative z-10">You haven&apos;t created any events or resources to share with the community yet.</p>
                <button onClick={() => router.push('/pages/NaviLink')} className="text-sm text-[#997e67]! font-bold hover:text-[#866d58]! transition-colors inline-flex items-center group/btn relative z-10 bg-white px-5 py-2.5 rounded-xl shadow-sm border border-[#eae0d5] hover:shadow cursor-pointer">
                  Create one now <ArrowRight className="w-4 h-4 ml-1.5 transform group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </motion.div>
        );

      case "events":
        return (
          <motion.div key="events" variants={fadeIn} initial="hidden" animate="visible" exit={{ opacity: 0 }} className="p-8 sm:p-10 h-full flex flex-col relative text-left">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-6 text-[#4a3b32]! tracking-tight">Signed-Up Events</h2>
            
            {loadingEvents ? (
              <div className="flex-1 flex items-center justify-center min-h-75"><Loader2 className="w-8 h-8 text-[#997e67] animate-spin" /></div>
            ) : myEvents.length > 0 ? (
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-125 hide-scrollbar">
                {myEvents.map(event => (
                  <div key={event.id} className="bg-white border border-[#eae0d5] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#4a3b32]! mb-1">{event.title}</h3>
                      <p className="text-[#a3958a]! text-sm font-medium">
                        {new Date(event.event_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} at {event.start_time}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-3">
                      <div className="flex flex-col items-end text-sm font-bold text-[#997e67]!">
                        <span>{event.location_name || "NYC"}</span>
                        {event.is_virtual && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100 mt-1">Virtual</span>}
                      </div>
                      <button onClick={() => router.push(`/pages/events`)} className="p-2 bg-[#fdfaf7] text-[#997e67] rounded-xl hover:bg-[#997e67] hover:text-white transition-colors border border-[#eae0d5] hover:border-transparent">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 bg-linear-to-b from-[#fdfaf7] to-white border border-dashed border-[#eae0d5] rounded-3xl p-10 text-center text-[#6b5a4e]! flex flex-col items-center justify-center min-h-75 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-[#997e67]/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#eae0d5]/60 relative z-10">
                  <Calendar className="w-8 h-8 text-[#997e67]!" />
                </div>
                <p className="text-xl font-bold text-[#4a3b32]! mb-2 relative z-10">No Registered Events</p>
                <p className="text-[#a3958a]! mb-8 max-w-sm text-base leading-relaxed relative z-10">You haven&apos;t signed up for any upcoming events. Keep an eye out for what&apos;s new!</p>
                <button onClick={() => router.push('/pages/events')} className="text-sm text-[#997e67]! font-bold hover:text-[#866d58]! transition-colors inline-flex items-center group/btn relative z-10 bg-white px-5 py-2.5 rounded-xl shadow-sm border border-[#eae0d5] hover:shadow cursor-pointer">
                  Explore Events <ArrowRight className="w-4 h-4 ml-1.5 transform group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </motion.div>
        );

      case "approvals":
        return (
          <motion.div key="approvals" variants={fadeIn} initial="hidden" animate="visible" exit={{ opacity: 0 }} className="p-8 sm:p-10 h-full flex flex-col relative text-left">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-6 text-[#4a3b32]! tracking-tight flex items-center gap-2">
              Approvals <span className="text-[#a3958a]! text-lg font-medium">&bull; Moderation</span>
            </h2>
            {loadingApprovals ? (
              <div className="flex-1 flex items-center justify-center min-h-75"><Loader2 className="w-8 h-8 text-[#997e67] animate-spin" /></div>
            ) : myApprovals.length > 0 ? (
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-125 hide-scrollbar">
                {myApprovals.map(approval => {
                  let statusColor = "bg-yellow-50 text-yellow-700 border-yellow-200";
                  if (approval.status === "approved") statusColor = "bg-green-50 text-green-700 border-green-200";
                  if (approval.status === "rejected") statusColor = "bg-red-50 text-red-700 border-red-200";
                  
                  return (
                    <div key={approval.id} className="bg-white border border-[#eae0d5] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-[#4a3b32]! mb-1">{approval.title}</h3>
                          <p className="text-[#6b5a4e]! text-sm line-clamp-2">{approval.description}</p>
                        </div>
                        <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold border capitalize ${statusColor}`}>
                          {approval.status || "pending"}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center gap-3 text-xs text-[#a3958a]! font-medium">
                        <span>{new Date(approval.created_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="w-1 h-1 rounded-full bg-[#eae0d5]" />
                        <span className="capitalize">{approval.type || "Submission"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 bg-linear-to-b from-[#fdfaf7] to-white border border-dashed border-[#eae0d5] rounded-3xl p-10 text-center text-[#6b5a4e]! flex flex-col items-center justify-center min-h-75 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#997e67]/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#eae0d5]/60 relative z-10">
                  <ShieldCheck className="w-8 h-8 text-[#997e67]!" />
                </div>
                <p className="text-xl font-bold text-[#4a3b32]! mb-2 relative z-10">Nothing to Review</p>
                <p className="text-[#a3958a]! text-base mb-2 relative z-10">No posts currently pending moderation.</p>
                <p className="text-xs mt-2 text-[#a3958a]! opacity-80 font-medium bg-[#fcfbf9] px-3 py-1 rounded-full border border-[#eae0d5] inline-block relative z-10">Pending approval statuses will appear here</p>
              </div>
            )}
          </motion.div>
        );

      case "notifications":
        return (
          <motion.div key="notifications" variants={fadeIn} initial="hidden" animate="visible" exit={{ opacity: 0 }} className="p-8 sm:p-10 h-full flex flex-col relative text-left">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#4a3b32]! tracking-tight">GC Notifications</h2>
              <span className="bg-[#997e67]/10 text-[#997e67]! text-xs font-bold px-3 py-1 rounded-full border border-[#997e67]/20">{myNotifications.length > 0 ? myNotifications.length : '0'} Unread</span>
            </div>
            
            {loadingNotifications ? (
              <div className="flex-1 flex items-center justify-center min-h-75"><Loader2 className="w-8 h-8 text-[#997e67] animate-spin" /></div>
            ) : myNotifications.length > 0 ? (
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-125 hide-scrollbar">
                {myNotifications.map(notif => {
                   const eventTitle = myEvents.find(e => e.id === notif.event_id)?.title || "An Event";
                   return (
                     <div key={notif.id} className="bg-white border border-[#eae0d5] rounded-2xl p-5 shadow-sm hover:shadow-md flex items-start gap-4">
                       <div className="w-10 h-10 bg-[#997e67]/10 rounded-full flex items-center justify-center shrink-0">
                         <Bell className="w-4 h-4 text-[#997e67]!" />
                       </div>
                       <div className="flex-1">
                         <p className="text-sm text-[#a3958a]! mb-1">New message in <span className="font-bold text-[#4a3b32]!">{eventTitle}</span></p>
                         <p className="text-[#6b5a4e]! font-medium line-clamp-2 text-sm bg-[#fcfbf9] px-3 py-2 rounded-lg border border-[#eae0d5]/50">&quot;{notif.message}&quot;</p>
                         <p className="text-[10px] text-[#a3958a]!/80 mt-2 font-bold uppercase tracking-wider">{new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(notif.created_at).toLocaleDateString()}</p>
                       </div>
                     </div>
                   );
                })}
              </div>
            ) : (
              <div className="flex-1 bg-linear-to-b from-[#fdfaf7] to-white border border-dashed border-[#eae0d5] rounded-3xl p-10 text-center text-[#6b5a4e]! flex flex-col items-center justify-center min-h-75 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-[#997e67]/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#eae0d5]/60 relative z-10">
                  <Bell className="w-8 h-8 text-[#997e67]!" />
                </div>
                <p className="text-xl font-bold text-[#4a3b32]! mb-2 relative z-10">All Caught Up!</p>
                <p className="text-[#a3958a]! text-base mb-4 relative z-10 max-w-xs">No new messages from your event group chats. You&apos;re completely up to date.</p>
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div 
      initial={{ x: "-100vw" }}
      animate={{ x: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen bg-[#fcfbf9] pt-4 pb-20 selection:bg-[#997e67]/20 flex flex-col"
    >
      
      {/* Background Decor - minimal light theme decor */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#997e67]/5 blur-[120px] rounded-full mix-blend-multiply" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] bg-[#eae0d5]/30 blur-[120px] rounded-full mix-blend-multiply" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative z-10 flex-1 flex flex-col mt-2">
        
        {/* Header Section */}
        <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#4a3b32]! tracking-tight font-sans drop-shadow-sm">
              Account Dashboard
            </h1>
            <p className="text-[#6b5a4e]! mt-3 text-lg max-w-2xl font-medium">
              Manage your profile, track your events, and view your active posts.
            </p>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="inline-flex items-center text-sm text-[#a3958a]! font-bold hover:text-[#4a3b32]! transition-colors group md:self-start mt-2 md:mt-0"
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180 transform group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start flex-1">
          
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-80 shrink-0 bg-white/80 backdrop-blur-md border border-[#eae0d5] rounded-3xl overflow-hidden sticky top-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hidden lg:flex flex-col">
            <div className="p-8 border-b border-[#eae0d5]/60 flex items-center gap-4 bg-[#fdfaf7]/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-[#997e67] to-[#CCBEB1] z-10" />
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#eae0d5] flex items-center justify-center text-[#997e67] font-extrabold text-xl shadow-sm z-20 shrink-0">
                {(user?.user_metadata?.full_name || user?.email || "?").charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden z-20 flex flex-col justify-center">
                <h3 className="text-[#4a3b32]! font-bold text-lg truncate tracking-tight">
                  {user?.user_metadata?.full_name || "User"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <p className="text-[#a3958a]! text-xs truncate font-medium">{user?.email}</p>
                </div>
              </div>
            </div>
            
            <nav className="p-4 space-y-1 flex-1">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden
                      ${isActive 
                        ? 'text-[#997e67]' 
                        : 'text-[#6b5a4e] hover:bg-[#fdfaf7] hover:text-[#4a3b32]'
                      }
                    `}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 bg-[#fdfaf7] border border-[#eae0d5]/80 shadow-sm rounded-xl"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <div className="flex items-center gap-3.5 relative z-10">
                      <span className={`
                         p-2 rounded-lg transition-all duration-300
                         ${isActive ? 'bg-white text-[#997e67] shadow-sm border border-[#eae0d5]/50 scale-105' : 'text-[#a3958a] group-hover:text-[#997e67]'}
                      `}>
                        {tab.icon}
                      </span>
                      <span className={`font-semibold text-sm ${isActive ? 'text-[#997e67]' : ''}`}>
                        {tab.label}
                      </span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-[#997e67] relative z-10" />}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Mobile Tab Selector */}
          <div className="lg:hidden w-full overflow-x-auto pb-4 hide-scrollbar">
            <div className="flex gap-2 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-[#eae0d5] shadow-sm w-max">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap text-sm
                      ${isActive 
                        ? 'bg-[#fdfaf7] border border-[#eae0d5]/80 text-[#997e67] shadow-sm font-semibold' 
                        : 'border border-transparent text-[#6b5a4e] hover:bg-[#fdfaf7] font-medium'
                      }
                    `}
                  >
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {React.cloneElement(tab.icon as React.ReactElement<any>, { className: "w-4 h-4" })}
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <motion.main 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1 w-full bg-white border border-[#eae0d5] rounded-3xl min-h-125 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative"
          >
            {/* Subtle inner top highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#eae0d5] to-transparent opacity-50" />
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </motion.main>
          
        </div>
      </div>
    </motion.div>
  );
}
