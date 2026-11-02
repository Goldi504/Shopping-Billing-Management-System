import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createPortal } from "react-dom";

import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Users,
  Package,
  AlertCircle,
  ArrowUpRight,
  RefreshCw,
  Smartphone,
  X,
} from "lucide-react";

import {
  getDashboardSummary,
  getTodaySales,
  getRecentSales,
  getStockSummary,
  getCustomerStatistics,
  getMonthlySales,
} from "../../services/dashboard.api";

// ============================================
// CONSTANTS
// ============================================

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const shortMonthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const GOLD = "#E9B83F";
const GOLD_DARK = "#9B6B00";

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");

const getLocalDate = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDate = (value) => {
  if (!value) return new Date();

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
};

const toDateString = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const formatSelectedDate = (value) => {
  if (!value) return "Select date";

  return parseDate(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ============================================
// DASHBOARD COMPONENT
// ============================================

function Dashboard() {
  // Dashboard states
  const [summary, setSummary] = useState(null);
  const [todaySales, setTodaySales] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [stockSummary, setStockSummary] = useState([]);
  const [customerStats, setCustomerStats] = useState(null);
  const [monthlySales, setMonthlySales] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Calendar states
  const [selectedDate, setSelectedDate] = useState(getLocalDate);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const calendarButtonRef = useRef(null);

  const [calendarPosition, setCalendarPosition] = useState({
    top: 0,
    right: 12,
  });

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = new Date();

    return {
      month: date.getMonth(),
      year: date.getFullYear(),
    };
  });

  // ============================================
  // LOAD DASHBOARD DATA
  // ============================================

  const loadDashboard = useCallback(async (refresh = false) => {
    try {
      setError("");

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [
        summaryResponse,
        todayResponse,
        recentResponse,
        stockResponse,
        customerResponse,
        monthlyResponse,
      ] = await Promise.all([
        getDashboardSummary(),
        getTodaySales(),
        getRecentSales(10),
        getStockSummary(),
        getCustomerStatistics(),
        getMonthlySales(),
      ]);

      setSummary(summaryResponse?.summary || {});
      setTodaySales(todayResponse || {});
      setRecentSales(recentResponse?.sales || []);
      setStockSummary(stockResponse?.stock || []);
      setCustomerStats(customerResponse?.customers || {});
      setMonthlySales(monthlyResponse?.monthlySales || []);
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(err?.response?.data?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ============================================
  // CLOSE CALENDAR WITH ESCAPE
  // ============================================

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setCalendarOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // ============================================
  // RESPONSIVE CALENDAR POSITIONING
  // ============================================

  const updateCalendarPosition = useCallback(() => {
    const mobile = window.innerWidth < 640;

    setIsMobile(mobile);

    if (mobile) {
      setCalendarPosition({
        top: 12,
        right: 0,
      });

      return;
    }

    if (!calendarButtonRef.current) return;

    const rect = calendarButtonRef.current.getBoundingClientRect();

    setCalendarPosition({
      top: rect.bottom + 8,
      right: Math.max(12, window.innerWidth - rect.right),
    });
  }, []);

  useEffect(() => {
    if (!calendarOpen) return;

    updateCalendarPosition();

    window.addEventListener("resize", updateCalendarPosition);

    window.addEventListener("scroll", updateCalendarPosition, true);

    return () => {
      window.removeEventListener("resize", updateCalendarPosition);

      window.removeEventListener("scroll", updateCalendarPosition, true);
    };
  }, [calendarOpen, updateCalendarPosition]);

  // ============================================
  // DASHBOARD SUMMARY VALUES
  // ============================================

  const totalCustomers = summary?.totalCustomers || 0;

  const availableStock = summary?.availableStock || 0;

  const soldStock = summary?.soldStock || 0;

  const totalRevenue = summary?.totalRevenue || 0;

  const totalProducts = Number(availableStock) + Number(soldStock);

  const lowStockCount =
    stockSummary.find((item) => item._id === "LOW_STOCK")?.count || 0;

  // ============================================
  // TOP SELLING PRODUCTS
  // ============================================

  const topProducts = useMemo(() => {
    const productMap = {};

    recentSales.forEach((sale) => {
      const product = sale.product;

      if (!product) return;

      const productId = product._id || product.id;

      if (!productId) return;

      const productName = product.model || product.name || "Mobile";

      if (!productMap[productId]) {
        productMap[productId] = {
          id: productId,
          name: productName,
          sold: 0,
        };
      }

      productMap[productId].sold += 1;
    });

    return Object.values(productMap)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [recentSales]);

  // ============================================
  // MONTHLY SALES CHART DATA
  // ============================================

  const chartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const found = monthlySales.find(
        (item) => Number(item?._id?.month) === index + 1,
      );

      return {
        month: shortMonthNames[index],
        revenue: Number(found?.revenue || 0),
      };
    });
  }, [monthlySales]);

  const maxRevenue = Math.max(...chartData.map((item) => item.revenue), 1);

  // ============================================
  // CALENDAR DAYS
  // MONDAY FIRST
  // ============================================

  const calendarDays = useMemo(() => {
    const { month, year } = visibleMonth;

    const firstDay = new Date(year, month, 1).getDay();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const mondayOffset = (firstDay + 6) % 7;

    const cells = [];

    // Empty cells before first day
    for (let i = 0; i < mondayOffset; i++) {
      cells.push(null);
    }

    // Actual dates
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(day);
    }

    // Complete calendar rows
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [visibleMonth]);

  // ============================================
  // CHANGE MONTH
  // ============================================

  const changeMonth = (amount) => {
    setVisibleMonth((current) => {
      const date = new Date(current.year, current.month + amount, 1);

      return {
        month: date.getMonth(),
        year: date.getFullYear(),
      };
    });
  };

  // ============================================
  // SELECT DATE
  // ============================================

  const chooseDate = (day) => {
    setSelectedDate(toDateString(visibleMonth.year, visibleMonth.month, day));

    setCalendarOpen(false);
  };

  // ============================================
  // GO TO TODAY
  // ============================================

  const goToToday = () => {
    const today = new Date();

    setSelectedDate(getLocalDate());

    setVisibleMonth({
      month: today.getMonth(),
      year: today.getFullYear(),
    });

    setCalendarOpen(false);
  };

  // ============================================
  // LOADING SCREEN
  // ============================================

  if (loading) {
    return (
      <div className="min-w-0 space-y-6 rounded-2xl bg-[#F4F0E6] p-4 sm:p-6">
        <div className="h-9 w-48 animate-pulse rounded-lg bg-[#E9DFC9]" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl border border-[#E6D9BC] bg-[#FFFEFA]"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="h-[420px] animate-pulse rounded-2xl bg-[#FFFEFA] xl:col-span-2" />
          <div className="h-[420px] animate-pulse rounded-2xl bg-[#FFFEFA]" />
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR SCREEN
  // ============================================

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-[#E6D9BC] bg-[#FFFEFA] px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle size={25} className="text-red-500" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-[#171914]">
            Dashboard could not load
          </h2>

          <p className="mt-2 text-sm text-[#777263]">{error}</p>

          <button
            type="button"
            onClick={() => loadDashboard()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F2C94C] px-5 py-3 text-sm font-bold text-[#171914] transition hover:bg-[#E6B632]"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // DASHBOARD MAIN UI
  // ============================================

  return (
    <div className="relative min-w-0 -m-3 min-h-full space-y-6 bg-[#F4F0E6] p-4 text-[#171914] sm:-m-5 sm:p-6 lg:-m-6 lg:p-7">
      {/* ======================================
          PAGE HEADING
      ====================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#E8D59A] bg-[#FFF5D6] px-3 py-1 text-xs font-bold tracking-wide text-[#79570A]">
            <span className="h-2 w-2 rounded-full bg-[#E9B83F]" />
            SHOP OVERVIEW
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-[#171914]">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-[#746D5E]">
            Good morning, Admin! Here's what's happening today.
          </p>
        </div>

        {/* ======================================
            REFRESH AND DATE BUTTON
        ====================================== */}

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            aria-label="Refresh dashboard"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E5D9C1] bg-[#FFFEFA] text-[#796333] shadow-sm transition hover:border-[#D9AD35] hover:bg-[#FFF5D6] disabled:opacity-60"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
          </button>

          <div className="relative min-w-0">
            <button
              ref={calendarButtonRef}
              type="button"
              onClick={() => setCalendarOpen((open) => !open)}
              aria-expanded={calendarOpen}
              aria-haspopup="dialog"
              className="flex min-w-0 items-center gap-2 rounded-xl border border-[#E5D9C1] bg-[#FFFEFA] px-3 py-3 text-sm font-semibold text-[#29271F] shadow-sm transition hover:border-[#D9AD35] hover:bg-[#FFF9E9] sm:gap-3 sm:px-4"
            >
              <CalendarDays size={17} className="shrink-0 text-[#A7790D]" />

              <span className="whitespace-nowrap">
                {formatSelectedDate(selectedDate)}
              </span>

              <ChevronDown
                size={16}
                className={`shrink-0 transition-transform ${
                  calendarOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================
          RESPONSIVE CALENDAR POPUP
          RENDERED OUTSIDE DASHBOARD CONTAINER
      ====================================== */}

      {calendarOpen &&
        createPortal(
          <>
            {/* BACKDROP */}

            <button
              type="button"
              aria-label="Close calendar"
              onClick={() => setCalendarOpen(false)}
              className="fixed inset-0 z-[9998] bg-black/20 sm:bg-transparent"
            />

            {/* CALENDAR CONTAINER */}

            <div
              role="dialog"
              aria-modal="true"
              aria-label="Choose a date"
              className="
                fixed z-[9999]
                box-border
                w-[calc(100vw-24px)]
                max-w-[360px]
                max-h-[calc(100dvh-24px)]
                overflow-y-auto
                overflow-x-hidden
                rounded-2xl
                border border-[#E6D9BD]
                bg-[#FFFEFA]
                p-4
                shadow-[0_18px_50px_rgba(35,29,16,0.20)]
                sm:p-5
              "
              style={{
                top: isMobile ? "12px" : `${calendarPosition.top}px`,

                right: isMobile ? "12px" : `${calendarPosition.right}px`,
              }}
            >
              {/* CALENDAR HEADER */}

              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-base font-extrabold text-[#242117]">
                    Choose a date
                  </h2>

                  <p className="mt-1 text-xs text-[#8A806D]">
                    Select month, year and day
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close calendar"
                  onClick={() => setCalendarOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#82765E] transition hover:bg-[#F4EBD7]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* MONTH AND YEAR SELECTORS */}

              <div className="grid w-full grid-cols-[minmax(0,1fr)_100px] gap-2">
                <select
                  aria-label="Choose month"
                  value={visibleMonth.month}
                  onChange={(event) =>
                    setVisibleMonth((current) => ({
                      ...current,
                      month: Number(event.target.value),
                    }))
                  }
                  className="h-11 min-w-0 w-full rounded-lg border border-[#E6D9BD] bg-[#FBF8F0] px-2 text-sm font-semibold text-[#302B20] outline-none focus:border-[#C99A24] focus:ring-2 focus:ring-[#F2C94C]/20"
                >
                  {monthNames.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Choose year"
                  value={visibleMonth.year}
                  onChange={(event) =>
                    setVisibleMonth((current) => ({
                      ...current,
                      year: Number(event.target.value),
                    }))
                  }
                  className="h-11 min-w-0 w-full rounded-lg border border-[#E6D9BD] bg-[#FBF8F0] px-2 text-sm font-semibold text-[#302B20] outline-none focus:border-[#C99A24] focus:ring-2 focus:ring-[#F2C94C]/20"
                >
                  {Array.from(
                    { length: 31 },
                    (_, index) => new Date().getFullYear() - 15 + index,
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* =================================
                  MONTH NAVIGATION
              ================================= */}

              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => changeMonth(-1)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E9DFC9] text-[#655638] transition hover:bg-[#FFF3CD]"
                >
                  <ChevronLeft size={19} />
                </button>

                <p className="min-w-0 text-center text-sm font-bold text-[#302B20]">
                  {monthNames[visibleMonth.month]} {visibleMonth.year}
                </p>

                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => changeMonth(1)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E9DFC9] text-[#655638] transition hover:bg-[#FFF3CD]"
                >
                  <ChevronRight size={19} />
                </button>
              </div>

              {/* =================================
                  WEEKDAY HEADINGS
              ================================= */}

              <div className="mt-4 grid grid-cols-7 gap-1">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                  <div
                    key={day}
                    className="flex h-9 min-w-0 items-center justify-center text-xs font-bold text-[#94866B]"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* =================================
                  CALENDAR DATE GRID
              ================================= */}

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="aspect-square min-w-0"
                      />
                    );
                  }

                  const dateValue = toDateString(
                    visibleMonth.year,
                    visibleMonth.month,
                    day,
                  );

                  const isSelected = dateValue === selectedDate;

                  const isToday = dateValue === getLocalDate();

                  return (
                    <button
                      key={dateValue}
                      type="button"
                      onClick={() => chooseDate(day)}
                      aria-pressed={isSelected}
                      aria-label={`${day} ${monthNames[visibleMonth.month]} ${visibleMonth.year}`}
                      className={`
                        flex aspect-square min-w-0 w-full
                        items-center justify-center
                        rounded-lg text-sm transition
                        ${
                          isSelected
                            ? "bg-[#E9B83F] font-extrabold text-[#171914] shadow-sm"
                            : "text-[#383328] hover:bg-[#FFF0BF]"
                        }
                        ${
                          isToday && !isSelected
                            ? "font-extrabold ring-1 ring-inset ring-[#D5A329]"
                            : ""
                        }
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* =================================
                  CALENDAR FOOTER
              ================================= */}

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#EEE5D3] pt-3">
                <button
                  type="button"
                  onClick={goToToday}
                  className="rounded-lg px-3 py-2 text-sm font-bold text-[#79570A] transition hover:bg-[#FFF3CD]"
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => setCalendarOpen(false)}
                  className="rounded-lg bg-[#E9B83F] px-5 py-2.5 text-sm font-bold text-[#171914] transition hover:bg-[#D9A92F]"
                >
                  Done
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}

      {/* PART 3 STARTS HERE */}

      {/* ======================================
          SUMMARY CARDS
      ====================================== */}

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* TOTAL SALES */}

        <StatCard
          title="Total Sales"
          value={formatMoney(totalRevenue)}
          icon={ShoppingCart}
          iconClass="bg-[#FFF1C6] text-[#986900]"
          change="+12%"
          changeClass="text-emerald-700"
        />

        {/* TOTAL CUSTOMERS */}

        <StatCard
          title="Total Customers"
          value={formatNumber(totalCustomers)}
          icon={Users}
          iconClass="bg-[#E1F3E7] text-[#18794E]"
          change={
            customerStats?.newCustomersToday
              ? `+${customerStats.newCustomersToday}`
              : "0"
          }
          changeClass="text-emerald-700"
          changeText="new today"
        />

        {/* TOTAL PRODUCTS */}

        <StatCard
          title="Total Products"
          value={formatNumber(totalProducts)}
          icon={Package}
          iconClass="bg-[#FFF0DB] text-[#A85B0A]"
          change={formatNumber(availableStock)}
          changeClass="text-[#A85B0A]"
          changeText="available"
        />

        {/* LOW STOCK */}

        <StatCard
          title="Low Stock Items"
          value={formatNumber(lowStockCount)}
          icon={AlertCircle}
          iconClass="bg-[#FCE8E6] text-[#C24136]"
          change={formatNumber(soldStock)}
          changeClass="text-[#C24136]"
          changeText="sold stock"
        />
      </div>

      {/* ======================================
          SALES CHART AND TOP PRODUCTS LAYOUT
      ====================================== */}

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ==================================
            SALES OVERVIEW
        ================================== */}

        <section className="min-w-0 overflow-hidden rounded-2xl border border-[#E6D9BD] bg-[#FFFEFA] p-4 shadow-[0_4px_18px_rgba(65,48,15,0.045)] transition duration-300 hover:border-[#DCC68F] hover:shadow-md sm:p-6 xl:col-span-2">
          {/* Chart Header */}

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#171914]">
                Sales Overview
              </h2>

              <p className="mt-1 text-sm text-[#777263]">
                Monthly sales performance
              </p>
            </div>

            <span className="shrink-0 rounded-lg border border-[#E8D59A] bg-[#FFF7DF] px-3 py-2 text-xs font-bold text-[#79570A]">
              This Year
            </span>
          </div>

          {/* Chart */}

          {/* Chart */}

          <div className="mt-6 flex h-[290px] min-w-0 flex-col sm:mt-8 sm:h-[330px]">
            {/* SVG Chart */}

            <svg
              viewBox="0 0 800 300"
              className="block min-h-0 w-full flex-1"
              preserveAspectRatio="none"
              role="img"
              aria-label="Monthly revenue chart"
            >
              {/* Horizontal Grid Lines */}

              {[50, 100, 150, 200, 250].map((y) => (
                <line
                  key={y}
                  x1="45"
                  y1={y}
                  x2="775"
                  y2={y}
                  stroke="#EAE1CF"
                  strokeDasharray="5 5"
                />
              ))}

              {/* Revenue Line */}

              {(() => {
                const points = chartData.map((item, index) => {
                  const x = 45 + (index * 730) / 11;
                  const y = 255 - (item.revenue / maxRevenue) * 205;

                  return `${x},${y}`;
                });

                return (
                  <>
                    <polyline
                      points={points.join(" ")}
                      fill="none"
                      stroke={GOLD}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Chart Points */}

                    {chartData.map((item, index) => {
                      const x = 45 + (index * 730) / 11;
                      const y = 255 - (item.revenue / maxRevenue) * 205;

                      return (
                        <circle
                          key={item.month}
                          cx={x}
                          cy={y}
                          r="5"
                          fill="#FFFEFA"
                          stroke={GOLD_DARK}
                          strokeWidth="3"
                        >
                          <title>
                            {item.month}: {formatMoney(item.revenue)}
                          </title>
                        </circle>
                      );
                    })}
                  </>
                );
              })()}
            </svg>

            {/* Responsive Month Labels */}

            <div className="grid shrink-0 grid-cols-12 items-center gap-0 px-0.5 pt-3">
              {chartData.map((item) => (
                <span
                  key={item.month}
                  className="min-w-0 text-center text-[9px] font-medium text-[#918875] sm:text-[11px]"
                >
                  {item.month}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* PART 4: TOP SELLING PRODUCTS */}

        {/* ==================================
            TOP SELLING PRODUCTS
        ================================== */}

        <section className="min-w-0 overflow-hidden rounded-2xl border border-[#E6D9BD] bg-[#FFFEFA] p-5 shadow-[0_4px_18px_rgba(65,48,15,0.045)] transition duration-300 hover:border-[#DCC68F] hover:shadow-md sm:p-6">
          {/* Header */}

          <div>
            <h2 className="text-lg font-bold text-[#171914]">
              Top Selling Products
            </h2>

            <p className="mt-1 text-sm text-[#777263]">Based on recent sales</p>
          </div>

          {/* Products */}

          <div className="mt-6 space-y-5">
            {topProducts.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#918875]">
                No sales available
              </div>
            ) : (
              topProducts.map((product) => (
                <div
                  key={product.id}
                  className="group flex min-w-0 items-center gap-3"
                >
                  {/* Product Icon */}

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF1C6] transition group-hover:bg-[#FBE7A5]">
                    <Smartphone size={19} className="text-[#986900]" />
                  </div>

                  {/* Product Information */}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-[#29271F]">
                        {product.name}
                      </p>

                      <span className="shrink-0 text-xs text-[#777263]">
                        {product.sold} sold
                      </span>
                    </div>

                    {/* Sales Progress */}

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EEE5D3]">
                      <div
                        className="h-full rounded-full bg-[#E9B83F] transition-all duration-500 group-hover:bg-[#D5A329]"
                        style={{
                          width: `${Math.min(product.sold * 20, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// ============================================
// STAT CARD COMPONENT
// ============================================

function StatCard({
  title,
  value,
  icon: Icon,
  iconClass,
  change,
  changeClass,
  changeText,
}) {
  return (
    <div className="group min-w-0 rounded-2xl border border-[#E6D9BD] bg-[#FFFEFA] p-5 shadow-[0_4px_18px_rgba(65,48,15,0.045)] transition-all duration-300 hover:-translate-y-1 hover:border-[#DCC68F] hover:shadow-md">
      {/* Card Header */}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#777263]">{title}</p>

          <h2 className="mt-3 break-words text-2xl font-extrabold text-[#171914]">
            {value}
          </h2>
        </div>

        {/* Icon */}

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition duration-300 group-hover:scale-105 ${iconClass}`}
        >
          <Icon size={21} />
        </div>
      </div>

      {/* Card Footer */}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span
          className={`flex items-center gap-1 text-xs font-bold ${changeClass}`}
        >
          <ArrowUpRight size={14} />

          {change}
        </span>

        <span className="text-xs text-[#918875]">
          {changeText || "from last week"}
        </span>
      </div>
    </div>
  );
}

// ============================================
// EXPORT DASHBOARD
// ============================================

export default Dashboard;
