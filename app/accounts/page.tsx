"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AccountsUser = "sachin" | "surya";
type ExpenseStatus = "pending_approval" | "purchased" | "settled";

type ReceiptAttachment = {
  name: string;
  url: string;
  type?: string;
  size?: number;
  uploadedAt?: string;
};

type ExpenseRecord = {
  id: string;
  expense_date: string;
  reason: string;
  total_amount: number | string;
  currency: string;
  status: ExpenseStatus;
  created_by_user: AccountsUser;
  split_sachin_percent: number | string;
  split_surya_percent: number | string;
  split_sachin_amount: number | string;
  split_surya_amount: number | string;
  approval_sachin_at: string | null;
  approval_surya_at: string | null;
  purchased_at: string | null;
  settled_at: string | null;
  receipt_attachments: ReceiptAttachment[];
  internal_notes: string | null;
  cc_emails: string[];
  created_at: string;
  updated_at: string;
};

type ListResponse = {
  success: boolean;
  currentUser: AccountsUser;
  data: ExpenseRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  counts: {
    pending: number;
    purchased: number;
    settled: number;
  };
};

const VALID_USERS: AccountsUser[] = ["sachin", "surya"];
const USER_STORAGE_KEY = "accounts_username";
const PAGE_SIZE = 8;

function normalizeUser(value: string | null): AccountsUser | null {
  const normalized = String(value || "").trim().toLowerCase();
  return VALID_USERS.includes(normalized as AccountsUser)
    ? (normalized as AccountsUser)
    : null;
}

function toNumber(value: string | number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatINR(value: string | number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function formatISTDateTime(value: string | null): string {
  if (!value) return "Pending";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatISTDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${value}T00:00:00`));
}

function splitEmails(value: string): string[] {
  return Array.from(
    new Set(
      String(value || "")
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function csvEscape(value: unknown): string {
  const normalized = String(value ?? "").replace(/\r\n|\r/g, "\n");
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function tsvCell(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n|\r/g, "\n")
    .replace(/\n/g, " ")
    .replace(/\t/g, " ");
}

function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function copyTextToClipboard(value: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.style.position = "fixed";
  textArea.style.top = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  const result = document.execCommand("copy");
  textArea.remove();
  return result;
}

function exportTimestamp(value: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function statusPill(status: ExpenseStatus): string {
  if (status === "pending_approval") return "bg-amber-100 text-amber-800 border-amber-300";
  if (status === "purchased") return "bg-sky-100 text-sky-800 border-sky-300";
  return "bg-emerald-100 text-emerald-800 border-emerald-300";
}

function getWorkflowStep(expense: ExpenseRecord): number {
  if (expense.status === "settled") return 4;
  if (expense.status === "purchased") return 3;
  if (expense.approval_sachin_at && expense.approval_surya_at) return 2;
  return 1;
}

function WorkflowNode({
  label,
  active,
  complete,
}: {
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full border transition ${
          complete
            ? "border-blue-600 bg-blue-600 text-white"
            : active
              ? "border-blue-300 bg-blue-50 text-blue-700 animate-pulse-soft"
              : "border-slate-300 bg-white text-slate-400"
        }`}
      >
        {complete ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="12" r="5" />
          </svg>
        )}
      </span>
      <span className={`text-xs font-semibold ${active ? "text-slate-800" : "text-slate-500"}`}>{label}</span>
    </div>
  );
}

