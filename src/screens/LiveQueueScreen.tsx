// screens/LiveQueueScreen.tsx

import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

import { api } from "@/lib/api";

const CASHIER_WINDOW_COUNT = 3;
const POLL_MS = 5000;

const BLUE = "#1B5A8C";
const WHITE = "#FFFFFF";
const GRAY_50 = "#F9FAFB";
const GRAY_100 = "#F3F4F6";
const GRAY_200 = "#E5E7EB";
const GRAY_300 = "#D1D5DB";
const GRAY_400 = "#9CA3AF";
const GRAY_500 = "#6B7280";
const GRAY_700 = "#374151";
const GRAY_900 = "#111827";
const GREEN_500 = "#22C55E";
const RED_400 = "#F87171";
const RED_500 = "#EF4444";

// ─── API types (matches /api/tickets/live) ─────────────────────────────────
interface StudentInfo {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
}

interface TicketRow {
  ticketNumber: string;
  ticketId: string;
  transactionType: string;
  student?: StudentInfo;
}

interface ServingRow extends TicketRow {
  servingWindow?: string | null;
  staffName?: string | null;
}

interface CashierWindow {
  window: string;
  staff: { staffId: string; name: string | null } | null;
  serving: ServingRow | null;
  waiting: TicketRow[];
}

interface SingleLaneDept {
  department: "dean";
  displayName: string;
  staff: { staffId: string; name: string | null }[];
  serving: ServingRow | null;
  waiting: TicketRow[];
}

interface CashierDept {
  department: "cashier";
  displayName: string;
  windows: CashierWindow[];
  totalServing: number;
  totalWaiting: number;
}

type LiveDept = CashierDept | SingleLaneDept;

interface LivePayload {
  timestamp: string;
  departments: LiveDept[];
}

