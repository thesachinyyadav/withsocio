"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AccountsUser = "sachin" | "surya";
type ExpenseStatus = "pending_approval" | "purchased" | "settled";

type ExpenseRecord = {
  id: string;
  expense_date: string;
  reason: string;
  total_amount: number | string;
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
  receipt_attachments: { name: string; url: string }[];
  internal_notes: string | null;
  updated_at: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

type SummaryStats = {
  totalExpenses: number;
  totalAmount: number;
  pendingApprovalAmount: number;
  purchasedAmount: number;
  settledAmount: number;
  pendingClearanceAmount: number;
  sachinShareTotal: number;
  suryaShareTotal: number;
  pendingApprovalCount: number;
  purchasedCount: number;
  settledCount: number;
};

type ListResponse = {
  success: boolean;
  currentUser: AccountsUser;
  data: ExpenseRecord[];
  pagination: Pagination;
  counts: {
    pending: number;
    purchased: number;
    settled: number;
  };
  summary?: Partial<SummaryStats>;
};

const VALID_USERS: AccountsUser[] = ["sachin", "surya"];
const USER_STORAGE_KEY = "accounts_username";
const PAGE_SIZE = 10;

const EMPTY_SUMMARY: SummaryStats = {
  totalExpenses: 0,
  totalAmount: 0,
  pendingApprovalAmount: 0,
  purchasedAmount: 0,
  settledAmount: 0,
  pendingClearanceAmount: 0,
  sachinShareTotal: 0,
  suryaShareTotal: 0,
  pendingApprovalCount: 0,
  purchasedCount: 0,
  settledCount: 0,
};

function normalizeUser(value: string | null): AccountsUser | null {
  const normalized = String(value || "").trim().toLowerCase();
  return VALID_USERS.includes(normalized as AccountsUser)
    ? (normalized as AccountsUser)
    : null;
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatINR(value: unknown): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function formatISTDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${value}T00:00:00`));
}

function formatISTDateTime(value: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function normalizeSummary(value: Partial<SummaryStats> | undefined): SummaryStats {
  return {
    totalExpenses: toNumber(value?.totalExpenses),
    totalAmount: toNumber(value?.totalAmount),
    pendingApprovalAmount: toNumber(value?.pendingApprovalAmount),
    purchasedAmount: toNumber(value?.purchasedAmount),
    settledAmount: toNumber(value?.settledAmount),
    pendingClearanceAmount: toNumber(value?.pendingClearanceAmount),
    sachinShareTotal: toNumber(value?.sachinShareTotal),
    suryaShareTotal: toNumber(value?.suryaShareTotal),
    pendingApprovalCount: toNumber(value?.pendingApprovalCount),
    purchasedCount: toNumber(value?.purchasedCount),
    settledCount: toNumber(value?.settledCount),
  };
}

function statusStyles(status: ExpenseStatus): string {
  if (status === "pending_approval") {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }
  if (status === "purchased") {
    return "border-sky-300 bg-sky-50 text-sky-800";
  }
  return "border-emerald-300 bg-emerald-50 text-emerald-800";
}

function statusLabel(status: ExpenseStatus): string {
  if (status === "pending_approval") return "Pending Approval";
  if (status === "purchased") return "Purchased";
  return "Settled";
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

  const copied = document.execCommand("copy");
  textArea.remove();
  return copied;
}

export default function AccountsPage() {
  const [activeUser, setActiveUser] = useState<AccountsUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [authError, setAuthError] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [expenseReason, setExpenseReason] = useState("");
  const [totalAmountInput, setTotalAmountInput] = useState("0");
  const [splitSachinPercent, setSplitSachinPercent] = useState("50");
  const [splitSuryaPercent, setSplitSuryaPercent] = useState("50");
  const [extraCc, setExtraCc] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  });
  const [summary, setSummary] = useState<SummaryStats>(EMPTY_SUMMARY);

  const splitPreview = useMemo(() => {
    const total = toNumber(totalAmountInput);
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
  }, [splitSachinPercent, splitSuryaPercent, totalAmountInput]);

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
      `/api/accounts?view=all&q=${encodeURIComponent(search)}&page=${page}&limit=${limit}`,
      {
        headers: {
          "x-accounts-user": activeUser,
        },
        cache: "no-store",
      }
    );

    const payload = (await response.json()) as ListResponse | { error?: string };
    if (!response.ok) {
      throw new Error((payload as { error?: string }).error || "Failed to fetch account data.");
    }

    return payload as ListResponse;
  };

  const loadDashboard = async (pageToLoad = currentPage) => {
    if (!activeUser) return;

    setLoading(true);
    setError("");

    try {
      const data = await fetchExpensePage(pageToLoad, PAGE_SIZE);
      const nextPagination = data.pagination || {
        page: pageToLoad,
        limit: PAGE_SIZE,
        total: Array.isArray(data.data) ? data.data.length : 0,
        pages: Array.isArray(data.data) && data.data.length ? 1 : 0,
      };

      setExpenses(Array.isArray(data.data) ? data.data : []);
      setPagination(nextPagination);
      setSummary(normalizeSummary(data.summary));

      if (nextPagination.pages > 0 && pageToLoad > nextPagination.pages) {
        setCurrentPage(nextPagination.pages);
      } else if (nextPagination.pages === 0 && pageToLoad !== 1) {
        setCurrentPage(1);
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to fetch account data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeUser) return;
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUser, currentPage]);

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
    setPagination({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
    setSummary(EMPTY_SUMMARY);
    setCurrentPage(1);
    setSearch("");
    setError("");
    setSuccess("");
  };

  const handleSearchSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    await loadDashboard(1);
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

  const resetCreateForm = () => {
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setExpenseReason("");
    setTotalAmountInput("0");
    setSplitSachinPercent("50");
    setSplitSuryaPercent("50");
    setExtraCc("");
    setInternalNotes("");
  };

  const handleCreateExpense = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeUser) return;

    setError("");
    setSuccess("");

    if (!expenseReason.trim()) {
      setError("Please provide a reason for the expense.");
      return;
    }

    if (splitPreview.total <= 0) {
      setError("Total amount must be greater than 0.");
      return;
    }

    if (splitPreview.percentTotal !== 100) {
      setError("Split percentages must add up to exactly 100.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-accounts-user": activeUser,
        },
        body: JSON.stringify({
          expenseDate,
          reason: expenseReason.trim(),
          totalAmount: splitPreview.total,
          splitSachinPercent: toNumber(splitSachinPercent),
          splitSuryaPercent: toNumber(splitSuryaPercent),
          ccEmails: splitEmails(extraCc),
          internalNotes: internalNotes.trim(),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to create expense.");
      }

      const emailMessage = payload?.email?.sent
        ? "Notification email sent."
        : "Expense created, but notification email failed.";

      setSuccess(`Expense created successfully. ${emailMessage}`);
      setShowAddExpense(false);
      resetCreateForm();
      setCurrentPage(1);
      await loadDashboard(1);
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Failed to create expense.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchAllFilteredExpenses = async (): Promise<ExpenseRecord[]> => {
    const firstPage = await fetchExpensePage(1, 200);
    const rows = [...(Array.isArray(firstPage.data) ? firstPage.data : [])];
    const totalPages = Math.max(1, firstPage.pagination?.pages || 0);

    for (let page = 2; page <= totalPages; page += 1) {
      const nextPage = await fetchExpensePage(page, 200);
      if (Array.isArray(nextPage.data) && nextPage.data.length > 0) {
        rows.push(...nextPage.data);
      }
    }

    return rows;
  };

  const toExportRows = (rows: ExpenseRecord[]): string[][] => {
    return rows.map((expense) => [
      expense.id,
      formatISTDate(expense.expense_date),
      expense.reason,
      String(expense.total_amount),
      statusLabel(expense.status),
      expense.created_by_user,
      String(expense.split_sachin_percent),
      String(expense.split_surya_percent),
      String(expense.split_sachin_amount),
      String(expense.split_surya_amount),
      formatISTDateTime(expense.approval_sachin_at),
      formatISTDateTime(expense.approval_surya_at),
      formatISTDateTime(expense.purchased_at),
      formatISTDateTime(expense.settled_at),
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
        setSuccess("No rows to export for the current filters.");
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
      downloadTextFile(`socio-accounts-${stamp}.csv`, content, "text/csv;charset=utf-8");
      setSuccess(`CSV exported with ${rows.length} row${rows.length === 1 ? "" : "s"}.`);
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
        setSuccess("No rows to copy for the current filters.");
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

      const payload = [header, ...toExportRows(rows)]
        .map((line) => line.map((cell) => tsvCell(cell)).join("\t"))
        .join("\n");

      const copied = await copyTextToClipboard(payload);
      if (!copied) {
        throw new Error("Copy failed in this browser. Please use CSV export.");
      }

      setSuccess(`Copied ${rows.length} row${rows.length === 1 ? "" : "s"} for Google Sheets.`);
    } catch (copyError) {
      const message = copyError instanceof Error ? copyError.message : "Failed to copy rows.";
      setError(message);
    } finally {
      setExporting(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
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
            <Image src="/socio.svg" alt="SOCIO" width={56} height={56} className="h-14 w-14" priority />
            <div>
              <h1 className="text-2xl font-black text-slate-900">SOCIO Accounts</h1>
              <p className="text-sm text-slate-600">Dashboard Access</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
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
              Enter Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalPages = pagination.pages;
  const showingFrom = pagination.total === 0 ? 0 : (currentPage - 1) * pagination.limit + 1;
  const showingTo = pagination.total === 0 ? 0 : Math.min(currentPage * pagination.limit, pagination.total);

  return (
    <div className="bg-[radial-gradient(circle_at_top,_#e0f2fe_0%,_#f8fafc_45%,_#f8fafc_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Image src="/socio.svg" alt="SOCIO" width={48} height={48} className="h-12 w-12" priority />
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">SOCIO Accounts Dashboard</h1>
                <p className="text-sm text-slate-600">
                  Logged in as <span className="font-bold uppercase text-blue-700">{activeUser}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddExpense((prev) => !prev);
                  setError("");
                  setSuccess("");
                }}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                {showAddExpense ? "Close Add Expense" : "Add Expense"}
              </button>
              <button
                type="button"
                onClick={() => loadDashboard(currentPage)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              >
                Refresh
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
        </header>

        {showAddExpense ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900">Add New Expense</h2>
              <p className="text-xs text-slate-500">This stays hidden unless needed</p>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
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
                    Total Amount (INR)
                  </label>
                  <input
                    type="number"
                    value={totalAmountInput}
                    min="0"
                    step="0.01"
                    onChange={(event) => setTotalAmountInput(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600/20 transition focus:ring-4"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Reason
                </label>
                <textarea
                  value={expenseReason}
                  onChange={(event) => setExpenseReason(event.target.value)}
                  rows={3}
                  placeholder="Why is this expense required?"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600/20 transition focus:ring-4"
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
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

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Split Preview</p>
                <p className="mt-1">Sachin: {formatINR(splitPreview.sachinAmount)}</p>
                <p>Surya: {formatINR(splitPreview.suryaAmount)}</p>
                <p className="mt-1 text-xs text-slate-500">Total percentage: {splitPreview.percentTotal}%</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
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
                  <input
                    type="text"
                    value={internalNotes}
                    onChange={(event) => setInternalNotes(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600/20 transition focus:ring-4"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  {submitting ? "Saving..." : "Save Expense"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddExpense(false);
                    resetCreateForm();
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Spent</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{formatINR(summary.totalAmount)}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-amber-700">Pending Clearance</p>
            <p className="mt-1 text-2xl font-black text-amber-900">{formatINR(summary.pendingClearanceAmount)}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Settled Amount</p>
            <p className="mt-1 text-2xl font-black text-emerald-900">{formatINR(summary.settledAmount)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pending Approval</p>
            <p className="mt-1 text-xl font-black text-slate-900">{formatINR(summary.pendingApprovalAmount)}</p>
            <p className="mt-1 text-xs text-slate-500">{summary.pendingApprovalCount} expense(s)</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Purchased</p>
            <p className="mt-1 text-xl font-black text-slate-900">{formatINR(summary.purchasedAmount)}</p>
            <p className="mt-1 text-xs text-slate-500">{summary.purchasedCount} expense(s)</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Expense Entries</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{summary.totalExpenses}</p>
            <p className="mt-1 text-xs text-slate-500">All statuses combined</p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-sky-700">Sachin Share Total</p>
            <p className="mt-1 text-xl font-black text-sky-900">{formatINR(summary.sachinShareTotal)}</p>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-indigo-700">Surya Share Total</p>
            <p className="mt-1 text-xl font-black text-indigo-900">{formatINR(summary.suryaShareTotal)}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Expense Data Snapshot</h2>
            <p className="text-xs text-slate-500">Recent entries with search, export, and pagination</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="mt-4 flex flex-col gap-3 lg:flex-row">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by reason or notes"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600/20 transition focus:ring-4"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={loading || exporting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exporting ? "Preparing..." : "Export CSV"}
              </button>
              <button
                type="button"
                onClick={handleCopyForGoogleSheets}
                disabled={loading || exporting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exporting ? "Preparing..." : "Copy for Google Sheets"}
              </button>
            </div>
          </form>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}
          {success ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
              Loading expenses...
            </div>
          ) : expenses.length === 0 ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
              No expense entries found.
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Date</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Reason</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">Amount</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Status</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Created By</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Bill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-3 py-2 text-slate-700">{formatISTDate(expense.expense_date)}</td>
                      <td className="px-3 py-2 text-slate-800">
                        <div className="max-w-[380px] truncate" title={expense.reason}>
                          {expense.reason}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900">
                        {formatINR(expense.total_amount)}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyles(expense.status)}`}>
                          {statusLabel(expense.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 uppercase text-slate-700">{expense.created_by_user}</td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/socio/accounts/bill/${expense.id}`}
                          className="text-xs font-semibold text-blue-700 underline-offset-2 hover:underline"
                        >
                          View Bill
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.total > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
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
                  {totalPages === 0 ? 0 : currentPage} / {totalPages}
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
          ) : null}
        </section>
      </div>
    </div>
  );
}
