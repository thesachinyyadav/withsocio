"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type AccountsUser = "sachin" | "surya";

type ReceiptAttachment = {
  name: string;
  url: string;
};

type ExpenseRecord = {
  id: string;
  expense_date: string;
  reason: string;
  total_amount: number | string;
  status: "pending_approval" | "purchased" | "settled";
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
  created_at: string;
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

function formatIST(value: string | null): string {
  if (!value) return "-";
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

export default function AccountsBillPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const user = normalizeUser(searchParams.get("user"));
  const expenseId = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expense, setExpense] = useState<ExpenseRecord | null>(null);

  const [showReason, setShowReason] = useState(true);
  const [showSplit, setShowSplit] = useState(true);
  const [showApprovals, setShowApprovals] = useState(true);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showReceipts, setShowReceipts] = useState(true);
  const [showNotes, setShowNotes] = useState(true);

  useEffect(() => {
    const loadBill = async () => {
      if (!user || !expenseId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/accounts/${expenseId}`, {
          headers: {
            "x-accounts-user": user,
          },
          cache: "no-store",
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load expense details.");
        }

        setExpense(payload?.data || null);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Failed to load expense details.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadBill();
  }, [expenseId, user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Invalid Bill Access</h1>
          <p className="mt-2 text-sm text-slate-600">Open this page with a valid user link.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/accounts?user=sachin" className="text-sm font-semibold text-blue-700 hover:underline">
              sachin link
            </Link>
            <Link href="/accounts?user=surya" className="text-sm font-semibold text-blue-700 hover:underline">
              surya link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-100 px-4 py-6 print:bg-white">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="no-print rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Image src="/socio.svg" alt="SOCIO" width={40} height={40} className="h-10 w-10" />
                <div>
                  <h1 className="text-lg font-extrabold text-slate-900">Settle Bill Print</h1>
                  <p className="text-sm text-slate-600">Toggle sections before printing.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/accounts?user=${user}`}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  Back to Accounts
                </Link>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white"
                >
                  Print Bill
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                <input type="checkbox" checked={showReason} onChange={(e) => setShowReason(e.target.checked)} />
                Include Reason
              </label>
              <label className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                <input type="checkbox" checked={showSplit} onChange={(e) => setShowSplit(e.target.checked)} />
                Include Split
              </label>
              <label className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={showApprovals}
                  onChange={(e) => setShowApprovals(e.target.checked)}
                />
                Include Approvals
              </label>
              <label className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={showTimeline}
                  onChange={(e) => setShowTimeline(e.target.checked)}
                />
                Include Purchase/Settlement Time
              </label>
              <label className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={showReceipts}
                  onChange={(e) => setShowReceipts(e.target.checked)}
                />
                Include Receipts
              </label>
              <label className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                <input type="checkbox" checked={showNotes} onChange={(e) => setShowNotes(e.target.checked)} />
                Include Notes
              </label>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
              Loading bill...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : !expense ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
              No expense found.
            </div>
          ) : (
            <article className="print-card rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <Image src="/socio.svg" alt="SOCIO" width={44} height={44} className="h-11 w-11" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">SOCIO Accounts</p>
                    <h2 className="text-xl font-black text-slate-900">Expense Settlement Bill</h2>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Bill ID</p>
                  <p className="text-sm font-semibold text-slate-800">{expense.id}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Expense Date</p>
                  <p className="text-sm font-semibold text-slate-900">{formatISTDate(expense.expense_date)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Total Amount</p>
                  <p className="text-sm font-semibold text-slate-900">{formatINR(expense.total_amount)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Created By</p>
                  <p className="text-sm font-semibold uppercase text-slate-900">{expense.created_by_user}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                  <p className="text-sm font-semibold uppercase text-slate-900">
                    {expense.status.replaceAll("_", " ")}
                  </p>
                </div>
              </div>

              {showReason ? (
                <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-bold text-slate-900">Reason</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{expense.reason}</p>
                </section>
              ) : null}

              {showSplit ? (
                <section className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-bold text-slate-900">Payment Split</h3>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 text-sm text-slate-700">
                    <p>
                      Sachin: {expense.split_sachin_percent}% ({formatINR(expense.split_sachin_amount)})
                    </p>
                    <p>
                      Surya: {expense.split_surya_percent}% ({formatINR(expense.split_surya_amount)})
                    </p>
                  </div>
                </section>
              ) : null}

              {showApprovals ? (
                <section className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-bold text-slate-900">Approval Timestamps (IST)</h3>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 text-sm text-slate-700">
                    <p>Sachin: {formatIST(expense.approval_sachin_at)}</p>
                    <p>Surya: {formatIST(expense.approval_surya_at)}</p>
                  </div>
                </section>
              ) : null}

              {showTimeline ? (
                <section className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-bold text-slate-900">Processing Timeline (IST)</h3>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 text-sm text-slate-700">
                    <p>Purchased At: {formatIST(expense.purchased_at)}</p>
                    <p>Settled At: {formatIST(expense.settled_at)}</p>
                  </div>
                </section>
              ) : null}

              {showReceipts ? (
                <section className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-bold text-slate-900">Receipt Attachments</h3>
                  {Array.isArray(expense.receipt_attachments) && expense.receipt_attachments.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {expense.receipt_attachments.map((attachment, index) => (
                        <li key={`bill-receipt-${index}`}>
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
                    <p className="mt-2 text-sm text-slate-500">No receipts attached.</p>
                  )}
                </section>
              ) : null}

              {showNotes ? (
                <section className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-bold text-slate-900">Internal Notes</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {expense.internal_notes || "No notes added."}
                  </p>
                </section>
              ) : null}

              <p className="mt-6 text-center text-xs text-slate-500">
                Generated on {formatIST(new Date().toISOString())} (IST)
              </p>
            </article>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            background: #ffffff !important;
          }

          .print-card {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>
    </>
  );
}