interface DataPoint {
  time: number;
  value: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function maskNamePart(part?: string): string {
  if (!part) return "";
  const t = part.trim();
  if (!t) return "";
  if (t.length === 1) return t;
  return `${t.slice(0, 2)}${"*".repeat(Math.max(t.length - 2, 1))}`;
}

function maskStudentName(student?: StudentInfo): string {
  if (!student) return "—";
  const parts = [
    maskNamePart(student.firstName),
    maskNamePart(student.middleName),
    maskNamePart(student.lastName),
    student.suffix ?? "",
  ].filter((p) => p.length > 0);
  return parts.length ? parts.join(" ") : "—";
}

function formatTime(date: Date | null) {
  if (!date) return "—";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatTransaction(type: string) {
  return type.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

// ─── Chart ─────────────────────────────────────────────────────────────────
function SleekChart({ dataPoints }: { dataPoints: DataPoint[] }) {
  const maxValue = Math.max(...dataPoints.map((d) => d.value), 1);
  const paddedMax = Math.ceil(maxValue / 5) * 5 || 5;
  const currentValue =
    dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].value : 0;

  const { pathData, areaPath } = useMemo(() => {
    if (dataPoints.length < 2) return { pathData: "", areaPath: "" };
    const width = 600;
    const height = 100;
    const pad = 4;
    const cw = width - pad * 2;
    const ch = height - pad * 2;
    const path = dataPoints
      .map((p, i) => {
        const x = pad + (i / (dataPoints.length - 1)) * cw;
        const y = pad + ch - (p.value / paddedMax) * ch;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
    const area = `${path} L ${pad + cw} ${height} L ${pad} ${height} Z`;
    return { pathData: path, areaPath: area };
  }, [dataPoints, paddedMax]);

  const lastX = dataPoints.length > 0 ? 4 + (600 - 8) : 0;
  const lastY =
    dataPoints.length > 0
      ? 4 + (100 - 8) - (currentValue / paddedMax) * (100 - 8)
      : 0;

  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <Ionicons name="pulse" size={14} color={BLUE} />
          <Text
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: GRAY_400 }}
          >
            Tickets · running
          </Text>
        </View>
        <Text
          className="text-sm font-bold tabular-nums"
          style={{ color: GRAY_900 }}
        >
          {currentValue}
        </Text>
      </View>
      <View style={{ height: 100 }}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 600 100"
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient id="sleekArea" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={BLUE} stopOpacity="0.06" />
              <Stop offset="1" stopColor={BLUE} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Line
            x1="0"
            y1="96"
            x2="600"
            y2="96"
            stroke="#F1F5F9"
            strokeWidth="1"
          />
          {areaPath ? <Path d={areaPath} fill="url(#sleekArea)" /> : null}
          {pathData ? (
            <Path
              d={pathData}
              fill="none"
              stroke={BLUE}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {dataPoints.length > 0 && !isNaN(lastY) ? (
            <Circle cx={lastX} cy={lastY} r="2" fill={BLUE} />
          ) : null}
        </Svg>
      </View>
    </View>
  );
}

// ─── Voice ─────────────────────────────────────────────────────────────────
const VOICE_CONFIG = { rate: 0.95, pitch: 1.1, volume: 0.9 };

function speak(text: string) {
  try {
    Speech.stop();
    Speech.speak(text, {
      language: "en-US",
      rate: VOICE_CONFIG.rate,
      pitch: VOICE_CONFIG.pitch,
      volume: VOICE_CONFIG.volume,
    });
  } catch (e) {
    console.warn("[QUEUE] speech failed:", e);
  }
}

// ─── Single lane card (Dean's Office) ──────────────────────────────────────
function SingleLaneCard({ dept }: { dept: SingleLaneDept }) {
  const hasServing = !!dept.serving;
  const staffOnDuty =
    dept.staff.length > 0
      ? dept.staff.map((s) => s.name ?? "—").join(", ")
      : "No staff on duty";

  return (
    <View className="rounded-xl p-5 border" style={{ borderColor: GRAY_100 }}>
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: hasServing ? GREEN_500 : GRAY_300 }}
          />
          <Text
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: GRAY_400 }}
          >
            {dept.displayName}
          </Text>
        </View>
        <View
          className="rounded-full px-2.5 py-0.5"
          style={{ backgroundColor: GRAY_100 }}
        >
          <Text className="text-[10px] font-medium" style={{ color: GRAY_500 }}>
            {dept.waiting.length} waiting
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-1.5 mb-3">
        <Ionicons name="person-circle-outline" size={14} color={GRAY_500} />
        <Text
          className="text-[12px] font-semibold flex-1"
          style={{ color: GRAY_700 }}
          numberOfLines={1}
        >
          {staffOnDuty}
        </Text>
      </View>

      <View className="flex-row items-baseline gap-3 flex-wrap">
        <Text
          className="text-4xl font-extrabold tabular-nums tracking-tight"
          style={{ color: hasServing ? BLUE : GRAY_200 }}
        >
          {hasServing ? `#${dept.serving!.ticketNumber}` : "—"}
        </Text>
        {hasServing ? (
          <Text
            className="text-[12px] font-semibold"
            style={{ color: GRAY_500 }}
          >
            now serving
          </Text>
        ) : null}
      </View>

      {hasServing ? (
        <View className="mt-2 flex-row items-center gap-2 flex-wrap">
          <View
            className="rounded-full px-2.5 py-0.5"
            style={{ backgroundColor: "#F0FDF4" }}
          >
            <Text
              className="text-[11px] font-semibold"
              style={{ color: "#15803D" }}
            >
              {formatTransaction(dept.serving!.transactionType)}
            </Text>
          </View>
          {dept.serving!.student ? (
            <Text className="text-[11px]" style={{ color: GRAY_500 }}>
              {maskStudentName(dept.serving!.student)}
            </Text>
          ) : null}
        </View>
      ) : null}

