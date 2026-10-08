// screens/TicketRequestScreen.tsx

import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import TicketReceiptModal, {
  type TicketReceiptData,
} from "@/components/TicketReceiptModal";
import { api, ApiError } from "@/lib/api";
import { C, SERIF } from "@/lib/theme";

// ─── Constants mirrored from the backend schema ────────────────────────────
const YEARS = [
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
] as const;

const CAMPUSES = [
  "Binalbagan Catholic College - JHS Campus",
  "Binalbagan Catholic College - Main Campus",
] as const;

const GENDERS = ["Male", "Female", "Other"] as const;

const RELATIONSHIPS = ["Father", "Mother", "Guardian", "Other"] as const;

type Department = "cashier" | "dean" | "registrar";

const DEPARTMENT_TRANSACTIONS: Record<Department, string[]> = {
  dean: ["clearance", "grade-appeal", "course-approval", "academic-concern"],
  cashier: [
    "tuition-payment",
    "exam-payment",
    "document-payment",
    "other-school-fees",
  ],
  registrar: [
    "certificate-enrollment",
    "transcript-records",
    "request-grades",
    "request-assessment",
    "good-moral",
    "diploma",
    "other-document",
  ],
};

const TRANSACTION_LABELS: Record<string, string> = {
  // Dean
  clearance: "Clearance",
  "grade-appeal": "Grade Appeal",
  "course-approval": "Course Approval",
  "academic-concern": "Academic Concern",
  // Cashier
  "tuition-payment": "Tuition Payment",
  "exam-payment": "Exam Payment",
  "document-payment": "Document Payment",
  "other-school-fees": "Other School Fees",
  // Registrar
  "certificate-enrollment": "Certificate of Enrollment",
  "transcript-records": "Transcript of Records",
  "request-grades": "Request for Grades",
  "request-assessment": "Request for Assessment",
  "good-moral": "Good Moral Certificate",
  diploma: "Diploma",
  "other-document": "Other Document Request",
};

const TRANSACTIONS_NEEDING_DESCRIPTION = [
  "other-school-fees",
  "other-document",
];

const DEPARTMENT_LABELS: Record<Department, string> = {
  cashier: "Cashier",
  dean: "Dean's Office",
  registrar: "Registrar",
};

// ─── Types ─────────────────────────────────────────────────────────────────
interface StudentForm {
  schoolId: string;
  firstName: string;
  lastName: string;
  middleName: string;
  suffix: string;
  gender: string;
  birthdate: string;
  year: string;
  campus: string;
  email: string;
  contactNumber: string;
}

interface GuardianForm {
  firstName: string;
  lastName: string;
  middleName: string;
  relationship: string;
  email: string;
  contactNumber: string;
}

const EMPTY_STUDENT: StudentForm = {
  schoolId: "",
  firstName: "",
  lastName: "",
  middleName: "",
  suffix: "",
  gender: "",
  birthdate: "",
  year: "",
  campus: "",
  email: "",
  contactNumber: "",
};

const EMPTY_GUARDIAN: GuardianForm = {
  firstName: "",
  lastName: "",
  middleName: "",
  relationship: "",
  email: "",
  contactNumber: "",
};

