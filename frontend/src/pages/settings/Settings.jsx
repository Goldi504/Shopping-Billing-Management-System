import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  UserRound,
  ReceiptText,
  Bell,
  ShieldCheck,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Mail,
  Phone,
  MapPin,
  FileText,
  Eye,
  EyeOff,
} from "lucide-react";

import Sidebar from "../../components/layout/Sidebar";
import api from "../../services/api";

// =====================================================
// THEME COLORS — MATCH YOUR OTHER SHOP MANAGEMENT PAGES
// =====================================================

const PAGE_BG = "#FFF6D9";
const CARD_BG = "#FFFEFA";
const BORDER_COLOR = "#E6D9BD";
const TEXT_COLOR = "#171914";
const MUTED_COLOR = "#746D5E";
const GOLD_COLOR = "#E9B83F";
const GOLD_HOVER = "#DDAF2E";

const initialSettings = {
  shopName: "Ganesh Mobile Shop",
  phone: "",
  email: "admin@gmail.com",
  address: "Bhopal, Madhya Pradesh",
  currency: "INR",
  invoicePrefix: "INV-",
  taxRate: "0",
  warranty: "As per manufacturer warranty.",
  invoiceNote: "Thank you for shopping with us!",
  lowStockAlerts: true,
  paymentAlerts: true,
  saleAlerts: true,
};

const sections = [
  { id: "shop", label: "Shop Profile", icon: Store },
  { id: "business", label: "Business", icon: IndianRupee },
  { id: "invoice", label: "Invoice", icon: ReceiptText },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: ShieldCheck },
];

// =====================================================
// REUSABLE ANIMATED BUTTON
// =====================================================

function AnimatedButton({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
  className = "",
}) {
  const primary = variant === "primary";

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={
        disabled
          ? {}
          : {
              y: -2,
              scale: 1.015,
              boxShadow: primary
                ? "0 8px 18px rgba(190, 145, 30, 0.18)"
                : "0 6px 14px rgba(90, 70, 30, 0.08)",
            }
      }
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
        primary
          ? "bg-[#E9B83F] text-[#171914] hover:bg-[#DDAF2E]"
          : "border border-[#E6D9BD] bg-[#FFFEFA] text-[#171914] hover:bg-[#FFF6D9]"
      } ${className}`}
    >
      {children}
    </motion.button>
  );
}

// =====================================================
// REUSABLE INPUT FIELD
// =====================================================

function Field({ label, icon: Icon, ...props }) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.18 }}
      className="min-w-0"
    >
      <label
        htmlFor={props.id}
        className="mb-2 block text-sm font-semibold"
        style={{ color: TEXT_COLOR }}
      >
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: MUTED_COLOR }}
          />
        )}

        <input
          {...props}
          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-[#E9B83F] focus:ring-4 focus:ring-[#E9B83F]/15 ${
            Icon ? "pl-10" : ""
          }`}
          style={{
            backgroundColor: CARD_BG,
            borderColor: BORDER_COLOR,
            color: TEXT_COLOR,
          }}
        />
      </div>
    </motion.div>
  );
}

// =====================================================
// REUSABLE ANIMATED TOGGLE
// =====================================================