      {dept.waiting.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5 mt-3">
          {dept.waiting.slice(0, 6).map((t) => (
            <View
              key={t.ticketId}
              className="rounded-md px-2 py-1"
              style={{ backgroundColor: GRAY_50 }}
            >
              <Text
                className="text-[11px] font-bold tabular-nums"
                style={{ color: GRAY_700 }}
              >
                #{t.ticketNumber}
              </Text>
            </View>
          ))}
          {dept.waiting.length > 6 ? (
            <View className="rounded-md px-2 py-1 justify-center">
              <Text
                className="text-[11px] font-semibold"
                style={{ color: GRAY_500 }}
              >
                +{dept.waiting.length - 6}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ─── Cashier window column ─────────────────────────────────────────────────
function WindowColumn({ win }: { win: CashierWindow }) {
  const hasServing = !!win.serving;
  const hasStaff = !!win.staff?.name;

  return (
    <View
      className="rounded-xl overflow-hidden border"
      style={{ borderColor: GRAY_100 }}
    >
      <View
        className="p-4 border-b"
        style={{
          borderColor: GRAY_100,
          backgroundColor: "rgba(249,250,251,0.6)",
        }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: hasServing ? GREEN_500 : GRAY_300,
              }}
            />
            <Text
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: GRAY_400 }}
            >
              {win.window}
            </Text>
          </View>
          <View
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: GRAY_100 }}
          >
            <Text
              className="text-[10px] font-medium"
              style={{ color: GRAY_500 }}
            >
              {win.waiting.length} waiting
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-1.5">
          <Ionicons
            name="person-circle-outline"
            size={14}
            color={hasStaff ? GRAY_700 : GRAY_400}
          />
          <Text
            className="text-[12px] font-semibold flex-1"
            style={{ color: hasStaff ? GRAY_700 : GRAY_400 }}
            numberOfLines={1}
          >
            {win.staff?.name ?? "Unassigned"}
          </Text>
        </View>

        <View className="flex-row items-baseline gap-2 mt-3">
          <Text
            className="text-3xl font-extrabold tabular-nums tracking-tight"
            style={{ color: hasServing ? BLUE : GRAY_200 }}
          >
            {hasServing ? `#${win.serving!.ticketNumber}` : "—"}
          </Text>
          <Text className="text-[11px] font-medium" style={{ color: GRAY_400 }}>
            now serving
          </Text>
        </View>

