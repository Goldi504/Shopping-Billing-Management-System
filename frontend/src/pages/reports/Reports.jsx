import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  IndianRupee,
  ShoppingBag,
  CreditCard,
  RefreshCw,
  CalendarDays,
  Download,
  BarChart3,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import Sidebar from "../../components/layout/Sidebar";
import api from "../../services/api";

// ==========================================
// THEME COLORS
// ==========================================

const PAGE_BG = "#F4F0E6";
const CARD_BG = "#FFFEFA";
const BORDER_COLOR = "#E6D9BD";
const TEXT_COLOR = "#171914";
const MUTED_COLOR = "#746D5E";
const GOLD_COLOR = "#F4C64E";

// ==========================================
// FORMAT CURRENCY
// ==========================================

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

// ==========================================
// FORMAT NUMBERS
// ==========================================

const number = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value) || 0);

// ==========================================
// SUMMARY STAT CARD
// ==========================================

function StatCard({ title, value, icon: Icon, color, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.35,
      }}
      whileHover={{ y: -3 }}
      className="rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md"
      style={{
        backgroundColor: CARD_BG,
        borderColor: BORDER_COLOR,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className="text-sm"
          style={{ color: MUTED_COLOR }}
        >
          {title}
        </p>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={20} />
        </div>
      </div>

      <p
        className="mt-4 break-words text-2xl font-bold"
        style={{ color: TEXT_COLOR }}
      >
        {value}
      </p>
    </motion.div>
  );
}

// ==========================================
// REPORTS COMPONENT
// ==========================================

