"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type TabType = "inbox" | "sent";
type CursorDirection = "next" | "prev";

interface MailAttachment {
  id?: string;
  filename?: string;
  content_type?: string;
  size?: number;
}

interface MailItem {
  id: string;
  from?: string;
  to?: string[];
  created_at?: string;
  subject?: string;
  cc?: string[];
  bcc?: string[];
  reply_to?: string[];
  message_id?: string;
  is_read?: boolean;
  is_starred?: boolean;
  text?: string;
  html?: string;
  attachments?: MailAttachment[];
}

interface MailDetail {
  id?: string;
  from?: string;
  to?: string[];
  created_at?: string;
  subject?: string;
  text?: string;
  html?: string;
  attachments?: MailAttachment[];
}

interface MailListResponse {
  data?: MailItem[];
  has_more?: boolean;
  first_id?: string | null;
  last_id?: string | null;
  error?: string;
}

export default function MailboxPage() {
  const params = useParams();
  const campusId = String(params.campusId || "");

  const [activeTab, setActiveTab] = useState<TabType>("inbox");
  const [adminToken, setAdminToken] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [listError, setListError] = useState("");

  const [mails, setMails] = useState<MailItem[]>([]);
  const [selectedMailId, setSelectedMailId] = useState<string>("");
  const [selectedDetail, setSelectedDetail] = useState<MailDetail | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [hasMoreForward, setHasMoreForward] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [previousCursors, setPreviousCursors] = useState<string[]>([]);

  const [showCompose, setShowCompose] = useState(false);
  const [composeMode, setComposeMode] = useState<"new" | "reply">("new");
  const [senderPrefix, setSenderPrefix] = useState("");
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedPrefix = window.localStorage.getItem("socio_mail_sender_prefix") || "";
    if (savedPrefix) setSenderPrefix(savedPrefix);
  }, []);

  const formatDate = useCallback((value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  }, []);

  const getDisplayName = useCallback(
    (mail: MailItem) =>
      activeTab === "inbox"
        ? mail.from || "Unknown"
        : (mail.to || []).join(", ") || "Unknown",
    [activeTab]
  );

  const getPreview = useCallback((mail: MailItem) => {
    const source = String(mail.text || mail.html || "");
    const cleaned = source.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (cleaned) return cleaned;
    return activeTab === "inbox" ? mail.message_id || "Received email" : "Sent email";
  }, [activeTab]);

  const filteredMails = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return mails;
    return mails.filter((mail: MailItem) => {
      const haystack = [
        mail.subject,
        mail.from,
        (mail.to || []).join(" "),
        mail.message_id,
        getPreview(mail),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [mails, searchQuery, getPreview]);

  const selectedMail = useMemo(
    () => filteredMails.find((mail: MailItem) => mail.id === selectedMailId) || null,
    [filteredMails, selectedMailId]
  );

  const unreadCount = useMemo(
    () => mails.filter((mail: MailItem) => !mail.is_read).length,
    [mails]
  );

  const fetchMailDetail = useCallback(async (tab: TabType, emailId: string, token: string) => {
    setIsLoadingDetail(true);
    try {
      const endpoint =
        tab === "inbox"
          ? `/api/admin/mailbox/received/${emailId}`
          : `/api/admin/mailbox/sent/${emailId}`;

      const response = await fetch(endpoint, {
        headers: {
          "x-admin-password": token,
        },
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = payload?.error || "Failed to load email detail";
        throw new Error(message);
      }

      setSelectedDetail(payload?.data || null);
    } catch {
      setSelectedDetail(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const fetchMailList = useCallback(
    async (
      tab: TabType,
      token: string,
      options?: {
        direction?: CursorDirection;
        cursor?: string | null;
        resetHistory?: boolean;
      }
    ) => {
      setIsLoadingList(true);
      setListError("");

      try {
        const params = new URLSearchParams({ limit: "35" });
        if (options?.direction === "next" && options.cursor) {
          params.set("after", options.cursor);
        }
        if (options?.direction === "prev" && options.cursor) {
          params.set("before", options.cursor);
        }

        const endpoint =
          tab === "inbox"
            ? `/api/admin/mailbox/received?${params.toString()}`
            : `/api/admin/mailbox/sent?${params.toString()}`;

        const response = await fetch(endpoint, {
          headers: {
            "x-admin-password": token,
          },
        });

        const payload = (await response.json().catch(() => ({}))) as MailListResponse;

        if (!response.ok) {
          const message = payload?.error || "Failed to load mailbox";
          throw new Error(message);
        }

        const items = Array.isArray(payload?.data) ? payload.data : [];
        setMails(items);
        setHasMoreForward(Boolean(payload?.has_more));
        setNextCursor(payload?.last_id || null);

        if (options?.resetHistory) {
          setPreviousCursors([]);
        }

        if (items.length > 0) {
          const firstId = items[0].id;
          setSelectedMailId(firstId);
          void fetchMailDetail(tab, firstId, token);
        } else {
          setSelectedMailId("");
          setSelectedDetail(null);
        }
      } catch (error) {
        setListError(error instanceof Error ? error.message : "Failed to load mailbox");
        setMails([]);
        setSelectedMailId("");
        setSelectedDetail(null);
      } finally {
        setIsLoadingList(false);
      }
    },
    [fetchMailDetail]
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    const token = passwordInput.trim();
    if (!token) {
      setAuthError("Enter admin password.");
      return;
    }

    try {
      const probe = await fetch("/api/admin/mailbox/received?limit=1", {
        headers: {
          "x-admin-password": token,
        },
      });

      const payload = (await probe.json().catch(() => ({}))) as { error?: string };

      if (probe.status === 401) {
        setAuthError("Invalid password.");
        return;
      }

      if (!probe.ok) {
        setAuthError(payload?.error || "Mailbox API unavailable. Check Resend receiving setup.");
        return;
      }

      setAdminToken(token);
      setIsAuthenticated(true);
      await fetchMailList("inbox", token, { resetHistory: true });
    } catch {
      setAuthError("Could not connect to mailbox API.");
    }
  };

  const onTabChange = async (tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery("");
    await fetchMailList(tab, adminToken, { resetHistory: true });
  };

  const openMail = async (id: string) => {
    setSelectedMailId(id);
    const selected = mails.find((mail: MailItem) => mail.id === id);
    await fetchMailDetail(activeTab, id, adminToken);

    if (selected && !selected.is_read) {
      void updateMailState(id, { isRead: true });
    }
  };

  const resetComposeForm = () => {
    setComposeTo("");
    setComposeCc("");
    setComposeBcc("");
    setComposeSubject("");
    setComposeBody("");
  };

  const openCompose = () => {
    resetComposeForm();
    setComposeMode("new");
    setShowCompose(true);
  };

  const extractEmailAddress = (raw: string): string => {
    const match = raw.match(/<([^>]+)>/);
    if (match?.[1]) return match[1].trim();
    return raw.trim();
  };

  const handleReply = () => {
    if (!selectedMail) return;
    const toEmail = extractEmailAddress(String(selectedMail.from || ""));
    const safeSubject = String(selectedMail.subject || "").trim();
    const replySubject = /^re:/i.test(safeSubject) ? safeSubject : `Re: ${safeSubject || "(No subject)"}`;
    const originalText = String(selectedDetail?.text || "").trim();
    const quoted = originalText
      ? `\n\n--- Original message ---\n${originalText}`
      : "";

    setComposeTo(toEmail);
    setComposeCc("");
    setComposeBcc("");
    setComposeSubject(replySubject);
    setComposeBody(`Hi,\n\n${quoted}`);
    setComposeMode("reply");
    setShowCompose(true);
  };

  const updateMailState = useCallback(
    async (
      emailId: string,
      patch: {
        isRead?: boolean;
        isStarred?: boolean;
      }
    ) => {
      setMails((prev: MailItem[]) =>
        prev.map((mail: MailItem) =>
          mail.id === emailId
            ? {
                ...mail,
                ...(typeof patch.isRead === "boolean" ? { is_read: patch.isRead } : {}),
                ...(typeof patch.isStarred === "boolean"
                  ? { is_starred: patch.isStarred }
                  : {}),
              }
            : mail
        )
      );

      try {
        await fetch("/api/admin/mailbox/state", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": adminToken,
          },
          body: JSON.stringify({
            emailId,
            ...(typeof patch.isRead === "boolean" ? { isRead: patch.isRead } : {}),
            ...(typeof patch.isStarred === "boolean"
              ? { isStarred: patch.isStarred }
              : {}),
          }),
        });
      } catch {
      }
    },
    [adminToken]
  );

  const goToNextPage = async () => {
    if (!nextCursor || !hasMoreForward) return;

    const firstId = mails[0]?.id;
    if (firstId) {
      setPreviousCursors((prev: string[]) => [...prev, firstId]);
    }

    await fetchMailList(activeTab, adminToken, {
      direction: "next",
      cursor: nextCursor,
    });
  };

  const goToPreviousPage = async () => {
    const previousCursor = previousCursors[previousCursors.length - 1];
    if (!previousCursor) return;

    setPreviousCursors((prev: string[]) => prev.slice(0, -1));
    await fetchMailList(activeTab, adminToken, {
      direction: "prev",
      cursor: previousCursor,
    });
  };

  const sendMail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      alert("Please fill To, Subject, and Body.");
      return;
    }

    let normalizedPrefix = senderPrefix.trim().toLowerCase();
    if (!normalizedPrefix) {
      const prompted = typeof window !== "undefined"
        ? window.prompt("Enter sender prefix before @withsocio.com", "careers")
        : "";

      normalizedPrefix = String(prompted || "").trim().toLowerCase();
      if (!normalizedPrefix) {
        alert("Sender prefix is required.");
        return;
      }
      setSenderPrefix(normalizedPrefix);
    }

    if (!/^[a-z0-9._-]{1,32}$/i.test(normalizedPrefix)) {
      alert("Invalid sender prefix. Use letters, numbers, dot, underscore, or dash.");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("socio_mail_sender_prefix", normalizedPrefix);
    }

    const cc = composeCc
      .split(",")
      .map((entry: string) => entry.trim())
      .filter(Boolean);

    const bcc = composeBcc
      .split(",")
      .map((entry: string) => entry.trim())
      .filter(Boolean);

    setIsSending(true);
    try {
      const response = await fetch("/api/admin/mailbox/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminToken,
        },
        body: JSON.stringify({
          senderPrefix: normalizedPrefix,
          to: composeTo,
          cc,
          bcc,
          subject: composeSubject,
          text: composeBody,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = payload?.error || "Failed to send email";
        throw new Error(message);
      }

      alert("Email sent.");
      setShowCompose(false);
      setComposeMode("new");
      resetComposeForm();
      await fetchMailList(activeTab, adminToken, { resetHistory: true });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#f8faff] px-4 py-10">
        <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-black text-gray-900 mb-2">SOCIO Mail</h1>
          <p className="text-sm text-gray-600 mb-6">Login with admin password to open inbox, sent, and compose.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordInput(e.target.value)}
              placeholder="Admin password"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-[#154CB3]"
            />
            {authError ? <p className="text-sm text-red-600">{authError}</p> : null}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#154CB3] text-white font-semibold hover:bg-[#0f3d8f] transition-colors"
            >
              Login to SOCIO Mail
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link href={`/careers/${campusId}`} className="text-[#154CB3] hover:underline">
              Back to Careers
            </Link>
            <Link href="/panel" className="text-[#154CB3] hover:underline">
              Interview Panel
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen bg-[#f8faff] p-2 md:p-4">
      <div className="h-full bg-white border border-gray-200 rounded-2xl overflow-hidden grid grid-rows-[auto_auto_1fr]">
        <header className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-black text-gray-900">SOCIO Mail</h1>
            <p className="text-xs text-gray-500">Inbox, Sent, and Compose</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchMailList(activeTab, adminToken)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
            >
              Refresh
            </button>
            <button
              onClick={openCompose}
              className="px-3 py-2 rounded-lg bg-[#154CB3] text-white text-sm font-semibold hover:bg-[#0f3d8f]"
            >
              Compose
            </button>
          </div>
        </header>

        <div className="px-4 py-3 border-b border-gray-200 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2">
            {(["inbox", "sent"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === tab
                    ? "bg-[#154CB3] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab === "inbox" ? "Inbox" : "Sent"}
                {tab === "inbox" && unreadCount > 0 ? (
                  <span className={`ml-2 inline-flex min-w-5 h-5 px-1 items-center justify-center rounded-full text-[11px] ${
                    activeTab === "inbox" ? "bg-white text-[#154CB3]" : "bg-[#154CB3] text-white"
                  }`}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <input
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            placeholder="Search in current tab"
            className="w-full md:max-w-md px-3 py-2 rounded-lg border border-gray-300 outline-none focus:border-[#154CB3]"
          />
        </div>

        {listError ? (
          <div className="px-4 py-3 text-sm text-red-600 border-b border-red-200 bg-red-50">{listError}</div>
        ) : null}

        <div className="min-h-0 grid grid-cols-1 md:grid-cols-[380px_1fr]">
          <aside className="border-r border-gray-200 overflow-auto min-h-0">
            {isLoadingList ? (
              <p className="p-4 text-sm text-gray-500">Loading emails...</p>
            ) : filteredMails.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No emails found.</p>
            ) : (
              <ul>
                {filteredMails.map((mail) => {
                  const displayName = getDisplayName(mail);
                  const preview = getPreview(mail);
                  const initial = displayName.charAt(0).toUpperCase() || "S";
                  const isUnread = !mail.is_read;
                  return (
                    <li key={mail.id}>
                      <button
                        onClick={() => openMail(mail.id)}
                        className={`w-full px-4 py-3 text-left border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                          selectedMailId === mail.id
                            ? "bg-blue-50"
                            : isUnread
                              ? "bg-[#eef4ff]"
                              : "bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative w-9 h-9 rounded-full bg-[#154CB3]/10 text-[#154CB3] flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {initial}
                            {isUnread ? <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#154CB3] border-2 border-white" /> : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm truncate ${isUnread ? "font-black text-gray-900" : "font-semibold text-gray-900"}`}>{displayName}</p>
                              <p className={`text-[11px] whitespace-nowrap ${isUnread ? "text-[#154CB3] font-bold" : "text-gray-500"}`}>{formatDate(mail.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void updateMailState(mail.id, { isStarred: !mail.is_starred });
                                }}
                                className="text-yellow-500"
                                title={mail.is_starred ? "Unstar" : "Star"}
                              >
                                {mail.is_starred ? "★" : "☆"}
                              </button>
                              <p className={`text-sm truncate ${isUnread ? "font-bold text-gray-900" : "text-gray-800"}`}>{mail.subject || "(No subject)"}</p>
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{preview}</p>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="p-3 border-t border-gray-200 flex items-center justify-between gap-2 sticky bottom-0 bg-white">
              <button
                onClick={goToPreviousPage}
                disabled={previousCursors.length === 0 || isLoadingList}
                className="px-3 py-2 text-xs rounded-lg border border-gray-300 text-gray-700 disabled:opacity-40"
              >
                Newer
              </button>
              <button
                onClick={goToNextPage}
                disabled={!hasMoreForward || isLoadingList || !nextCursor}
                className="px-3 py-2 text-xs rounded-lg border border-gray-300 text-gray-700 disabled:opacity-40"
              >
                Older
              </button>
            </div>
          </aside>

          <section className="overflow-auto min-h-0">
            {!selectedMail ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">Select an email to view</div>
            ) : (
              <div className="p-5">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedMail.subject || "(No subject)"}</h2>
                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <p><span className="font-semibold text-gray-700">From:</span> {selectedMail.from || "-"}</p>
                  <p><span className="font-semibold text-gray-700">To:</span> {(selectedMail.to || []).join(", ") || "-"}</p>
                  <p><span className="font-semibold text-gray-700">Date:</span> {formatDate(selectedMail.created_at)}</p>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <button
                    type="button"
                    onClick={handleReply}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-700"
                  >
                    Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => void updateMailState(selectedMail.id, { isRead: !selectedMail.is_read })}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-700"
                  >
                    {selectedMail.is_read ? "Mark unread" : "Mark read"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void updateMailState(selectedMail.id, { isStarred: !selectedMail.is_starred })}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-700"
                  >
                    {selectedMail.is_starred ? "Unstar" : "Star"}
                  </button>
                </div>

                {isLoadingDetail ? (
                  <p className="text-sm text-gray-500">Loading email body...</p>
                ) : selectedDetail?.html ? (
                  <div
                    className="max-w-none border border-gray-200 rounded-xl p-4 overflow-auto"
                    dangerouslySetInnerHTML={{ __html: selectedDetail.html }}
                  />
                ) : selectedDetail?.text ? (
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 border border-gray-200 rounded-xl p-4 bg-gray-50">
                    {selectedDetail.text}
                  </pre>
                ) : (
                  <p className="text-sm text-gray-500">No body available for this email.</p>
                )}

                {(selectedDetail?.attachments?.length || selectedMail.attachments?.length) ? (
                  <div className="mt-6">
                    <h3 className="text-sm font-bold text-gray-800 mb-2">Attachments</h3>
                    <ul className="space-y-1">
                      {(selectedDetail?.attachments || selectedMail.attachments || []).map((att, index) => (
                        <li key={`${att.id || att.filename || "att"}-${index}`} className="text-sm text-gray-600">
                          {att.filename || "Attachment"} {att.size ? `(${att.size} bytes)` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </div>

      {showCompose ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{composeMode === "reply" ? "Reply" : "New Message"}</h2>
              <button onClick={() => setShowCompose(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={sendMail} className="p-4 space-y-3 overflow-y-auto">
              <div>
                <label className="text-xs text-gray-500 font-semibold">From Prefix</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    value={senderPrefix}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSenderPrefix(e.target.value)}
                    placeholder="careers"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#154CB3]"
                  />
                  <span className="text-xs text-gray-500 whitespace-nowrap">@withsocio.com</span>
                </div>
              </div>
              <input
                value={composeTo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComposeTo(e.target.value)}
                placeholder="To (comma-separated)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#154CB3]"
              />
              <input
                value={composeCc}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComposeCc(e.target.value)}
                placeholder="CC (optional, comma-separated)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#154CB3]"
              />
              <input
                value={composeBcc}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComposeBcc(e.target.value)}
                placeholder="BCC (optional, comma-separated)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#154CB3]"
              />
              <input
                value={composeSubject}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComposeSubject(e.target.value)}
                placeholder="Subject"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#154CB3]"
              />
              <textarea
                value={composeBody}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComposeBody(e.target.value)}
                rows={14}
                placeholder="Write your reply/message here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#154CB3] resize-y"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-4 py-2 rounded-lg bg-[#154CB3] text-white font-semibold disabled:opacity-60"
                >
                  {isSending ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