        {hasServing ? (
          <View className="mt-2 flex-row items-center gap-2 flex-wrap">
            <View
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: "#F0FDF4" }}
            >
              <Text
                className="text-[10px] font-semibold"
                style={{ color: "#15803D" }}
              >
                {formatTransaction(win.serving!.transactionType)}
              </Text>
            </View>
            {win.serving!.student ? (
              <Text className="text-[10px]" style={{ color: GRAY_500 }}>
                {maskStudentName(win.serving!.student)}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View className="p-3">
        <Text
          className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1"
          style={{ color: GRAY_400 }}
        >
          Waiting • {win.waiting.length}
        </Text>
        {win.waiting.length === 0 ? (
          <View className="py-6 items-center">
            <Text className="text-[11px]" style={{ color: GRAY_300 }}>
              No tickets queued
            </Text>
          </View>
        ) : (
          <View style={{ gap: 6 }}>
            {win.waiting.map((t) => (
              <View
                key={t.ticketId}
                className="flex-row items-center justify-between px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: GRAY_50,
                  borderColor: GRAY_100,
                  gap: 8,
                }}
              >
                <Text
                  className="text-[13px] font-bold tabular-nums"
                  style={{ color: GRAY_700 }}
                >
                  #{t.ticketNumber}
                </Text>
                <Text
                  className="text-[10px] font-medium text-right"
                  style={{ color: GRAY_500, maxWidth: "55%" }}
                  numberOfLines={1}
                >
                  {maskStudentName(t.student)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export default function LiveQueueScreen() {
  const insets = useSafeAreaInsets();

  const [departments, setDepartments] = useState<LiveDept[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>("all");

  const aliveRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await api<LivePayload>("/api/tickets/live");
      if (!aliveRef.current) return;

      const depts = Array.isArray(res?.departments) ? res.departments : [];

      setDepartments(depts);
      setLastUpdated(res?.timestamp ? new Date(res.timestamp) : new Date());
      setIsConnected(true);

      const deanWaiting =
        (depts.find((d) => d.department === "dean") as SingleLaneDept)?.waiting
          .length ?? 0;
      const cashierWaiting =
        (depts.find((d) => d.department === "cashier") as CashierDept)
          ?.totalWaiting ?? 0;

      const sum = deanWaiting + cashierWaiting;
      setHistory((prev) => {
        const next = [...prev, { time: Date.now(), value: sum }];
        return next.length > 60 ? next.slice(-60) : next;
      });
    } catch (e: any) {
      if (!aliveRef.current) return;
      setIsConnected(false);
      console.error("[QUEUE] load failed:", e?.status, e?.message);
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      aliveRef.current = false;
      clearInterval(t);
    };
  }, [load]);

  const formatTimeStr = (date: Date | null) => formatTime(date);

  const deanDept = departments.find((d) => d.department === "dean") as
    | SingleLaneDept
    | undefined;

  const cashierDept = departments.find((d) => d.department === "cashier") as
    | CashierDept
    | undefined;

  const totalWaiting =
    (deanDept?.waiting.length ?? 0) + (cashierDept?.totalWaiting ?? 0);

  const deanCount = deanDept?.waiting.length ?? 0;
  const cashierCount = cashierDept?.totalWaiting ?? 0;

  const statusTone = isConnected
    ? { bg: "#F0FDF4", border: "#DCFCE7", text: "#15803D", dot: GREEN_500 }
    : { bg: "#FEF2F2", border: "#FEE2E2", text: "#DC2626", dot: RED_500 };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Connection strip */}
        <View
          className="px-6 py-3 flex-row items-center justify-between border-b"
          style={{ borderColor: GRAY_100 }}
        >
          <View className="flex-row items-center gap-2">
            <View
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: isConnected ? GREEN_500 : RED_400 }}
            />
            <Text className="text-xs" style={{ color: GRAY_400 }}>
              {isConnected ? "Live" : "Reconnecting..."}
            </Text>
          </View>
          <Text className="text-xs" style={{ color: GRAY_400 }}>
            Updated {formatTimeStr(lastUpdated)}
          </Text>
        </View>

        {/* Title */}
        <View
          className="px-6 py-5 border-b flex-row items-center justify-between"
          style={{ borderColor: GRAY_100 }}
        >
          <View className="flex-1 pr-3">
            <Text
              className="text-lg font-bold mb-0.5"
              style={{ color: GRAY_900 }}
            >
              Live Queue Monitor
            </Text>
            <Text className="text-xs" style={{ color: GRAY_400 }}>
              Dean&apos;s Office • Cashier ({CASHIER_WINDOW_COUNT} Windows) •{" "}
              {totalWaiting} waiting • Voice {voiceOn ? "on" : "off"}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setVoiceOn((v) => {
                if (v) Speech.stop();
                return !v;
              });
            }}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: voiceOn ? BLUE : GRAY_100 }}
            accessibilityLabel={
              voiceOn ? "Mute announcements" : "Unmute announcements"
            }
          >
            <Ionicons
              name={voiceOn ? "volume-high" : "volume-mute"}
              size={16}
              color={voiceOn ? WHITE : GRAY_500}
            />
          </TouchableOpacity>
        </View>

        {/* Status banner */}
        <View
          className="px-6 py-3 border-b flex-row items-center gap-2"
          style={{
            backgroundColor: statusTone.bg,
            borderColor: statusTone.border,
          }}
        >
          <View
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: statusTone.dot }}
          />
          <Text
            className="text-sm font-medium flex-1"
            style={{ color: statusTone.text }}
          >
            {isConnected
              ? `${totalWaiting} ticket${totalWaiting === 1 ? "" : "s"} waiting in queue`
              : "Reconnecting to server..."}
          </Text>
        </View>

        {/* Chart */}
        <View className="px-6 py-4 border-b" style={{ borderColor: GRAY_100 }}>
          <SleekChart dataPoints={history} />
        </View>

        {/* Dean's Office */}
        {deanDept ? (
          <View
            className="px-6 pt-5 pb-5 border-b"
            style={{ borderColor: GRAY_100 }}
          >
            <SingleLaneCard dept={deanDept} />
          </View>
        ) : null}

        {/* Cashier windows */}
        {cashierDept ? (
          <View
            className="px-6 py-5 border-b"
            style={{ borderColor: GRAY_100 }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: GRAY_400 }}
              >
                Cashier Windows
              </Text>
              <Text
                className="text-[11px] font-semibold"
                style={{ color: GRAY_500 }}
              >
                Total {cashierDept.totalWaiting} waiting
              </Text>
            </View>
            <View style={{ gap: 16 }}>
              {cashierDept.windows.map((win) => (
                <WindowColumn key={win.window} win={win} />
              ))}
            </View>
          </View>
        ) : null}

        {/* Filter chips */}
        <View className="px-6 py-3 border-b" style={{ borderColor: GRAY_100 }}>
          <View className="flex-row items-center gap-2">
            <Chip
              label={`All (${totalWaiting})`}
              active={selectedDept === "all"}
              onPress={() => setSelectedDept("all")}
            />
            <Chip
              label={`Dean (${deanCount})`}
              active={selectedDept === "dean"}
              onPress={() => setSelectedDept("dean")}
            />
            <Chip
              label={`Cashier (${cashierCount})`}
              active={selectedDept === "cashier"}
              onPress={() => setSelectedDept("cashier")}
            />
          </View>
        </View>

        {/* Full waiting list */}
        <View className="px-6 py-4">
          <Text
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: GRAY_400 }}
          >
            Waiting queue
          </Text>
          <View
            className="border rounded-lg overflow-hidden"
            style={{ borderColor: GRAY_100 }}
          >
            <WaitingList departments={departments} filter={selectedDept} />
          </View>
        </View>

        {/* Footer */}
        <View className="items-center pt-4">
          <Text className="text-[11px]" style={{ color: GRAY_300 }}>
            Binalbagan Catholic College • Queue Management System
          </Text>
        </View>
      </ScrollView>

      {loading && departments.length === 0 && (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.85)" }}
          pointerEvents="none"
        >
          <ActivityIndicator color={BLUE} />
        </View>
      )}
    </View>
  );
}