export default function AccountsPage() {
  const [activeUser, setActiveUser] = useState<AccountsUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [authError, setAuthError] = useState("");

  const [view, setView] = useState<"pending" | "processed">("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyExpenseId, setBusyExpenseId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [counts, setCounts] = useState({ pending: 0, purchased: 0, settled: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedExpenseIds, setExpandedExpenseIds] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState(false);

  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [totalAmount, setTotalAmount] = useState("0");
  const [splitSachinPercent, setSplitSachinPercent] = useState("50");
  const [splitSuryaPercent, setSplitSuryaPercent] = useState("50");
  const [extraCc, setExtraCc] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  const splitPreview = useMemo(() => {
    const total = toNumber(totalAmount);
    const sachinPercent = toNumber(splitSachinPercent);
    const suryaPercent = toNumber(splitSuryaPercent);
    const sachinAmount = Math.round(((total * sachinPercent) / 100 + Number.EPSILON) * 100) / 100;
    const suryaAmount = Math.round((total - sachinAmount + Number.EPSILON) * 100) / 100;

    return {
      total,
      percentTotal: Math.round((sachinPercent + suryaPercent) * 100) / 100,
      sachinAmount,
      suryaAmount,
    };
  }, [splitSachinPercent, splitSuryaPercent, totalAmount]);

  useEffect(() => {
    const savedUser = typeof window !== "undefined" ? window.localStorage.getItem(USER_STORAGE_KEY) : null;
    const resolvedUser = normalizeUser(savedUser);
    if (resolvedUser) {
      setActiveUser(resolvedUser);
    }
    setAuthReady(true);
  }, []);

  const fetchExpensePage = async (page: number, limit: number): Promise<ListResponse> => {
    if (!activeUser) {
      throw new Error("Missing active user.");
    }

    const response = await fetch(
      `/api/accounts?view=${view}&q=${encodeURIComponent(search)}&page=${page}&limit=${limit}`,
      {
        headers: {
          "x-accounts-user": activeUser,
        },
        cache: "no-store",
      }
    );

    const payload = (await response.json()) as ListResponse | { error?: string };
    if (!response.ok) {
      throw new Error((payload as { error?: string }).error || "Failed to fetch expenses.");
    }

    return payload as ListResponse;
  };

  const loadExpenses = async (pageToLoad = currentPage) => {
    if (!activeUser) return;

    setLoading(true);
    setError("");

    try {
      const data = await fetchExpensePage(pageToLoad, PAGE_SIZE);
      const nextPagination =
        data.pagination ||
        ({ page: pageToLoad, limit: PAGE_SIZE, total: data.data.length, pages: data.data.length ? 1 : 0 } as const);

      setExpenses(Array.isArray(data.data) ? data.data : []);
      setCounts(data.counts || { pending: 0, purchased: 0, settled: 0 });
      setPagination(nextPagination);

      if (nextPagination.pages > 0 && pageToLoad > nextPagination.pages) {
        setCurrentPage(nextPagination.pages);
      } else if (nextPagination.total === 0 && pageToLoad !== 1) {
        setCurrentPage(1);
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to fetch expenses.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeUser) return;
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUser, view, currentPage]);

  const handleSearchSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    await loadExpenses(1);
  };

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    const resolved = normalizeUser(usernameInput);

    if (!resolved) {
      setAuthError("wrongusername");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(USER_STORAGE_KEY, resolved);
    }

    setActiveUser(resolved);
    setAuthError("");
    setUsernameInput("");
    setCurrentPage(1);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
    setActiveUser(null);
    setExpenses([]);
    setCounts({ pending: 0, purchased: 0, settled: 0 });
    setPagination({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
    setCurrentPage(1);
    setExpandedExpenseIds({});
  };

  const toggleExpenseExpand = (id: string) => {
    setExpandedExpenseIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSplitSachinChange = (value: string) => {
    const safe = Math.max(0, Math.min(100, Number(value || "0")));
    const formatted = Number.isFinite(safe) ? safe : 0;
    setSplitSachinPercent(String(formatted));
    setSplitSuryaPercent(String(Math.max(0, 100 - formatted)));
  };

  const handleSplitSuryaChange = (value: string) => {
    const safe = Math.max(0, Math.min(100, Number(value || "0")));
    const formatted = Number.isFinite(safe) ? safe : 0;
    setSplitSuryaPercent(String(formatted));
    setSplitSachinPercent(String(Math.max(0, 100 - formatted)));
  };

  const uploadReceipts = async (): Promise<ReceiptAttachment[]> => {
    if (!activeUser || receiptFiles.length === 0) return [];

    const uploaded: ReceiptAttachment[] = [];

    for (const file of receiptFiles) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/accounts/upload", {
        method: "POST",
        headers: {
          "x-accounts-user": activeUser,
        },
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || `Failed to upload ${file.name}`);
      }

      if (payload?.file) {
        uploaded.push(payload.file);
      }
    }

    return uploaded;
  };

  const handleCreateExpense = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeUser) return;

    setError("");
    setSuccess("");

    if (!reason.trim()) {
      setError("Please provide a reason for the expense.");
      return;
    }

    if (splitPreview.total <= 0) {
      setError("Total amount must be greater than 0.");
      return;
    }

    if (splitPreview.percentTotal !== 100) {
      setError("Split percentages must add up to 100.");
      return;
    }

    setSubmitting(true);

    try {
      const uploadedReceipts = await uploadReceipts();

      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-accounts-user": activeUser,
        },
        body: JSON.stringify({
          expenseDate,
          reason: reason.trim(),
          totalAmount: splitPreview.total,
          splitSachinPercent: toNumber(splitSachinPercent),
          splitSuryaPercent: toNumber(splitSuryaPercent),
          ccEmails: splitEmails(extraCc),
          internalNotes: internalNotes.trim(),
          receiptAttachments: uploadedReceipts,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to create expense.");
      }

      const emailMessage = payload?.email?.sent
        ? "Notification email sent."
        : "Expense created, but email notification failed.";

      setSuccess(`Expense created successfully. ${emailMessage}`);
      setReason("");
      setTotalAmount("0");
      setSplitSachinPercent("50");
      setSplitSuryaPercent("50");
      setExtraCc("");
      setInternalNotes("");
      setReceiptFiles([]);
      setFileInputKey((prev) => prev + 1);
      setShowCreateForm(false);
      setCurrentPage(1);
      await loadExpenses(1);
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Failed to create expense.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpenseAction = async (id: string, action: string) => {
    if (!activeUser) return;

    setBusyExpenseId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-accounts-user": activeUser,
        },
        body: JSON.stringify({ action }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update expense.");
      }

      if (action === "approve") {
        setSuccess("Approval recorded with timestamp.");
      } else if (action === "mark_purchased") {
        setSuccess("Expense moved to purchased.");
      } else if (action === "mark_settled") {
        setSuccess("Expense marked as settled.");
      }

      await loadExpenses();
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : "Action failed.";
      setError(message);
    } finally {
      setBusyExpenseId(null);
    }
  };

  const fetchAllFilteredExpenses = async (): Promise<ExpenseRecord[]> => {
    const firstPage = await fetchExpensePage(1, 200);
    const allRows = [...(Array.isArray(firstPage.data) ? firstPage.data : [])];
    const totalPages = Math.max(1, firstPage.pagination?.pages || 0);

    for (let page = 2; page <= totalPages; page += 1) {
      const nextPage = await fetchExpensePage(page, 200);
      if (Array.isArray(nextPage.data) && nextPage.data.length > 0) {
        allRows.push(...nextPage.data);
      }
    }

    return allRows;
  };

  const toExportRows = (rows: ExpenseRecord[]): string[][] => {
    return rows.map((expense) => [
      expense.id,
      formatISTDate(expense.expense_date),
      expense.reason,
      String(expense.total_amount),
      expense.status,
      expense.created_by_user,
      String(expense.split_sachin_percent),
      String(expense.split_surya_percent),
      String(expense.split_sachin_amount),
      String(expense.split_surya_amount),
      exportTimestamp(expense.approval_sachin_at),
      exportTimestamp(expense.approval_surya_at),
      exportTimestamp(expense.purchased_at),
      exportTimestamp(expense.settled_at),
      expense.internal_notes || "",
      String(Array.isArray(expense.receipt_attachments) ? expense.receipt_attachments.length : 0),
      formatISTDateTime(expense.updated_at),
    ]);
  };

  const handleExportCsv = async () => {
    if (!activeUser) return;

    setExporting(true);
    setError("");
    setSuccess("");

    try {
      const rows = await fetchAllFilteredExpenses();
      if (rows.length === 0) {
        setSuccess("No rows to export for the current view and filters.");
        return;
      }

      const header = [
        "Expense ID",
        "Expense Date (IST)",
        "Reason",
        "Total Amount",
        "Status",
        "Created By",
        "Sachin %",
        "Surya %",
        "Sachin Amount",
        "Surya Amount",
        "Sachin Approved At (IST)",
        "Surya Approved At (IST)",
        "Purchased At (IST)",
        "Settled At (IST)",
        "Internal Notes",
        "Receipt Count",
        "Last Updated At (IST)",
      ];

      const content = [header, ...toExportRows(rows)]
        .map((line) => line.map((cell) => csvEscape(cell)).join(","))
        .join("\n");

      const stamp = new Date().toISOString().slice(0, 10);
      downloadTextFile(`socio-accounts-${view}-${stamp}.csv`, content, "text/csv;charset=utf-8");
      setSuccess(`CSV exported successfully with ${rows.length} row${rows.length === 1 ? "" : "s"}.`);
    } catch (exportError) {
      const message = exportError instanceof Error ? exportError.message : "Failed to export CSV.";
      setError(message);
    } finally {
      setExporting(false);
    }
  };

  const handleCopyForGoogleSheets = async () => {
    if (!activeUser) return;

    setExporting(true);
    setError("");
    setSuccess("");

    try {
      const rows = await fetchAllFilteredExpenses();
      if (rows.length === 0) {
        setSuccess("No rows to copy for the current view and filters.");
        return;
      }

      const header = [
        "Expense ID",
        "Expense Date (IST)",
        "Reason",
        "Total Amount",
        "Status",
        "Created By",
        "Sachin %",
        "Surya %",
        "Sachin Amount",
        "Surya Amount",
        "Sachin Approved At (IST)",
        "Surya Approved At (IST)",
        "Purchased At (IST)",
        "Settled At (IST)",
        "Internal Notes",
        "Receipt Count",
        "Last Updated At (IST)",
      ];

      const tsvPayload = [header, ...toExportRows(rows)]
        .map((line) => line.map((cell) => tsvCell(cell)).join("\t"))
        .join("\n");

      const copied = await copyTextToClipboard(tsvPayload);
      if (!copied) {
        throw new Error("Copy failed in this browser. Please use CSV export instead.");
      }

      setSuccess(
        `Copied ${rows.length} row${rows.length === 1 ? "" : "s"} for Google Sheets. Paste into the sheet.`
      );
    } catch (copyError) {
      const message = copyError instanceof Error ? copyError.message : "Failed to copy data.";
      setError(message);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = pagination.pages;
  const showingFrom = pagination.total === 0 ? 0 : (currentPage - 1) * pagination.limit + 1;
  const showingTo = pagination.total === 0 ? 0 : Math.min(currentPage * pagination.limit, pagination.total);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
          Loading SOCIO Accounts...
        </div>
      </div>
    );
  }

  if (!activeUser) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe_0%,_#f8fafc_45%,_#f8fafc_100%)] px-4 py-12">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-4">
            <Image src="/socio.svg" alt="SOCIO" width={58} height={58} className="h-14 w-14" priority />
            <div>
              <h1 className="text-2xl font-black text-slate-900">SOCIO Accounts</h1>
              <p className="text-sm text-slate-600">Expense workflow console</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Enter Username</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(event) => {
                  setUsernameInput(event.target.value);
                  if (authError) setAuthError("");
                }}
                placeholder="Username"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600/20 transition focus:ring-4"
                required
              />
              {authError ? <p className="mt-2 text-sm font-semibold text-rose-600">{authError}</p> : null}
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Enter Workspace
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[radial-gradient(circle_at_top,_#e0f2fe_0%,_#f8fafc_45%,_#f8fafc_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Image src="/socio.svg" alt="SOCIO" width={56} height={56} className="h-14 w-14" priority />
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">SOCIO Accounts</h1>
                <p className="text-sm text-slate-600">
                  Logged in as <span className="font-bold uppercase text-blue-700">{activeUser}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm((prev) => !prev)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              >
                {showCreateForm ? "Hide Create Form" : "New Expense"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setView("pending");
                  setCurrentPage(1);
                }}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  view === "pending"
                    ? "border-blue-700 bg-blue-700 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                Pending Expenses
              </button>
              <button
                type="button"
                onClick={() => {
                  setView("processed");
                  setCurrentPage(1);
                }}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  view === "processed"
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                Processed Expenses
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-amber-700">Pending Approval</p>
              <p className="mt-1 text-2xl font-black text-amber-900">{counts.pending}</p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-sky-700">Purchased</p>
              <p className="mt-1 text-2xl font-black text-sky-900">{counts.purchased}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Settled</p>
              <p className="mt-1 text-2xl font-black text-emerald-900">{counts.settled}</p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Workflow</p>
            <div className="mt-2 flex flex-wrap gap-4">
              <WorkflowNode label="Submitted" active complete={false} />
              <WorkflowNode label="Approved" active={false} complete={false} />
              <WorkflowNode label="Purchased" active={false} complete={false} />
              <WorkflowNode label="Settled" active={false} complete={false} />
            </div>
          </div>
        </header>

        <div className="space-y-4">
          <section className="space-y-4">
            {showCreateForm ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-extrabold text-slate-900">Create New Expense</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Keep entries short. Workflow updates are tracked automatically.
                </p>

                <form className="mt-5 space-y-4" onSubmit={handleCreateExpense}>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Expense Date
                    </label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={(event) => setExpenseDate(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600/20 transition focus:ring-4"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Reason
                    </label>
                    <textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      rows={3}
                      placeholder="Why is this expense required?"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600/20 transition focus:ring-4"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Total Amount (INR)
                    </label>
                    <input
                      type="number"
                      value={totalAmount}
                      min="0"
                      step="0.01"
                      onChange={(event) => setTotalAmount(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600/20 transition focus:ring-4"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Sachin %
                      </label>
                      <input
                        type="number"
                        value={splitSachinPercent}
                        min="0"
                        max="100"
                        step="0.01"
                        onChange={(event) => handleSplitSachinChange(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600/20 transition focus:ring-4"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Surya %
                      </label>
                      <input
                        type="number"
                        value={splitSuryaPercent}
                        min="0"
                        max="100"
                        step="0.01"
                        onChange={(event) => handleSplitSuryaChange(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600/20 transition focus:ring-4"
                        required
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">Split Preview</p>
                    <p className="mt-1">Sachin: {formatINR(splitPreview.sachinAmount)}</p>
                    <p>Surya: {formatINR(splitPreview.suryaAmount)}</p>
                    <p className="mt-1 text-xs text-slate-500">Total percentage: {splitPreview.percentTotal}%</p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Extra CC Emails (optional)
                    </label>
                    <input
                      type="text"
                      value={extraCc}
                      onChange={(event) => setExtraCc(event.target.value)}
                      placeholder="name@example.com, another@example.com"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600/20 transition focus:ring-4"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Internal Notes (optional)
                    </label>
                    <textarea
                      value={internalNotes}
                      onChange={(event) => setInternalNotes(event.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600/20 transition focus:ring-4"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Receipt Files (optional)
                    </label>
                    <input
                      key={fileInputKey}
                      type="file"
                      multiple
                      accept=".png,.jpg,.jpeg,.webp,.pdf"
                      onChange={(event) => setReceiptFiles(Array.from(event.target.files || []))}
                      className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    />
                    {receiptFiles.length > 0 ? (
                      <p className="mt-1 text-xs text-slate-500">{receiptFiles.length} file(s) selected.</p>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-400"
                  >
                    {submitting ? "Saving Expense..." : "Save Expense"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-600">
                  Create form is hidden to keep this workspace clean. Click <span className="font-semibold">New Expense</span> when needed.
                </p>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by reason or notes"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600/20 transition focus:ring-4"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                >
                  Apply
                </button>
              </form>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={exporting || loading}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {exporting ? "Preparing..." : "Export CSV"}
                </button>
                <button
                  type="button"
                  onClick={handleCopyForGoogleSheets}
                  disabled={exporting || loading}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {exporting ? "Preparing..." : "Copy for Google Sheets"}
                </button>
                <span className="text-xs text-slate-500 sm:ml-auto">
                  {pagination.total > 0 ? `Page ${currentPage} of ${totalPages}` : "No rows"}
                </span>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}
            {success ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
                Loading workflow...
              </div>
            ) : expenses.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
                No expenses found for this view.
              </div>
            ) : (
              expenses.map((expense) => {
                const sachinApproved = Boolean(expense.approval_sachin_at);
                const suryaApproved = Boolean(expense.approval_surya_at);
                const canApprove =
                  expense.status === "pending_approval" &&
                  ((activeUser === "sachin" && !sachinApproved) ||
                    (activeUser === "surya" && !suryaApproved));
                const canMarkPurchased =
                  expense.status === "pending_approval" && sachinApproved && suryaApproved;
                const canMarkSettled = expense.status === "purchased";
                const workflowStep = getWorkflowStep(expense);
                const progressPercent = ((workflowStep - 1) / 3) * 100;
                const isExpanded = Boolean(expandedExpenseIds[expense.id]);

                return (
                  <article
                    key={expense.id}
                    className="animate-fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          {formatISTDate(expense.expense_date)}
                        </p>
                        <h3 className="mt-1 text-lg font-extrabold text-slate-900">{expense.reason}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Created by <span className="font-semibold uppercase">{expense.created_by_user}</span>
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xl font-black text-slate-900">{formatINR(expense.total_amount)}</p>
                        <span
                          className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusPill(
                            expense.status
                          )}`}
                        >
                          {expense.status.replaceAll("_", " ")}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="h-1 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-700 ease-out"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <WorkflowNode label="Submitted" active={workflowStep >= 1} complete={workflowStep > 1} />
                        <WorkflowNode label="Approved" active={workflowStep >= 2} complete={workflowStep > 2} />
                        <WorkflowNode label="Purchased" active={workflowStep >= 3} complete={workflowStep > 3} />
                        <WorkflowNode label="Settled" active={workflowStep >= 4} complete={workflowStep >= 4} />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">Approval Timestamps (IST)</p>
                        <p className="mt-1">Sachin: {formatISTDateTime(expense.approval_sachin_at)}</p>
                        <p>Surya: {formatISTDateTime(expense.approval_surya_at)}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        <p>
                          Purchased At: <span className="font-medium">{formatISTDateTime(expense.purchased_at)}</span>
                        </p>
                        <p>
                          Settled At: <span className="font-medium">{formatISTDateTime(expense.settled_at)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {canApprove ? (
                        <button
                          type="button"
                          onClick={() => handleExpenseAction(expense.id, "approve")}
                          disabled={busyExpenseId === expense.id}
                          className="rounded-lg border border-amber-400 bg-amber-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-amber-900 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busyExpenseId === expense.id ? "Saving..." : `Approve as ${activeUser}`}
                        </button>
                      ) : null}

                      {canMarkPurchased ? (
                        <button
                          type="button"
                          onClick={() => handleExpenseAction(expense.id, "mark_purchased")}
                          disabled={busyExpenseId === expense.id}
                          className="rounded-lg border border-sky-400 bg-sky-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-sky-900 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busyExpenseId === expense.id ? "Saving..." : "Mark Purchased"}
                        </button>
                      ) : null}

                      {canMarkSettled ? (
                        <button
                          type="button"
                          onClick={() => handleExpenseAction(expense.id, "mark_settled")}
                          disabled={busyExpenseId === expense.id}
                          className="rounded-lg border border-emerald-400 bg-emerald-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-900 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busyExpenseId === expense.id ? "Saving..." : "Mark Settled"}
                        </button>
                      ) : null}

                      <Link
                        href={`/accounts/bill/${expense.id}`}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-800 transition hover:border-slate-400"
                      >
                        {expense.status === "settled" ? "Print Bill" : "Print Provisional Bill"}
                      </Link>

                      <button
                        type="button"
                        onClick={() => toggleExpenseExpand(expense.id)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 transition hover:border-slate-400"
                      >
                        {isExpanded ? "Hide Details" : "View Details"}
                      </button>
                    </div>

                    {isExpanded ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                          <p className="font-medium text-slate-900">Split</p>
                          <p className="mt-1">
                            Sachin: {expense.split_sachin_percent}% ({formatINR(expense.split_sachin_amount)})
                          </p>
                          <p>
                            Surya: {expense.split_surya_percent}% ({formatINR(expense.split_surya_amount)})
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                          <p className="font-medium text-slate-900">Receipt Files</p>
                          {Array.isArray(expense.receipt_attachments) && expense.receipt_attachments.length > 0 ? (
                            <ul className="mt-1 space-y-1">
                              {expense.receipt_attachments.map((attachment, index) => (
                                <li key={`${expense.id}-receipt-${index}`}>
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-700 underline-offset-2 hover:underline"
                                  >
                                    {attachment.name}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-1 text-slate-500">No receipts uploaded.</p>
                          )}
                        </div>
                        {expense.internal_notes ? (
                          <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                            <p className="font-medium text-slate-900">Notes</p>
                            <p className="mt-1 whitespace-pre-wrap">{expense.internal_notes}</p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}

            {pagination.total > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-slate-600">
                    Showing {showingFrom}-{showingTo} of {pagination.total}
                  </p>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage <= 1 || loading}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-semibold text-slate-600">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages || loading}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
