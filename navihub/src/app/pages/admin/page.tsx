"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
	ArrowRight,
	Calendar,
	Check,
	Loader2,
	ShieldCheck,
	Trash2,
	FileText,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import NavbarWrapper from "../../components/NavbarWrapper";
import FooterWrapper from "../../components/FooterWrapper";

type AdminTab = "resources" | "events";

type PendingResource = {
	id: string;
	title: string;
	category: string | null;
	location: string | null;
	description: string | null;
	status: string | null;
	user_id: string | null;
};

type PendingEvent = {
	id: string;
	title: string;
	category: string | null;
	event_date: string | null;
	start_time: string | null;
	location_name: string | null;
	description: string | null;
	created_at: string;
	status: string | null;
	user_id: string | null;
	creator_name: string | null;
};

const fadeIn = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function AdminPage() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<AdminTab>("resources");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [processingId, setProcessingId] = useState<string | null>(null);
	const [pendingResources, setPendingResources] = useState<PendingResource[]>([]);
	const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);

	const withAdminAuth = useCallback(async () => {
		const { data } = await supabase.auth.getSession();
		const token = data.session?.access_token;
		if (!token) {
			throw new Error("Admin session not found");
		}
		return {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		};
	}, []);

	const loadPending = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const headers = await withAdminAuth();
			const res = await fetch("/api/admin/moderation", { headers, cache: "no-store" });
			const data = await res.json();

			if (!res.ok) {
				throw new Error(data?.error || "Failed to load pending submissions");
			}

			setPendingResources(data.pendingResources ?? []);
			setPendingEvents(data.pendingEvents ?? []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load moderation data");
		} finally {
			setLoading(false);
		}
	}, [withAdminAuth]);

	useEffect(() => {
		loadPending();
	}, [loadPending]);

	const handleModeration = async (target: "resource" | "event", itemId: string, action: "approve" | "reject") => {
		setProcessingId(itemId);
		setError(null);

		try {
			const headers = await withAdminAuth();
			const res = await fetch("/api/admin/moderation", {
				method: "POST",
				headers,
				body: JSON.stringify({ target, itemId, action }),
			});

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data?.error || "Moderation action failed");
			}

			if (target === "resource") {
				setPendingResources((prev) => prev.filter((item) => item.id !== itemId));
			} else {
				setPendingEvents((prev) => prev.filter((item) => item.id !== itemId));
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Moderation action failed");
		} finally {
			setProcessingId(null);
		}
	};

	const activeCount = useMemo(
		() => (activeTab === "resources" ? pendingResources.length : pendingEvents.length),
		[activeTab, pendingResources.length, pendingEvents.length]
	);

	const renderResourceList = () => {
		if (pendingResources.length === 0) {
			return (
				<div className="flex-1 bg-linear-to-b from-[#fdfaf7] to-white border border-dashed border-[#eae0d5] rounded-3xl p-10 text-center text-[#6b5a4e]! flex flex-col items-center justify-center min-h-75">
					<div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#eae0d5]/60">
						<FileText className="w-8 h-8 text-[#997e67]!" />
					</div>
					<p className="text-xl font-bold text-[#4a3b32]! mb-2">No Pending Resources</p>
					<p className="text-[#a3958a]! text-base">New resource submissions will appear here.</p>
				</div>
			);
		}

		return (
			<div className="space-y-4 max-h-140 overflow-y-auto pr-1">
				{pendingResources.map((item) => (
					<div key={item.id} className="bg-white border border-[#eae0d5] rounded-2xl p-6 shadow-sm">
						<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
							<div className="min-w-0">
								<h3 className="text-xl font-bold text-[#4a3b32]! mb-1 line-clamp-1">{item.title}</h3>
								<p className="text-[#6b5a4e]! text-sm mb-2 line-clamp-2">{item.description || "No description provided."}</p>
								<div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#a3958a]!">
									<span className="px-2.5 py-1 rounded-full bg-[#fdfaf7] border border-[#eae0d5]">{item.category || "Uncategorized"}</span>
									<span className="px-2.5 py-1 rounded-full bg-[#fdfaf7] border border-[#eae0d5]">{item.location || "Location not set"}</span>
									<span className="px-2.5 py-1 rounded-full bg-[#fdfaf7] border border-[#eae0d5]">Pending Review</span>
								</div>
							</div>

							<div className="shrink-0 flex items-center gap-2">
								<button
									onClick={() => handleModeration("resource", item.id, "approve")}
									disabled={processingId === item.id}
									className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
								>
									{processingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
									Accept
								</button>
								<button
									onClick={() => handleModeration("resource", item.id, "reject")}
									disabled={processingId === item.id}
									className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
								>
									<Trash2 className="w-4 h-4" />
									Reject
								</button>
							</div>
						</div>
					</div>
				))}
			</div>
		);
	};

	const renderEventList = () => {
		if (pendingEvents.length === 0) {
			return (
				<div className="flex-1 bg-linear-to-b from-[#fdfaf7] to-white border border-dashed border-[#eae0d5] rounded-3xl p-10 text-center text-[#6b5a4e]! flex flex-col items-center justify-center min-h-75">
					<div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#eae0d5]/60">
						<Calendar className="w-8 h-8 text-[#997e67]!" />
					</div>
					<p className="text-xl font-bold text-[#4a3b32]! mb-2">No Pending Events</p>
					<p className="text-[#a3958a]! text-base">New event suggestions will appear here.</p>
				</div>
			);
		}

		return (
			<div className="space-y-4 max-h-140 overflow-y-auto pr-1">
				{pendingEvents.map((item) => (
					<div key={item.id} className="bg-white border border-[#eae0d5] rounded-2xl p-6 shadow-sm">
						<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
							<div className="min-w-0">
								<h3 className="text-xl font-bold text-[#4a3b32]! mb-1 line-clamp-1">{item.title}</h3>
								<p className="text-[#6b5a4e]! text-sm mb-2 line-clamp-2">{item.description || "No description provided."}</p>
								<div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#a3958a]!">
									<span className="px-2.5 py-1 rounded-full bg-[#fdfaf7] border border-[#eae0d5]">{item.category || "Uncategorized"}</span>
									<span className="px-2.5 py-1 rounded-full bg-[#fdfaf7] border border-[#eae0d5]">{item.location_name || "Location not set"}</span>
									<span className="px-2.5 py-1 rounded-full bg-[#fdfaf7] border border-[#eae0d5]">{item.event_date || "Date TBD"} {item.start_time ? `at ${item.start_time}` : ""}</span>
									<span className="px-2.5 py-1 rounded-full bg-[#fdfaf7] border border-[#eae0d5]">By {item.creator_name || "Community Sponsored"}</span>
								</div>
							</div>

							<div className="shrink-0 flex items-center gap-2">
								<button
									onClick={() => handleModeration("event", item.id, "approve")}
									disabled={processingId === item.id}
									className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
								>
									{processingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
									Accept
								</button>
								<button
									onClick={() => handleModeration("event", item.id, "reject")}
									disabled={processingId === item.id}
									className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
								>
									<Trash2 className="w-4 h-4" />
									Reject
								</button>
							</div>
						</div>
					</div>
				))}
			</div>
		);
	};

	return (
		<>
			<NavbarWrapper />
		<div className="admin-page min-h-screen bg-[#fcfbf9] pt-4 pb-20 selection:bg-[#997e67]/20 flex flex-col">
			<div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
				<div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#997e67]/5 blur-[120px] rounded-full mix-blend-multiply" />
				<div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] bg-[#eae0d5]/30 blur-[120px] rounded-full mix-blend-multiply" />
			</div>

			<div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative z-10 flex-1 flex flex-col mt-2">
				<div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
					<div className="text-left">
						<h1 className="text-4xl md:text-5xl font-extrabold text-[#4a3b32]! tracking-tight">Admin Moderation Panel</h1>
						<p className="text-[#6b5a4e]! mt-3 text-lg max-w-2xl font-medium">
							Review incoming resource and event submissions before they appear publicly.
						</p>
					</div>
					<button
						onClick={() => router.push("/")}
						className="inline-flex items-center text-sm text-[#4a3b32]! font-bold hover:text-[#997e67]! transition-colors group md:self-start mt-2 md:mt-0 px-4 py-2 rounded-xl bg-white border border-[#eae0d5] shadow-sm"
					>
						<ArrowRight className="w-4 h-4 mr-2 rotate-180 transform group-hover:-translate-x-1 transition-transform" />
						Back to Home
					</button>
				</div>

				<motion.main
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.4 }}
					className="flex-1 w-full bg-white border border-[#eae0d5] rounded-3xl min-h-125 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative p-6 sm:p-8"
				>
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
						<div className="inline-flex p-1.5 rounded-2xl bg-[#fdfaf7] border border-[#eae0d5] w-fit">
							<button
								onClick={() => setActiveTab("resources")}
								className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
									activeTab === "resources"
										? "bg-white text-[#997e67] border border-[#eae0d5] shadow-sm"
										: "text-[#6b5a4e] hover:text-[#4a3b32]"
								}`}
							>
								Pending Resources ({pendingResources.length})
							</button>
							<button
								onClick={() => setActiveTab("events")}
								className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
									activeTab === "events"
										? "bg-white text-[#997e67] border border-[#eae0d5] shadow-sm"
										: "text-[#6b5a4e] hover:text-[#4a3b32]"
								}`}
							>
								Pending Events ({pendingEvents.length})
							</button>
						</div>

						<button
							onClick={loadPending}
							className="w-fit px-4 py-2.5 rounded-xl border border-[#eae0d5] text-[#6b5a4e] text-sm font-semibold hover:text-[#4a3b32] hover:bg-[#fdfaf7] transition"
						>
							Refresh Queue
						</button>
					</div>

					{error && (
						<div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-semibold">
							{error}
						</div>
					)}

					<div className="mb-4 text-xs font-bold uppercase tracking-wider text-[#a3958a]! inline-flex items-center gap-2">
						<ShieldCheck className="w-4 h-4" />
						{activeCount} pending item{activeCount === 1 ? "" : "s"}
					</div>

					{loading ? (
						<div className="flex items-center justify-center min-h-90">
							<Loader2 className="w-9 h-9 text-[#997e67] animate-spin" />
						</div>
					) : (
						<AnimatePresence mode="wait">
							<motion.div key={activeTab} variants={fadeIn} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
								{activeTab === "resources" ? renderResourceList() : renderEventList()}
							</motion.div>
						</AnimatePresence>
					)}
				</motion.main>
			</div>
		</div>
			<FooterWrapper />
			<style jsx global>{`
				.admin-page button,
				.admin-page a,
				.admin-page [role="button"] {
					cursor: pointer;
				}

				.admin-page button:disabled {
					cursor: not-allowed;
				}
			`}</style>
		</>
	);
}