// ─── Waiting list (aggregated across departments) ──────────────────────────
function WaitingList({
  departments,
  filter,
}: {
  departments: LiveDept[];
  filter: string;
}) {
  const rows: Array<TicketRow & { dept: string }> = [];

  for (const d of departments) {
    if (d.department === "cashier") {
      if (filter !== "all" && filter !== "cashier") continue;
      for (const win of d.windows) {
        for (const t of win.waiting) {
          rows.push({ ...t, dept: win.window });
        }
      }
    } else if (d.department === "dean") {
      if (filter !== "all" && filter !== "dean") continue;
      for (const t of d.waiting) {
        rows.push({ ...t, dept: d.displayName });
      }
    }
  }

  if (rows.length === 0) {
    return (
      <View className="py-12 items-center">
        <Ionicons name="time-outline" size={24} color={GRAY_200} />
        <Text className="text-xs mt-2" style={{ color: GRAY_400 }}>
          No tickets in queue
        </Text>
      </View>
    );
  }

  return (
    <View>
      {rows.map((row, idx) => (
        <View
          key={row.ticketId || idx}
          className="flex-row items-center px-4 py-4"
          style={{
            gap: 14,
            borderTopWidth: idx === 0 ? 0 : 1,
            borderTopColor: GRAY_50,
          }}
        >
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center"
            style={{ backgroundColor: BLUE }}
          >
            <Text
              className="text-lg font-extrabold tabular-nums"
              style={{ color: WHITE }}
            >
              {row.ticketNumber}
            </Text>
          </View>
          <View className="flex-1 min-w-0">
            <Text
              className="text-[15px] font-semibold"
              style={{ color: GRAY_900 }}
              numberOfLines={1}
            >
              {formatTransaction(row.transactionType)}
            </Text>
            <Text
              className="text-[13px] mt-0.5 tabular-nums"
              style={{ color: GRAY_500 }}
              numberOfLines={1}
            >
              {maskStudentName(row.student)}
            </Text>
          </View>
          <View
            className="rounded-full px-2.5 py-1"
            style={{ backgroundColor: GRAY_100 }}
          >
            <Text
              className="text-[10px] font-medium"
              style={{ color: GRAY_400 }}
            >
              {row.dept}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="rounded-full px-3 py-1.5"
      style={{ backgroundColor: active ? GRAY_900 : GRAY_100 }}
    >
      <Text
        className="text-xs font-medium"
        style={{ color: active ? WHITE : GRAY_500 }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