// ─── Screen ────────────────────────────────────────────────────────────────
export default function TicketRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ department?: string }>();
  const department = (params.department as Department) || "cashier";

  const transactions = DEPARTMENT_TRANSACTIONS[department] ?? [];

  const [transactionType, setTransactionType] = useState<string>("");
  const [transactionDescription, setTransactionDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [requesterType, setRequesterType] = useState<"student" | "guardian">(
    "student",
  );
  const [student, setStudent] = useState<StudentForm>(EMPTY_STUDENT);
  const [guardian, setGuardian] = useState<GuardianForm>(EMPTY_GUARDIAN);
  const [submitting, setSubmitting] = useState(false);

  const [receipt, setReceipt] = useState<TicketReceiptData | null>(null);
  const [receiptVisible, setReceiptVisible] = useState(false);

  const needsDescription =
    TRANSACTIONS_NEEDING_DESCRIPTION.includes(transactionType);
  const needsAmount = department === "cashier";

  // ── Validation ───────────────────────────────────────────────────────────
  const canSubmit = useMemo(() => {
    if (!transactionType) return false;
    if (needsDescription && !transactionDescription.trim()) return false;
    if (needsAmount && (!amount || Number(amount) <= 0)) return false;
    if (!student.firstName.trim() || !student.lastName.trim()) return false;
    if (!student.gender) return false;
    if (!student.birthdate.trim()) return false;
    if (!student.year || !student.campus) return false;

    if (requesterType === "student") {
      if (!student.email.trim() && !student.contactNumber.trim()) return false;
    } else {
      if (!guardian.firstName.trim() || !guardian.lastName.trim()) return false;
      if (!guardian.relationship) return false;
      if (!guardian.email.trim() && !guardian.contactNumber.trim())
        return false;
    }
    return true;
  }, [
    transactionType,
    transactionDescription,
    amount,
    needsDescription,
    needsAmount,
    student,
    requesterType,
    guardian,
  ]);

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const contact =
        requesterType === "guardian"
          ? {
              email: guardian.email.trim().toLowerCase(),
              contactNumber: guardian.contactNumber.trim(),
            }
          : {
              email: student.email.trim().toLowerCase(),
              contactNumber: student.contactNumber.trim(),
            };

      const body: any = {
        transactionType,
        transactionDescription: transactionDescription.trim() || undefined,
        amount: needsAmount ? Number(amount) : 0,
        department,
        requesterType,
        student: {
          schoolId: student.schoolId.trim(),
          firstName: student.firstName.trim(),
          lastName: student.lastName.trim(),
          middleName: student.middleName.trim(),
          suffix: student.suffix.trim(),
          gender: student.gender,
          birthdate: student.birthdate.trim(),
          year: student.year,
          campus: student.campus,
          email: contact.email,
          contactNumber: contact.contactNumber,
        },
      };

      if (requesterType === "guardian") {
        body.guardian = {
          guardianFirstName: guardian.firstName.trim(),
          guardianLastName: guardian.lastName.trim(),
          guardianMiddleName: guardian.middleName.trim(),
          relationship: guardian.relationship,
          email: guardian.email.trim().toLowerCase(),
          contactNumber: guardian.contactNumber.trim(),
        };
      }

      const created = await api<any>("/api/tickets", {
        method: "POST",
        body,
      });

      const studentName = [
        student.firstName,
        student.middleName,
        student.lastName,
        student.suffix,
      ]
        .map((p) => p.trim())
        .filter(Boolean)
        .join(" ");

      setReceipt({
        ticketNumber: created?.ticketNumber ?? "—",
        ticketId: created?.ticketId ?? "",
        department,
        departmentLabel: DEPARTMENT_LABELS[department] ?? department,
        transactionLabel:
          TRANSACTION_LABELS[transactionType] ?? transactionType,
        studentName,
        amount: needsAmount ? Number(amount) : 0,
        peopleAhead: created?.peopleAhead ?? 0,
        nowServing: created?.nowServing ?? null,
        createdAt: created?.createdAt ?? new Date().toISOString(),
      });
      setReceiptVisible(true);
    } catch (e: any) {
      const msg =
        e instanceof ApiError && e.message
          ? e.message
          : "Could not create the ticket. Please try again.";
      Alert.alert("Ticket creation failed", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center border"
            style={{ borderColor: C.border }}
          >
            <MaterialIcons name="arrow-back" size={20} color={C.navy} />
          </TouchableOpacity>
          <View className="ml-3 flex-1">
            <Text
              className="text-[10px] font-semibold uppercase tracking-[2px]"
              style={{ color: C.navySoft }}
            >
              {DEPARTMENT_LABELS[department] ?? department}
            </Text>
            <Text
              className="text-[22px] mt-0.5"
              style={{ color: C.navy, fontFamily: SERIF, fontWeight: "700" }}
            >
              Get a Queue Number
            </Text>
          </View>
        </View>

        {/* Transaction type */}
        <View className="mb-5">
          <SectionLabel>What do you need?</SectionLabel>
          <View className="mt-2">
            {transactions.map((t) => {
              const active = transactionType === t;
              return (
                <TouchableOpacity
                  key={t}
                  activeOpacity={0.85}
                  onPress={() => setTransactionType(t)}
                  className="flex-row items-center p-3.5 mb-2 rounded-2xl border"
                  style={{
                    backgroundColor: active ? C.tint : C.white,
                    borderColor: active ? C.navy : C.border,
                  }}
                >
                  <View
                    className="w-5 h-5 rounded-full items-center justify-center border-2"
                    style={{
                      borderColor: active ? C.navy : C.border,
                      backgroundColor: active ? C.navy : "transparent",
                    }}
                  >
                    {active && (
                      <MaterialIcons name="check" size={12} color={C.white} />
                    )}
                  </View>
                  <Text
                    className="flex-1 ml-3 text-[14px] font-bold"
                    style={{ color: C.navy }}
                  >
                    {TRANSACTION_LABELS[t] ?? t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Description for "other" */}
        {needsDescription && (
          <View className="mb-5">
            <SectionLabel>Describe your request</SectionLabel>
            <View className="mt-2">
              <Input
                value={transactionDescription}
                onChangeText={setTransactionDescription}
                placeholder="e.g. Payment for library fine"
                maxLength={200}
                multiline
              />
            </View>
          </View>
        )}

        {/* Amount for cashier */}
        {needsAmount && (
          <View className="mb-5">
            <SectionLabel>Amount to pay</SectionLabel>
            <View className="mt-2">
              <Input
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        )}

        {/* Requester type */}
        <View className="mb-5">
          <SectionLabel>Who is requesting?</SectionLabel>
          <View
            className="mt-2 flex-row rounded-full p-1 border"
            style={{ borderColor: C.border, backgroundColor: C.tint }}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setRequesterType("student")}
              className="flex-1 items-center py-2 rounded-full"
              style={{
                backgroundColor:
                  requesterType === "student" ? C.navy : "transparent",
              }}
            >
              <Text
                className="text-[12px] font-bold"
                style={{
                  color: requesterType === "student" ? C.white : C.navySoft,
                }}
              >
                Student
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setRequesterType("guardian")}
              className="flex-1 items-center py-2 rounded-full"
              style={{
                backgroundColor:
                  requesterType === "guardian" ? C.navy : "transparent",
              }}
            >
              <Text
                className="text-[12px] font-bold"
                style={{
                  color: requesterType === "guardian" ? C.white : C.navySoft,
                }}
              >
                Guardian
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Student info */}
        <View className="mb-5">
          <SectionLabel>Student information</SectionLabel>
          <View className="mt-2">
            <Input
              label="School ID"
              value={student.schoolId}
              onChangeText={(v) => setStudent({ ...student, schoolId: v })}
              placeholder="e.g. 20210001"
              keyboardType="number-pad"
            />
            <Row>
              <Input
                label="First name"
                value={student.firstName}
                onChangeText={(v) => setStudent({ ...student, firstName: v })}
                placeholder="Juan"
              />
              <Input
                label="Last name"
                value={student.lastName}
                onChangeText={(v) => setStudent({ ...student, lastName: v })}
                placeholder="Dela Cruz"
              />
            </Row>
            <Row>
              <Input
                label="Middle name"
                value={student.middleName}
                onChangeText={(v) => setStudent({ ...student, middleName: v })}
                placeholder="Optional"
              />
              <Input
                label="Suffix"
                value={student.suffix}
                onChangeText={(v) => setStudent({ ...student, suffix: v })}
                placeholder="Jr., Sr."
              />
            </Row>
            <Row>
              <Input
                label="Birthdate"
                value={student.birthdate}
                onChangeText={(v) => setStudent({ ...student, birthdate: v })}
                placeholder="YYYY-MM-DD"
              />
              <View className="flex-1 mb-3">
                <Text
                  className="text-[11px] font-bold mb-1.5 uppercase tracking-[1px]"
                  style={{ color: C.navySoft }}
                >
                  Gender
                </Text>
                <View
                  className="flex-row rounded-full p-1 border"
                  style={{ borderColor: C.border, backgroundColor: C.tint }}
                >
                  {GENDERS.map((g) => {
                    const active = student.gender === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        activeOpacity={0.85}
                        onPress={() => setStudent({ ...student, gender: g })}
                        className="flex-1 items-center py-2 rounded-full"
                        style={{
                          backgroundColor: active ? C.navy : "transparent",
                        }}
                      >
                        <Text
                          className="text-[11px] font-bold"
                          style={{ color: active ? C.white : C.navySoft }}
                        >
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </Row>

            <PickerRow
              label="Year level"
              value={student.year}
              options={YEARS as unknown as string[]}
              onChange={(v) => setStudent({ ...student, year: v })}
            />

            <PickerRow
              label="Campus"
              value={student.campus}
              options={CAMPUSES as unknown as string[]}
              onChange={(v) => setStudent({ ...student, campus: v })}
            />

            <Row>
              <Input
                label="Email"
                value={student.email}
                onChangeText={(v) => setStudent({ ...student, email: v })}
                placeholder="you@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label="Contact number"
                value={student.contactNumber}
                onChangeText={(v) =>
                  setStudent({ ...student, contactNumber: v })
                }
                placeholder="09xx xxx xxxx"
                keyboardType="phone-pad"
              />
            </Row>
          </View>
        </View>

        {/* Guardian info */}
        {requesterType === "guardian" && (
          <View className="mb-5">
            <SectionLabel>Guardian information</SectionLabel>
            <View className="mt-2">
              <Row>
                <Input
                  label="First name"
                  value={guardian.firstName}
                  onChangeText={(v) =>
                    setGuardian({ ...guardian, firstName: v })
                  }
                />
                <Input
                  label="Last name"
                  value={guardian.lastName}
                  onChangeText={(v) =>
                    setGuardian({ ...guardian, lastName: v })
                  }
                />
              </Row>
              <Input
                label="Middle name"
                value={guardian.middleName}
                onChangeText={(v) =>
                  setGuardian({ ...guardian, middleName: v })
                }
                placeholder="Optional"
              />
              <PickerRow
                label="Relationship"
                value={guardian.relationship}
                options={RELATIONSHIPS as unknown as string[]}
                onChange={(v) => setGuardian({ ...guardian, relationship: v })}
              />
              <Row>
                <Input
                  label="Email"
                  value={guardian.email}
                  onChangeText={(v) => setGuardian({ ...guardian, email: v })}
                  placeholder="guardian@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Input
                  label="Contact"
                  value={guardian.contactNumber}
                  onChangeText={(v) =>
                    setGuardian({ ...guardian, contactNumber: v })
                  }
                  placeholder="09xx xxx xxxx"
                  keyboardType="phone-pad"
                />
              </Row>
            </View>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          className="rounded-2xl py-4 items-center justify-center flex-row gap-2"
          style={{
            backgroundColor: canSubmit && !submitting ? C.navy : C.border,
          }}
        >
          {submitting ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <>
              <Text
                className="text-[15px] font-bold"
                style={{ color: C.white }}
              >
                Get queue number
              </Text>
              <MaterialIcons name="arrow-forward" size={18} color={C.white} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ── Receipt modal ───────────────────────────────────── */}
      <TicketReceiptModal
        visible={receiptVisible}
        data={receipt}
        onConfirm={() => {
          setReceiptVisible(false);
          router.replace("/");
        }}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Building blocks ───────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      className="text-[11px] font-bold uppercase tracking-[2px]"
      style={{ color: C.navy }}
    >
      {children}
    </Text>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View className="flex-row gap-3">{children}</View>;
}

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  maxLength,
  multiline,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  maxLength?: number;
  multiline?: boolean;
}) {
  return (
    <View className="flex-1 mb-3">
      {label ? (
        <Text
          className="text-[11px] font-bold mb-1.5 uppercase tracking-[1px]"
          style={{ color: C.navySoft }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        multiline={multiline}
        className="rounded-xl px-3.5 py-3 border text-[14px]"
        style={{
          borderColor: C.border,
          color: C.navy,
          backgroundColor: C.white,
          minHeight: multiline ? 80 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

function PickerRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <View className="mb-3">
      <Text
        className="text-[11px] font-bold mb-1.5 uppercase tracking-[1px]"
        style={{ color: C.navySoft }}
      >
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              activeOpacity={0.85}
              onPress={() => onChange(opt)}
              className="rounded-full px-3 py-1.5 border"
              style={{
                backgroundColor: active ? C.navy : C.white,
                borderColor: active ? C.navy : C.border,
              }}
            >
              <Text
                className="text-[11px] font-bold"
                style={{ color: active ? C.white : C.navy }}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
