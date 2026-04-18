"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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
  counts: {
    pending: number;
    purchased: number;
    settled: number;
  };
};

const VALID_USERS: AccountsUser[] = ["sachin", "surya"];

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

function statusPill(status: ExpenseStatus): string {
  if (status === "pending_approval") return "bg-amber-100 text-amber-800 border-amber-300";
  if (status === "purchased") return "bg-sky-100 text-sky-800 border-sky-300";
  return "bg-emerald-100 text-emerald-800 border-emerald-300";
}

export default function AccountsPage() {
  const searchParams = useSearchParams();
  const user = normalizeUser(searchParams.get("user"));

  const [view, setView] = useState<"pending" | "processed">("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyExpenseId, setBusyExpenseId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [counts, setCounts] = useState({ pending: 0, purchased: 0, settled: 0 });

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

  const loadExpenses = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/accounts?view=${view}&q=${encodeURIComponent(search)}`,
        {
          headers: {
            "x-accounts-user": user,
          },
          cache: "no-store",
        }
      );

      const payload = (await response.json()) as ListResponse | { error?: string };
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || "Failed to fetch expenses.");
      }

      const data = payload as ListResponse;
      setExpenses(Array.isArray(data.data) ? data.data : []);
      setCounts(data.counts || { pending: 0, purchased: 0, settled: 0 });
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to fetch expenses.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, view]);

  const handleSearchSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await loadExpenses();
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
    if (!user || receiptFiles.length === 0) return [];

    const uploaded: ReceiptAttachment[] = [];

    for (const file of receiptFiles) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/accounts/upload", {
        method: "POST",
        headers: {
          "x-accounts-user": user,
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
    if (!user) return;

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
          "x-accounts-user": user,
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
      await loadExpenses();
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Failed to create expense.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpenseAction = async (id: string, action: string) => {
    if (!user) return;

    setBusyExpenseId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-accounts-user": user,
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-4">
            <Image src="/socio.svg" alt="SOCIO" width={54} height={54} className="h-14 w-14" priority />
            <div>
              <h1 className="text-2xl font-black text-slate-900">SOCIO Accounts</h1>
              <p className="text-sm text-slate-600">Open using a valid direct link.</p>
            </div>
          </div>

          <p className="mb-4 text-slate-700">Use one of these direct links:</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/accounts?user=sachin"
              className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              /accounts?user=sachin
            </Link>
            <Link
              href="/accounts?user=surya"
              className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              /accounts?user=surya
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe_0%,_#f8fafc_45%,_#f8fafc_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Image src="/socio.svg" alt="SOCIO" width={56} height={56} className="h-14 w-14" priority />
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">SOCIO Accounts</h1>
                <p className="text-sm text-slate-600">
                  Logged in as <span className="font-bold uppercase text-blue-700">{user}</span> via direct link
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setView("pending")}
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
                onClick={() => setView("processed")}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  view === "processed"
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                Processed Expenses
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
        </header>

        <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-extrabold text-slate-900">Create New Expense</h2>
            <p className="mt-1 text-sm text-slate-600">
              Add reason, split percentages, and optional receipt files.
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
                  placeholder="Example: Lighting equipment for campus workshop"
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
                <p className="mt-1 text-xs text-slate-500">
                  Default notification goes to thesocio.blr@gmail.com.
                </p>
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
                Loading expenses...
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
                  ((user === "sachin" && !sachinApproved) || (user === "surya" && !suryaApproved));
                const canMarkPurchased =
                  expense.status === "pending_approval" && sachinApproved && suryaApproved;
                const canMarkSettled = expense.status === "purchased";

                return (
                  <article
                    key={expense.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
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

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">Split</p>
                        <p className="mt-1">
                          Sachin: {expense.split_sachin_percent}% ({formatINR(expense.split_sachin_amount)})
                        </p>
                        <p>
                          Surya: {expense.split_surya_percent}% ({formatINR(expense.split_surya_amount)})
                        </p>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">Approvals (IST)</p>
                        <p className="mt-1">Sachin: {formatISTDateTime(expense.approval_sachin_at)}</p>
                        <p>Surya: {formatISTDateTime(expense.approval_surya_at)}</p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                        <p>
                          Purchased At: <span className="font-medium">{formatISTDateTime(expense.purchased_at)}</span>
                        </p>
                        <p>
                          Settled At: <span className="font-medium">{formatISTDateTime(expense.settled_at)}</span>
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
                    </div>

                    {expense.internal_notes ? (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">Notes</p>
                        <p className="mt-1 whitespace-pre-wrap">{expense.internal_notes}</p>
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {canApprove ? (
                        <button
                          type="button"
                          onClick={() => handleExpenseAction(expense.id, "approve")}
                          disabled={busyExpenseId === expense.id}
                          className="rounded-lg border border-amber-400 bg-amber-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-amber-900 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busyExpenseId === expense.id ? "Saving..." : `Approve as ${user}`}
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

                      {expense.status === "settled" ? (
                        <Link
                          href={`/accounts/bill/${expense.id}?user=${user}`}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-800 transition hover:border-slate-400"
                        >
                          Print Bill
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