function Toggle({ title, description, checked, onChange }) {
  return (
    <motion.div
      whileHover={{ x: 3 }}
      transition={{ duration: 0.18 }}
      className="flex items-center justify-between gap-4 border-b py-4 last:border-b-0"
      style={{ borderColor: BORDER_COLOR }}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: TEXT_COLOR }}>
          {title}
        </p>

        <p
          className="mt-1 text-xs leading-5"
          style={{ color: MUTED_COLOR }}
        >
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-[#E9B83F]" : "bg-[#D6D0C3]"
        }`}
      >
        <motion.span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
          animate={{ x: checked ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </motion.div>
  );
}

// =====================================================
// ANIMATED CARD
// =====================================================

function AnimatedCard({ children, className = "", ...props }) {
  return (
    <motion.div
      {...props}
      whileHover={{
        y: -3,
        boxShadow: "0 12px 28px rgba(100, 75, 20, 0.08)",
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`rounded-2xl border ${className}`}
      style={{
        backgroundColor: CARD_BG,
        borderColor: BORDER_COLOR,
        ...props.style,
      }}
    >
      {children}
    </motion.div>
  );
}

// =====================================================
// MAIN SETTINGS COMPONENT
// =====================================================

function Settings() {
  const [settings, setSettings] = useState(initialSettings);
  const [activeSection, setActiveSection] = useState("shop");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (name, value) => {
    setSettings((previous) => ({
      ...previous,
      [name]: value,
    }));

    setNotice("");
    setError("");
  };

  const resetSettings = () => {
    setSettings(initialSettings);
    setNotice("");
    setError("");
  };

  // The actual settings save endpoint must exist in your backend.
  const saveSettings = async () => {
    setSaving(true);
    setNotice("");
    setError("");

    try {
      // This checks whether the endpoint exists.
      // It does NOT save the changed settings.
      await api.get("/settings");

      setError(
        "The settings endpoint responded, but a save endpoint has not been configured. Your changes have not been saved."
      );
    } catch (err) {
      if (err.response?.status === 404) {
        setError(
          "The settings API endpoint is not available yet. Your changes are currently only in this page."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Could not connect to the settings API. Your changes have not been saved."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const sectionTitle =
    sections.find((section) => section.id === activeSection)?.label ||
    "Settings";

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
        className="min-h-screen min-w-0 p-4 pt-20 sm:p-6 sm:pt-20 lg:ml-[250px] lg:p-8"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div className="mx-auto w-full max-w-[1400px]">

          {/* PAGE HEADER */}

          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Settings
              </h1>

              <p
                className="mt-2 text-sm"
                style={{ color: MUTED_COLOR }}
              >
                Manage your shop profile and preferences.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <AnimatedButton
                variant="secondary"
                onClick={resetSettings}
              >
                <RotateCcw size={16} />
                Reset
              </AnimatedButton>

              <AnimatedButton
                onClick={saveSettings}
                disabled={saving}
              >
                <Save size={17} />
                {saving ? "Checking..." : "Save Changes"}
              </AnimatedButton>
            </div>
          </motion.header>

          {/* SUCCESS MESSAGE */}

          <AnimatePresence>
            {notice && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="mb-5 flex items-start gap-3 overflow-hidden rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
              >
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                {notice}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ERROR MESSAGE */}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />

                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MAIN CONTENT */}

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">

            {/* SETTINGS NAVIGATION */}

            <motion.aside
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl border p-3 shadow-sm"
              style={{
                backgroundColor: CARD_BG,
                borderColor: BORDER_COLOR,
              }}
            >
              <p
                className="px-3 py-3 text-xs font-bold uppercase tracking-wider"
                style={{ color: MUTED_COLOR }}
              >
                General Settings
              </p>

              <nav className="flex gap-2 overflow-x-auto lg:flex-col">
                {sections.map((section, index) => {
                  const Icon = section.icon;
                  const active = activeSection === section.id;

                  return (
                    <motion.button
                      key={section.id}
                      type="button"
                      onClick={() => {
                        setActiveSection(section.id);
                        setNotice("");
                        setError("");
                      }}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.25,
                        delay: index * 0.04,
                      }}
                      whileHover={{
                        x: 3,
                        scale: 1.01,
                      }}
                      whileTap={{ scale: 0.97 }}
                      className={`relative flex shrink-0 items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-left text-sm transition-colors duration-200 ${
                        active
                          ? "font-semibold text-[#171914]"
                          : "text-[#746D5E] hover:text-[#171914]"
                      }`}
                      style={{
                        backgroundColor: active
                          ? GOLD_COLOR
                          : "transparent",
                      }}
                    >
                      {active && (
                        <motion.span
                          layoutId="settings-active-indicator"
                          className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-[#171914]"
                          transition={{
                            type: "spring",
                            stiffness: 450,
                            damping: 32,
                          }}
                        />
                      )}

                      <Icon size={18} />
                      {section.label}
                    </motion.button>
                  );
                })}
              </nav>
            </motion.aside>

            {/* SETTINGS CONTENT */}

            <AnimatePresence mode="wait">
              <motion.section
                key={activeSection}
                initial={{ opacity: 0, y: 15, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="min-w-0 overflow-hidden rounded-2xl border shadow-sm"
                style={{
                  backgroundColor: CARD_BG,
                  borderColor: BORDER_COLOR,
                }}
              >
                {/* SECTION HEADER */}

                <div
                  className="border-b p-5 sm:p-6"
                  style={{ borderColor: BORDER_COLOR }}
                >
                  <h2 className="text-lg font-bold">
                    {sectionTitle}
                  </h2>

                  <p
                    className="mt-1 text-sm"
                    style={{ color: MUTED_COLOR }}
                  >
                    Update your {sectionTitle.toLowerCase()} preferences.
                  </p>
                </div>

                {/* SECTION BODY */}

                <div className="space-y-6 p-5 sm:p-6">

                  {/* SHOP PROFILE */}

                  {activeSection === "shop" && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: {},
                        visible: {
                          transition: { staggerChildren: 0.07 },
                        },
                      }}
                      className="space-y-6"
                    >
                      <motion.div
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          visible: { opacity: 1, y: 0 },
                        }}
                        className="flex items-center gap-4 rounded-2xl border p-4"
                        style={{
                          backgroundColor: "#FFF6D9",
                          borderColor: BORDER_COLOR,
                        }}
                      >
                        <motion.div
                          whileHover={{
                            rotate: -5,
                            scale: 1.08,
                          }}
                          transition={{ duration: 0.2 }}
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                          style={{
                            backgroundColor: GOLD_COLOR,
                            color: TEXT_COLOR,
                          }}
                        >
                          <Store size={27} />
                        </motion.div>

                        <div className="min-w-0">
                          <h3 className="font-bold">
                            {settings.shopName}
                          </h3>

                          <p
                            className="mt-1 text-sm"
                            style={{ color: MUTED_COLOR }}
                          >
                            Shop profile and contact information
                          </p>
                        </div>
                      </motion.div>

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <Field
                          id="shopName"
                          label="Shop Name"
                          icon={Store}
                          value={settings.shopName}
                          onChange={(e) =>
                            updateField("shopName", e.target.value)
                          }
                        />

                        <Field
                          id="shopPhone"
                          label="Phone Number"
                          icon={Phone}
                          type="tel"
                          value={settings.phone}
                          onChange={(e) =>
                            updateField("phone", e.target.value)
                          }
                          placeholder="Enter shop phone number"
                        />

                        <Field
                          id="shopEmail"
                          label="Email Address"
                          icon={Mail}
                          type="email"
                          value={settings.email}
                          onChange={(e) =>
                            updateField("email", e.target.value)
                          }
                        />

                        <Field
                          id="shopAddress"
                          label="Shop Address"
                          icon={MapPin}
                          value={settings.address}
                          onChange={(e) =>
                            updateField("address", e.target.value)
                          }
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* BUSINESS SETTINGS */}

                  {activeSection === "business" && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-1 gap-5 md:grid-cols-2"
                    >
                      <div>
                        <label
                          htmlFor="currency"
                          className="mb-2 block text-sm font-semibold"
                        >
                          Currency
                        </label>

                        <select
                          id="currency"
                          value={settings.currency}
                          onChange={(e) =>
                            updateField("currency", e.target.value)
                          }
                          className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-[#E9B83F]/15"
                          style={{
                            backgroundColor: CARD_BG,
                            borderColor: BORDER_COLOR,
                            color: TEXT_COLOR,
                          }}
                        >
                          <option value="INR">
                            INR - Indian Rupee (₹)
                          </option>
                          <option value="USD">
                            USD - US Dollar ($)
                          </option>
                        </select>
                      </div>

                      <Field
                        id="invoicePrefix"
                        label="Invoice Prefix"
                        icon={FileText}
                        value={settings.invoicePrefix}
                        onChange={(e) =>
                          updateField("invoicePrefix", e.target.value)
                        }
                      />

                      <Field
                        id="taxRate"
                        label="Tax Rate (%)"
                        type="number"
                        min="0"
                        max="100"
                        value={settings.taxRate}
                        onChange={(e) =>
                          updateField("taxRate", e.target.value)
                        }
                      />

                      <div
                        className="rounded-xl border p-4"
                        style={{
                          backgroundColor: "#FFF6D9",
                          borderColor: BORDER_COLOR,
                        }}
                      >
                        <p className="text-sm font-semibold">
                          Business preferences
                        </p>

                        <p
                          className="mt-1 text-xs leading-5"
                          style={{ color: MUTED_COLOR }}
                        >
                          These values currently remain in page state until
                          a settings save API is connected.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* INVOICE SETTINGS */}

                  {activeSection === "invoice" && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5"
                    >
                      <Field
                        id="invoicePrefixField"
                        label="Invoice Prefix"
                        icon={FileText}
                        value={settings.invoicePrefix}
                        onChange={(e) =>
                          updateField("invoicePrefix", e.target.value)
                        }
                      />

                      <div>
                        <label
                          htmlFor="warranty"
                          className="mb-2 block text-sm font-semibold"
                        >
                          Warranty Information
                        </label>

                        <textarea
                          id="warranty"
                          rows={3}
                          value={settings.warranty}
                          onChange={(e) =>
                            updateField("warranty", e.target.value)
                          }
                          className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-[#E9B83F]/15"
                          style={{
                            backgroundColor: CARD_BG,
                            borderColor: BORDER_COLOR,
                            color: TEXT_COLOR,
                          }}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="invoiceNote"
                          className="mb-2 block text-sm font-semibold"
                        >
                          Default Invoice Note
                        </label>

                        <textarea
                          id="invoiceNote"
                          rows={3}
                          value={settings.invoiceNote}
                          onChange={(e) =>
                            updateField("invoiceNote", e.target.value)
                          }
                          className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-[#E9B83F]/15"
                          style={{
                            backgroundColor: CARD_BG,
                            borderColor: BORDER_COLOR,
                            color: TEXT_COLOR,
                          }}
                        />
                      </div>

                      <AnimatedCard
                        className="p-4"
                        style={{
                          backgroundColor: "#FFF6D9",
                        }}
                      >
                        <p
                          className="mb-2 text-xs font-semibold uppercase tracking-wide"
                          style={{ color: MUTED_COLOR }}
                        >
                          Invoice Preview
                        </p>

                        <p className="font-bold">{settings.shopName}</p>

                        <p
                          className="mt-2 text-sm"
                          style={{ color: MUTED_COLOR }}
                        >
                          {settings.warranty}
                        </p>

                        <p
                          className="mt-2 text-sm"
                          style={{ color: MUTED_COLOR }}
                        >
                          {settings.invoiceNote}
                        </p>
                      </AnimatedCard>
                    </motion.div>
                  )}

                  {/* NOTIFICATION SETTINGS */}

                  {activeSection === "notifications" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="divide-y"
                      style={{ borderColor: BORDER_COLOR }}
                    >
                      <Toggle
                        title="Low Stock Alerts"
                        description="Get notified when product stock is running low."
                        checked={settings.lowStockAlerts}
                        onChange={(value) =>
                          updateField("lowStockAlerts", value)
                        }
                      />

                      <Toggle
                        title="Payment Notifications"
                        description="Show notifications for payment activity."
                        checked={settings.paymentAlerts}
                        onChange={(value) =>
                          updateField("paymentAlerts", value)
                        }
                      />

                      <Toggle
                        title="Sales Notifications"
                        description="Show notifications when a sale is recorded."
                        checked={settings.saleAlerts}
                        onChange={(value) =>
                          updateField("saleAlerts", value)
                        }
                      />
                    </motion.div>
                  )}

                  {/* SECURITY SETTINGS */}

                  {activeSection === "security" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5"
                    >
                      <div
                        className="flex items-start gap-3 rounded-xl border p-4"
                        style={{
                          backgroundColor: "#FFF6D9",
                          borderColor: BORDER_COLOR,
                        }}
                      >
                        <ShieldCheck
                          size={22}
                          className="mt-0.5 shrink-0"
                          style={{ color: GOLD_HOVER }}
                        />

                        <div>
                          <p className="text-sm font-semibold">
                            Account Security
                          </p>

                          <p
                            className="mt-1 text-xs leading-5"
                            style={{ color: MUTED_COLOR }}
                          >
                            Password changes must be connected to your
                            existing authentication backend before they
                            can be saved.
                          </p>
                        </div>
                      </div>

                      <Field
                        id="adminEmail"
                        label="Admin Email"
                        icon={UserRound}
                        type="email"
                        value={settings.email}
                        onChange={(e) =>
                          updateField("email", e.target.value)
                        }
                      />

                      <div>
                        <label
                          htmlFor="newPassword"
                          className="mb-2 block text-sm font-semibold"
                        >
                          New Password
                        </label>

                        <div className="relative">
                          <input
                            id="newPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="Password change is not connected yet"
                            disabled
                            className="w-full rounded-xl border px-4 py-3 pr-12 text-sm"
                            style={{
                              backgroundColor: "#F4F0E6",
                              borderColor: BORDER_COLOR,
                              color: MUTED_COLOR,
                            }}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword((value) => !value)
                            }
                            aria-label="Toggle password visibility"
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            style={{ color: MUTED_COLOR }}
                          >
                            {showPassword ? (
                              <EyeOff size={17} />
                            ) : (
                              <Eye size={17} />
                            )}
                          </button>
                        </div>
                      </div>

                      <p
                        className="text-xs"
                        style={{ color: MUTED_COLOR }}
                      >
                        No password is changed or sent by this page.
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* CARD FOOTER */}

                <div
                  className="flex flex-col gap-3 border-t p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  style={{
                    borderColor: BORDER_COLOR,
                    backgroundColor: "#FFF6D9",
                  }}
                >
                  <p
                    className="text-xs"
                    style={{ color: MUTED_COLOR }}
                  >
                    Changes are local until backend saving is implemented.
                  </p>

                  <AnimatedButton
                    onClick={saveSettings}
                    disabled={saving}
                  >
                    <Save size={16} />
                    {saving ? "Checking..." : "Save Changes"}
                  </AnimatedButton>
                </div>
              </motion.section>
            </AnimatePresence>
          </div>

          {/* PAGE FOOTER */}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-6 text-center text-xs"
            style={{ color: MUTED_COLOR }}
          >
            Ganesh Mobile Shop · Settings
          </motion.p>
        </div>
      </main>
    </div>
  );
}

export default Settings;