function Reports() {
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ========================================
  // LOAD REPORT DATA
  // ========================================

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        summaryResult,
        monthlyResult,
        paymentsResult,
      ] = await Promise.allSettled([
        api.get("/dashboard/summary"),
        api.get("/dashboard/monthly-sales"),
        api.get("/payments"),
      ]);

      // Summary data
      if (summaryResult.status === "fulfilled") {
        const data = summaryResult.value.data;

        setSummary(
          data?.summary ?? data?.data ?? data
        );
      } else {
        setSummary(null);
      }

      // Monthly sales data
      if (monthlyResult.status === "fulfilled") {
        const data = monthlyResult.value.data;

        const list = Array.isArray(data)
          ? data
          : data?.monthlySales ??
            data?.sales ??
            data?.data ??
            [];

        setSales(Array.isArray(list) ? list : []);
      } else {
        setSales([]);
      }

      // Payment data
      if (paymentsResult.status === "fulfilled") {
        const data = paymentsResult.value.data;

        const list = Array.isArray(data)
          ? data
          : data?.payments ??
            data?.data ??
            [];

        setPayments(Array.isArray(list) ? list : []);
      } else {
        setPayments([]);
      }

      // Show an error only if every request fails
      if (
        summaryResult.status === "rejected" &&
        monthlyResult.status === "rejected" &&
        paymentsResult.status === "rejected"
      ) {
        setError(
          "Could not load reports. Check your server connection and login status."
        );
      }
    } catch (err) {
      console.error("Reports loading error:", err);
      setError("Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // ========================================
  // GET AMOUNT
  // ========================================

  const getAmount = (item) =>
    Number(
      item?.totalAmount ??
        item?.totalSales ??
        item?.revenue ??
        item?.amount ??
        item?.total ??
        0
    );

  // ========================================
  // PAYMENT STATUS AND METHOD
  // ========================================

  const getStatus = (payment) =>
    String(payment?.status ?? "").toLowerCase();

  const getMethod = (payment) =>
    String(
      payment?.method ??
        payment?.paymentMethod ??
        payment?.methodType ??
        "Other"
    ).toLowerCase();

  // ========================================
  // TOTAL REVENUE
  // ========================================

  const totalRevenue = Number(
    summary?.totalRevenue ??
      summary?.totalSales ??
      summary?.revenue ??
      0
  );

  // ========================================
  // TOTAL SALES
  // ========================================

  const totalSales = Number(
    summary?.totalSalesCount ??
      summary?.salesCount ??
      summary?.totalOrders ??
      summary?.totalSales ??
      0
  );
    // ========================================
  // COMPLETED PAYMENTS
  // ========================================

  const completedPayments = payments.filter((payment) =>
    ["completed", "paid", "success", "successful"].includes(
      getStatus(payment)
    )
  );

  const completedAmount = completedPayments.reduce(
    (total, payment) => total + getAmount(payment),
    0
  );

  // ========================================
  // PAYMENT METHOD BREAKDOWN
  // ========================================

  const paymentMethods = [
    { name: "Cash", keys: ["cash"] },
    { name: "UPI", keys: ["upi"] },
    {
      name: "Card",
      keys: ["card", "credit card", "debit card"],
    },
    {
      name: "Other",
      keys: ["other", "online", "bank transfer"],
    },
  ].map((method) => {
    const matching = completedPayments.filter((payment) =>
      method.keys.includes(getMethod(payment))
    );

    return {
      name: method.name,
      count: matching.length,
      amount: matching.reduce(
        (total, payment) => total + getAmount(payment),
        0
      ),
    };
  });

  // ========================================
  // SALES CHART LABELS
  // ========================================

  const getSaleLabel = (item, index) =>
    item?.month ||
    item?.label ||
    item?.name ||
    item?.date ||
    `Record ${index + 1}`;

  // ========================================
  // SALES CHART VALUES
  // ========================================

  const getSaleValue = (item) =>
    Number(
      item?.totalAmount ??
        item?.totalSales ??
        item?.revenue ??
        item?.amount ??
        item?.total ??
        0
    );

  // ========================================
  // FILTER SALES BY PERIOD
  // ========================================

  const visibleSales =
    period === "all"
      ? sales
      : sales.slice(-6);

  // ========================================
  // CSV EXPORT
  // ========================================

  const exportCSV = () => {
    const rows = [
      ["Report", "Value"],
      ["Total Revenue", totalRevenue],
      ["Total Sales", totalSales],
      ["Completed Payments", completedPayments.length],
      ["Collected Payments", completedAmount],
      [],
      ["Sales Overview"],
      ["Period", "Sales Amount"],
      ...visibleSales.map((item, index) => [
        getSaleLabel(item, index),
        getSaleValue(item),
      ]),
      [],
      ["Payment Breakdown"],
      ["Payment Method", "Transactions", "Amount"],
      ...paymentMethods.map((item) => [
        item.name,
        item.count,
        item.amount,
      ]),
    ];

    const csvContent = rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "");
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "ganesh-mobile-shop-reports.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };
    // ========================================
  // REPORTS PAGE UI
  // ========================================

  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundColor: PAGE_BG,
        color: TEXT_COLOR,
      }}
    >
      <Sidebar />

      <main
        className="min-h-screen px-4 py-6 sm:px-6 lg:ml-[250px] lg:px-8"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div className="mx-auto max-w-[1600px] space-y-6">

          {/* PAGE HEADER */}

          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
          >
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#171914]">
                Reports
              </h1>

              <p className="mt-2 text-sm text-[#746D5E] sm:text-base">
                Track sales, revenue, and payment activity.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <motion.button
                type="button"
                onClick={loadReports}
                disabled={loading}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold text-[#171914] shadow-sm transition hover:bg-[#FFF6D9] disabled:opacity-50"
                style={{
                  backgroundColor: CARD_BG,
                  borderColor: BORDER_COLOR,
                }}
              >
                <RefreshCw
                  size={17}
                  className={
                    loading ? "animate-spin" : ""
                  }
                />
                Refresh
              </motion.button>

              <motion.button
                type="button"
                onClick={exportCSV}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-black shadow-sm transition hover:brightness-95"
                style={{ backgroundColor: GOLD_COLOR }}
              >
                <Download size={17} />
                Export CSV
              </motion.button>
            </div>
          </motion.header>

          {/* ERROR MESSAGE */}

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0"
              />

              <p className="flex-1">{error}</p>

              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
                className="font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* SUMMARY CARDS */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Revenue"
              value={money(totalRevenue)}
              icon={IndianRupee}
              color="bg-blue-50 text-blue-600"
              index={0}
            />

            <StatCard
              title="Sales"
              value={number(totalSales)}
              icon={ShoppingBag}
              color="bg-amber-50 text-amber-700"
              index={1}
            />

            <StatCard
              title="Completed Payments"
              value={number(completedPayments.length)}
              icon={CheckCircle2}
              color="bg-green-50 text-green-600"
              index={2}
            />

            <StatCard
              title="Collected Payments"
              value={money(completedAmount)}
              icon={CreditCard}
              color="bg-purple-50 text-purple-600"
              index={3}
            />
          </div>

          {/* SALES OVERVIEW SECTION */}

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="overflow-hidden rounded-2xl border p-5 shadow-sm sm:p-6"
            style={{
              backgroundColor: CARD_BG,
              borderColor: BORDER_COLOR,
            }}
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-[#171914]">
                  Sales Overview
                </h2>

                <p className="mt-1 text-sm text-[#746D5E]">
                  Sales data returned by your dashboard API.
                </p>
              </div>

              <div className="relative">
                <CalendarDays
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#746D5E]"
                />

                <select
                  value={period}
                  onChange={(event) =>
                    setPeriod(event.target.value)
                  }
                  className="w-full appearance-none rounded-xl border py-2.5 pl-10 pr-9 text-sm font-medium text-[#171914] outline-none focus:border-[#D4AF37] sm:w-auto"
                  style={{
                    backgroundColor: CARD_BG,
                    borderColor: BORDER_COLOR,
                  }}
                >
                  <option value="month">
                    Recent 6 records
                  </option>
                  <option value="all">
                    All records
                  </option>
                </select>
              </div>
            </div>

            {/* CHART AREA — PART 4 CONTINUES HERE */}
                        {/* SALES CHART AREA */}

            <div
              className="mt-6 min-h-[240px] rounded-2xl p-5 sm:p-6"
              style={{ backgroundColor: "#F8F5ED" }}
            >
              {loading ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
                  <RefreshCw
                    size={28}
                    className="animate-spin text-[#B58B16]"
                  />

                  <p className="text-sm text-[#746D5E]">
                    Loading sales data...
                  </p>
                </div>
              ) : visibleSales.length === 0 ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                  <BarChart3
                    size={34}
                    className="text-[#B9B5AA]"
                  />

                  <h3 className="mt-4 font-semibold text-[#171914]">
                    No sales chart data available
                  </h3>

                  <p className="mt-1 max-w-md text-sm text-[#746D5E]">
                    The monthly-sales endpoint may return a
                    different data format, or no sales have
                    been recorded yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {visibleSales.map((item, index) => {
                    const value = getSaleValue(item);

                    const maxValue = Math.max(
                      ...visibleSales.map(getSaleValue),
                      1
                    );

                    const width = Math.max(
                      (value / maxValue) * 100,
                      value > 0 ? 3 : 0
                    );

                    return (
                      <div
                        key={
                          item?._id ||
                          item?.id ||
                          `${getSaleLabel(item, index)}-${index}`
                        }
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-medium text-[#746D5E]">
                            {getSaleLabel(item, index)}
                          </span>

                          <span className="shrink-0 text-sm font-bold text-[#171914]">
                            {money(value)}
                          </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-[#E9E1CF]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${width}%` }}
                            transition={{
                              duration: 0.65,
                              delay: index * 0.06,
                            }}
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: GOLD_COLOR,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.section>

          {/* PAYMENT BREAKDOWN */}

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="overflow-hidden rounded-2xl border p-5 shadow-sm sm:p-6"
            style={{
              backgroundColor: CARD_BG,
              borderColor: BORDER_COLOR,
            }}
          >
            <div className="mb-5">
              <h2 className="text-lg font-bold text-[#171914]">
                Payment Breakdown
              </h2>

              <p className="mt-1 text-sm text-[#746D5E]">
                Completed payments grouped by payment method.
              </p>
            </div>

            {loading ? (
              <div className="flex min-h-[120px] items-center justify-center gap-2 text-sm text-[#746D5E]">
                <RefreshCw
                  size={18}
                  className="animate-spin"
                />
                Loading payment data...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-left">
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#F5F0E4",
                      }}
                    >
                      <th className="rounded-l-lg px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#746D5E]">
                        Payment Method
                      </th>

                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#746D5E]">
                        Transactions
                      </th>

                      <th className="rounded-r-lg px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#746D5E]">
                        Amount Collected
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paymentMethods.map((item) => (
                      <tr
                        key={item.name}
                        className="border-b last:border-b-0"
                        style={{
                          borderColor: "#EEE5D2",
                        }}
                      >
                        <td className="px-4 py-4 text-sm font-semibold text-[#171914]">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor: GOLD_COLOR,
                              }}
                            />

                            {item.name}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-sm text-[#746D5E]">
                          {number(item.count)}
                        </td>

                        <td className="px-4 py-4 text-right text-sm font-bold text-[#171914]">
                          {money(item.amount)}
                        </td>
                      </tr>
                    ))}

                    {paymentMethods.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-8 text-center text-sm text-[#746D5E]"
                        >
                          No payment data available.
                        </td>
                      </tr>
                    )}
                  </tbody>

                  <tfoot>
                    <tr
                      style={{
                        backgroundColor: "#FFF6D9",
                      }}
                    >
                      <td className="rounded-l-lg px-4 py-3 text-sm font-bold text-[#171914]">
                        Total
                      </td>

                      <td className="px-4 py-3 text-sm font-bold text-[#171914]">
                        {number(
                          paymentMethods.reduce(
                            (total, item) =>
                              total + item.count,
                            0
                          )
                        )}
                      </td>

                      <td className="rounded-r-lg px-4 py-3 text-right text-sm font-bold text-[#171914]">
                        {money(completedAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </motion.section>

          {/* FOOTER NOTE */}

          <div className="flex flex-col justify-between gap-2 pb-4 text-xs text-[#746D5E] sm:flex-row">
            <p>
              Ganesh Mobile Shop · Reports
            </p>

            <p>
              Figures are based on the data returned by your APIs.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Reports;