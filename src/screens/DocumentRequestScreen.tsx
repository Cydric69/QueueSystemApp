// screens/DocumentRequestScreen.tsx

import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
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

import RequestReceiptModal, {
  getDocumentLabel,
  type ReceiptData,
} from "@/components/RequestReceiptModal";
import { api, ApiError } from "@/lib/api";
import { C, SERIF } from "@/lib/theme";

// ─── Fees ──────────────────────────────────────────────────────────────────
const CAV_FEE = 80;
const AUTH_OTR_FEE = 30;
const OTR_FEE = 300;

// ─── Document types ────────────────────────────────────────────────────────
const DOCUMENT_TYPES = [
  { value: "tor", label: "Transcript of Records", requiresTor: true },
  { value: "good-moral", label: "Good Moral Certificate", requiresTor: false },
  { value: "diploma", label: "Diploma", requiresTor: false },
  {
    value: "certificate-of-graduation",
    label: "Certificate of Graduation",
    requiresTor: false,
  },
  {
    value: "certificate-of-enrollment",
    label: "Certificate of Enrollment",
    requiresTor: false,
  },
  { value: "other", label: "Other Document", requiresTor: false },
];

// ─── Types ─────────────────────────────────────────────────────────────────
interface StudentInfo {
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

interface TorDetails {
  purpose: {
    employment: boolean;
    employmentScope: "local" | "abroad";
    cavChed: boolean;
    cavScope: "local" | "abroad";
    boardExam: boolean;
    boardExamType: "cpa" | "let" | "other";
    boardExamOther: string;
  };
  student: {
    lastName: string;
    firstName: string;
    middleName: string;
    birthdate: string;
    birthplace: string;
    gender: "male" | "female";
    address: string;
    contactNo: string;
  };
  academic: {
    course: string;
    major: string;
    yearGraduated: string;
    notGraduated: boolean;
    semester: "1st" | "2nd" | "Summer";
    schoolYear: string;
  };
  educationalBackground: {
    elementary: { school: string; yearGraduated: string };
    highSchool: { school: string; yearGraduated: string };
    seniorHigh: { school: string; yearGraduated: string };
  };
  fee: number;
}

const EMPTY_STUDENT: StudentInfo = {
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

const EMPTY_TOR: TorDetails = {
  purpose: {
    employment: false,
    employmentScope: "local",
    cavChed: false,
    cavScope: "local",
    boardExam: false,
    boardExamType: "cpa",
    boardExamOther: "",
  },
  student: {
    lastName: "",
    firstName: "",
    middleName: "",
    birthdate: "",
    birthplace: "",
    gender: "male",
    address: "",
    contactNo: "",
  },
  academic: {
    course: "",
    major: "",
    yearGraduated: "",
    notGraduated: false,
    semester: "1st",
    schoolYear: "",
  },
  educationalBackground: {
    elementary: { school: "", yearGraduated: "" },
    highSchool: { school: "", yearGraduated: "" },
    seniorHigh: { school: "", yearGraduated: "" },
  },
  fee: OTR_FEE,
};

// ─── Derive a stable userId ────────────────────────────────────────────────
function deriveUserId(student: StudentInfo): string {
  const parts: string[] = [];
  const sid = student.schoolId.trim().toLowerCase();
  if (sid) {
    parts.push(`sid:${sid}`);
  } else {
    const email = student.email.trim().toLowerCase();
    if (email) parts.push(`em:${email}`);
    const name = [
      student.firstName,
      student.middleName,
      student.lastName,
      student.suffix,
    ]
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean)
      .join("|");
    if (name) parts.push(`nm:${name}`);
    const bd = student.birthdate.trim();
    if (bd) parts.push(`bd:${bd}`);
    const cn = student.contactNumber.trim();
    if (cn) parts.push(`cn:${cn}`);
  }
  const raw = parts.join("~") || `anon:${Date.now()}`;
  return `u_${hash32(raw)}`;
}

function hash32(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

// ─── Screen ────────────────────────────────────────────────────────────────
export default function DocumentRequestScreen() {
  const router = useRouter();

  const [documentType, setDocumentType] = useState<string>("");
  const [otherDescription, setOtherDescription] = useState("");
  const [copies, setCopies] = useState(1);
  const [student, setStudent] = useState<StudentInfo>(EMPTY_STUDENT);
  const [tor, setTor] = useState<TorDetails>(EMPTY_TOR);
  const [showTorExtras, setShowTorExtras] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [receiptVisible, setReceiptVisible] = useState(false);

  const selectedDoc = useMemo(
    () => DOCUMENT_TYPES.find((d) => d.value === documentType),
    [documentType],
  );
  const needsTor = selectedDoc?.requiresTor ?? false;

  const torFee = useMemo(
    () => OTR_FEE + (tor.purpose.cavChed ? CAV_FEE + AUTH_OTR_FEE : 0),
    [tor.purpose.cavChed],
  );

  // Purpose for backend: from checkboxes for TOR, from the label otherwise
  const effectivePurpose = useMemo(() => {
    if (needsTor) {
      const parts = [
        tor.purpose.employment
          ? `Employment (${tor.purpose.employmentScope})`
          : null,
        tor.purpose.cavChed ? `CAV-CHED (${tor.purpose.cavScope})` : null,
        tor.purpose.boardExam
          ? tor.purpose.boardExamType === "other"
            ? `Board Exam – ${tor.purpose.boardExamOther || "Other"}`
            : `Board Exam (${tor.purpose.boardExamType.toUpperCase()})`
          : null,
      ].filter(Boolean);
      return parts.join(", ") || "Transcript of Records";
    }
    return selectedDoc?.label ?? documentType;
  }, [needsTor, tor.purpose, selectedDoc, documentType]);

  const canSubmit = useMemo(() => {
    if (!documentType) return false;
    if (documentType === "other" && !otherDescription.trim()) return false;
    if (!student.firstName.trim() || !student.lastName.trim()) return false;
    if (!student.email.trim() && !student.contactNumber.trim()) return false;
    if (needsTor) {
      const a = tor.academic;
      if (!a.course.trim()) return false;
      if (!a.notGraduated && !a.yearGraduated.trim()) return false;
    }
    return true;
  }, [documentType, otherDescription, student, tor, needsTor]);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const userId = deriveUserId(student);

      const mergedTor = needsTor
        ? {
            ...tor,
            student: {
              lastName: student.lastName.trim(),
              firstName: student.firstName.trim(),
              middleName: student.middleName.trim(),
              birthdate: student.birthdate.trim(),
              birthplace: tor.student.birthplace,
              gender: (student.gender?.toLowerCase() === "female"
                ? "female"
                : "male") as "male" | "female",
              address: tor.student.address,
              contactNo: student.contactNumber.trim(),
            },
            fee: torFee,
          }
        : null;

      const body = {
        userId,
        student,
        documentType,
        otherDescription: documentType === "other" ? otherDescription : "",
        purpose: effectivePurpose,
        copies,
        torDetails: mergedTor,
      };

      const created = await api<any>("/api/document-requests", {
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
        requestId: created?.requestId ?? "—",
        documentType,
        documentLabel: getDocumentLabel(documentType),
        studentName,
        schoolId: student.schoolId || undefined,
        copies,
        purpose: effectivePurpose,
        fee: needsTor ? torFee : 0,
        submittedAt: created?.createdAt ?? new Date().toISOString(),
        isTor: needsTor,
      });
      setReceiptVisible(true);
    } catch (e: any) {
      const msg =
        e instanceof ApiError && e.message
          ? e.message
          : "Could not submit the request. Please try again.";
      Alert.alert("Submission failed", msg);
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
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center mb-5">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full items-center justify-center border"
            style={{ borderColor: C.border }}
          >
            <MaterialIcons name="arrow-back" size={18} color={C.navy} />
          </TouchableOpacity>
          <View className="ml-3 flex-1">
            <Text
              className="text-[10px] font-semibold uppercase tracking-[2px]"
              style={{ color: C.navySoft }}
            >
              Registrar
            </Text>
            <Text
              className="text-[20px] mt-0.5"
              style={{ color: C.navy, fontFamily: SERIF, fontWeight: "700" }}
            >
              Document Request
            </Text>
          </View>
        </View>

        {/* Document type */}
        <Label>Document</Label>
        <View className="flex-row flex-wrap gap-1.5 mt-1.5 mb-4">
          {DOCUMENT_TYPES.map((doc) => {
            const active = documentType === doc.value;
            return (
              <TouchableOpacity
                key={doc.value}
                activeOpacity={0.85}
                onPress={() => setDocumentType(doc.value)}
                className="rounded-full px-3 py-1.5 border"
                style={{
                  backgroundColor: active ? C.navy : C.white,
                  borderColor: active ? C.navy : C.border,
                }}
              >
                <Text
                  className="text-[12px] font-semibold"
                  style={{ color: active ? C.white : C.navy }}
                >
                  {doc.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {documentType === "other" && (
          <>
            <Label>Describe</Label>
            <Input
              value={otherDescription}
              onChangeText={setOtherDescription}
              placeholder="e.g. Certificate of good standing"
              maxLength={200}
              fullWidth
            />
          </>
        )}

        {/* Student info */}
        <Label>Your information</Label>
        <View className="mt-1.5">
          <Input
            label="School ID"
            value={student.schoolId}
            onChangeText={(v) => setStudent({ ...student, schoolId: v })}
            placeholder="20210001"
            fullWidth
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
              label="Email"
              value={student.email}
              onChangeText={(v) => setStudent({ ...student, email: v })}
              placeholder="you@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Contact"
              value={student.contactNumber}
              onChangeText={(v) => setStudent({ ...student, contactNumber: v })}
              placeholder="09xx xxx xxxx"
              keyboardType="phone-pad"
            />
          </Row>
          <Row>
            <DateField
              label="Birthdate"
              value={student.birthdate}
              onChange={(v) => setStudent({ ...student, birthdate: v })}
              maximumDate={new Date()}
            />
            <Input
              label="Year level"
              value={student.year}
              onChangeText={(v) => setStudent({ ...student, year: v })}
              placeholder="3rd Year"
            />
          </Row>
          <Input
            label="Campus"
            value={student.campus}
            onChangeText={(v) => setStudent({ ...student, campus: v })}
            placeholder="Main"
            fullWidth
          />
        </View>

        {/* Copies */}
        <Label>Copies</Label>
        <View className="flex-row items-center gap-2 mt-1.5 mb-4">
          <Stepper onPress={() => setCopies(Math.max(1, copies - 1))}>
            −
          </Stepper>
          <View
            className="flex-1 rounded-xl border items-center justify-center py-2.5"
            style={{ borderColor: C.border }}
          >
            <Text
              className="text-[16px]"
              style={{ color: C.navy, fontWeight: "700" }}
            >
              {copies}
            </Text>
          </View>
          <Stepper onPress={() => setCopies(Math.min(5, copies + 1))}>
            +
          </Stepper>
        </View>

        {/* TOR extras */}
        {needsTor && (
          <>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowTorExtras((v) => !v)}
              className="rounded-xl border px-4 py-3 flex-row items-center justify-between"
              style={{ borderColor: C.border, backgroundColor: C.tint }}
            >
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="info-outline" size={15} color={C.navy} />
                <Text
                  className="text-[12px] font-bold"
                  style={{ color: C.navy }}
                >
                  TOR details required
                </Text>
              </View>
              <MaterialIcons
                name={showTorExtras ? "expand-less" : "expand-more"}
                size={20}
                color={C.navy}
              />
            </TouchableOpacity>

            {showTorExtras && (
              <View className="mt-4">
                {/* 1. Purpose of Request */}
                <TorSectionHeader icon="work" title="Purpose of Request" />
                <View
                  className="rounded-xl border p-4 mb-4"
                  style={{
                    borderColor: C.border,
                    backgroundColor: "#F8FAFC",
                  }}
                >
                  <CheckboxRow
                    label="Employment Purposes"
                    checked={tor.purpose.employment}
                    onToggle={() =>
                      setTor({
                        ...tor,
                        purpose: {
                          ...tor.purpose,
                          employment: !tor.purpose.employment,
                        },
                      })
                    }
                  />
                  {tor.purpose.employment && (
                    <View className="ml-7 mb-2">
                      <Segmented
                        options={[
                          { value: "local", label: "Local" },
                          { value: "abroad", label: "Abroad" },
                        ]}
                        value={tor.purpose.employmentScope}
                        onChange={(v) =>
                          setTor({
                            ...tor,
                            purpose: {
                              ...tor.purpose,
                              employmentScope: v as "local" | "abroad",
                            },
                          })
                        }
                      />
                    </View>
                  )}

                  <CheckboxRow
                    label="CAV-CHED (Red Ribbon)"
                    checked={tor.purpose.cavChed}
                    onToggle={() =>
                      setTor({
                        ...tor,
                        purpose: {
                          ...tor.purpose,
                          cavChed: !tor.purpose.cavChed,
                        },
                      })
                    }
                  />
                  {tor.purpose.cavChed && (
                    <View className="ml-7 mb-2">
                      <Segmented
                        options={[
                          { value: "local", label: "Local" },
                          { value: "abroad", label: "Abroad" },
                        ]}
                        value={tor.purpose.cavScope}
                        onChange={(v) =>
                          setTor({
                            ...tor,
                            purpose: {
                              ...tor.purpose,
                              cavScope: v as "local" | "abroad",
                            },
                          })
                        }
                      />
                    </View>
                  )}

                  <CheckboxRow
                    label="Board Exam"
                    checked={tor.purpose.boardExam}
                    onToggle={() =>
                      setTor({
                        ...tor,
                        purpose: {
                          ...tor.purpose,
                          boardExam: !tor.purpose.boardExam,
                        },
                      })
                    }
                  />
                  {tor.purpose.boardExam && (
                    <View className="ml-7 mb-2">
                      <Segmented
                        options={[
                          { value: "cpa", label: "CPA" },
                          { value: "let", label: "LET" },
                          { value: "other", label: "Others" },
                        ]}
                        value={tor.purpose.boardExamType}
                        onChange={(v) =>
                          setTor({
                            ...tor,
                            purpose: {
                              ...tor.purpose,
                              boardExamType: v as "cpa" | "let" | "other",
                            },
                          })
                        }
                      />
                      {tor.purpose.boardExamType === "other" && (
                        <Input
                          value={tor.purpose.boardExamOther}
                          onChangeText={(v) =>
                            setTor({
                              ...tor,
                              purpose: {
                                ...tor.purpose,
                                boardExamOther: v,
                              },
                            })
                          }
                          placeholder="Please indicate"
                          fullWidth
                        />
                      )}
                    </View>
                  )}
                </View>

                {/* 2. Additional details */}
                <TorSectionHeader icon="person" title="Additional details" />
                <View className="mb-4">
                  <Input
                    label="Birthplace"
                    value={tor.student.birthplace}
                    onChangeText={(v) =>
                      setTor({
                        ...tor,
                        student: { ...tor.student, birthplace: v },
                      })
                    }
                    placeholder="City / Municipality"
                    fullWidth
                  />
                  <Input
                    label="Address"
                    value={tor.student.address}
                    onChangeText={(v) =>
                      setTor({
                        ...tor,
                        student: { ...tor.student, address: v },
                      })
                    }
                    placeholder="Complete address"
                    multiline
                    fullWidth
                  />
                </View>

                {/* 3. Educational Background */}
                <TorSectionHeader
                  icon="school"
                  title="Educational Background"
                />
                <View
                  className="rounded-xl border p-4 mb-4"
                  style={{
                    borderColor: C.border,
                    backgroundColor: "#F8FAFC",
                  }}
                >
                  <SchoolEntry
                    label="Elementary"
                    value={tor.educationalBackground.elementary}
                    onChange={(v) =>
                      setTor({
                        ...tor,
                        educationalBackground: {
                          ...tor.educationalBackground,
                          elementary: v,
                        },
                      })
                    }
                  />
                  <SchoolEntry
                    label="High School"
                    value={tor.educationalBackground.highSchool}
                    onChange={(v) =>
                      setTor({
                        ...tor,
                        educationalBackground: {
                          ...tor.educationalBackground,
                          highSchool: v,
                        },
                      })
                    }
                  />
                  <SchoolEntry
                    label="Senior High"
                    value={tor.educationalBackground.seniorHigh}
                    onChange={(v) =>
                      setTor({
                        ...tor,
                        educationalBackground: {
                          ...tor.educationalBackground,
                          seniorHigh: v,
                        },
                      })
                    }
                  />
                </View>

                {/* 4. Academic Information */}
                <TorSectionHeader
                  icon="menu-book"
                  title="Academic Information"
                />
                <View className="mb-4">
                  <Row>
                    <Input
                      label="Course *"
                      value={tor.academic.course}
                      onChangeText={(v) =>
                        setTor({
                          ...tor,
                          academic: { ...tor.academic, course: v },
                        })
                      }
                      placeholder="BS Computer Science"
                    />
                    <Input
                      label="Major"
                      value={tor.academic.major}
                      onChangeText={(v) =>
                        setTor({
                          ...tor,
                          academic: { ...tor.academic, major: v },
                        })
                      }
                      placeholder="Optional"
                    />
                  </Row>
                  <Row>
                    <Input
                      label="Year graduated"
                      value={tor.academic.yearGraduated}
                      onChangeText={(v) =>
                        setTor({
                          ...tor,
                          academic: { ...tor.academic, yearGraduated: v },
                        })
                      }
                      placeholder="2024"
                      editable={!tor.academic.notGraduated}
                    />
                    <View className="flex-1 mb-2.5 justify-end">
                      <CheckboxRow
                        label="Not yet graduated"
                        checked={tor.academic.notGraduated}
                        onToggle={() =>
                          setTor({
                            ...tor,
                            academic: {
                              ...tor.academic,
                              notGraduated: !tor.academic.notGraduated,
                            },
                          })
                        }
                      />
                    </View>
                  </Row>
                  {tor.academic.notGraduated && (
                    <>
                      <Text
                        className="text-[11px] font-semibold mb-1 uppercase tracking-[0.5px]"
                        style={{ color: C.navySoft }}
                      >
                        Last semester attended
                      </Text>
                      <Segmented
                        options={[
                          { value: "1st", label: "1st" },
                          { value: "2nd", label: "2nd" },
                          { value: "Summer", label: "Summer" },
                        ]}
                        value={tor.academic.semester}
                        onChange={(v) =>
                          setTor({
                            ...tor,
                            academic: {
                              ...tor.academic,
                              semester: v as "1st" | "2nd" | "Summer",
                            },
                          })
                        }
                      />
                      <Input
                        label="School year"
                        value={tor.academic.schoolYear}
                        onChangeText={(v) =>
                          setTor({
                            ...tor,
                            academic: { ...tor.academic, schoolYear: v },
                          })
                        }
                        placeholder="2023-2024"
                        fullWidth
                      />
                    </>
                  )}
                </View>

                {/* 5. Fee summary */}
                <View
                  className="rounded-xl border p-4 mb-2 flex-row items-center justify-between"
                  style={{
                    borderColor: C.border,
                    backgroundColor: "#F8FAFC",
                  }}
                >
                  <View className="flex-1 pr-3">
                    <Text
                      className="text-[13px] font-bold"
                      style={{ color: C.navy }}
                    >
                      OTR (for Employment)
                    </Text>
                    {tor.purpose.cavChed && (
                      <Text
                        className="text-[11px] mt-0.5"
                        style={{ color: C.muted }}
                      >
                        + CAV authentication (₱{CAV_FEE}) + OTR authentication
                        (₱{AUTH_OTR_FEE}/set)
                      </Text>
                    )}
                  </View>
                  <Text
                    className="text-[20px]"
                    style={{
                      color: C.navy,
                      fontFamily: SERIF,
                      fontWeight: "700",
                    }}
                  >
                    ₱{torFee}.00
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Submit */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          className="rounded-2xl py-4 items-center justify-center flex-row gap-2 mt-4"
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
                Submit request
              </Text>
              <MaterialIcons name="arrow-forward" size={18} color={C.white} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <RequestReceiptModal
        visible={receiptVisible}
        data={receipt}
        onClose={() => {
          setReceiptVisible(false);
          router.replace("/");
        }}
      />
    </KeyboardAvoidingView>
  );
}

// ─── TOR section header ────────────────────────────────────────────────────
function TorSectionHeader({
  icon,
  title,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
}) {
  return (
    <View className="flex-row items-center gap-2 mb-3">
      <MaterialIcons name={icon} size={16} color={C.navy} />
      <Text className="text-[13px] font-bold" style={{ color: C.navy }}>
        {title}
      </Text>
    </View>
  );
}

// ─── Building blocks ───────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text
      className="text-[11px] font-bold uppercase tracking-[1.5px] mt-4 mb-1"
      style={{ color: C.navy }}
    >
      {children}
    </Text>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View className="flex-row gap-2">{children}</View>;
}

function Stepper({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="w-10 h-10 rounded-full items-center justify-center border"
      style={{ borderColor: C.border }}
    >
      <Text style={{ color: C.navy, fontWeight: "700", fontSize: 18 }}>
        {children}
      </Text>
    </TouchableOpacity>
  );
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
  fullWidth,
  editable = true,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  maxLength?: number;
  multiline?: boolean;
  fullWidth?: boolean;
  editable?: boolean;
}) {
  return (
    <View className={fullWidth ? "w-full mb-2.5" : "flex-1 mb-2.5"}>
      {label ? (
        <Text
          className="text-[11px] font-semibold mb-1 uppercase tracking-[0.5px]"
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
        editable={editable}
        className="rounded-xl px-3 py-2.5 border text-[14px] w-full"
        style={{
          borderColor: C.border,
          color: C.navy,
          backgroundColor: editable ? C.white : "#F1F5F9",
          minHeight: multiline ? 72 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

function DateField({
  label,
  value,
  onChange,
  placeholder = "YYYY-MM-DD",
  maximumDate,
  minimumDate,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}) {
  const [show, setShow] = useState(false);

  const parsed = useMemo(() => {
    if (!value) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!m) return null;
    const [, y, mo, d] = m;
    const dt = new Date(Number(y), Number(mo) - 1, Number(d));
    return isNaN(dt.getTime()) ? null : dt;
  }, [value]);

  const formatYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const handleValueChange = (_event: any, date: Date) => {
    onChange(formatYMD(date));
    if (Platform.OS === "android") setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
  };

  return (
    <View className="flex-1 mb-2.5">
      {label ? (
        <Text
          className="text-[11px] font-semibold mb-1 uppercase tracking-[0.5px]"
          style={{ color: C.navySoft }}
        >
          {label}
        </Text>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setShow((v) => !v)}
        className="rounded-xl px-3 py-2.5 border flex-row items-center justify-between"
        style={{ borderColor: C.border, backgroundColor: C.white }}
      >
        <Text
          className="text-[14px]"
          style={{ color: parsed ? C.navy : C.muted }}
        >
          {parsed ? formatYMD(parsed) : placeholder}
        </Text>
        <MaterialIcons name="calendar-today" size={16} color={C.navy} />
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={parsed ?? new Date(2000, 0, 1)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onValueChange={handleValueChange}
          onDismiss={handleDismiss}
          maximumDate={maximumDate ?? new Date()}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
}

function CheckboxRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onToggle}
      className="flex-row items-center py-2"
    >
      <View
        className="w-5 h-5 rounded-md items-center justify-center border-2"
        style={{
          borderColor: checked ? C.navy : C.border,
          backgroundColor: checked ? C.navy : "transparent",
        }}
      >
        {checked && <MaterialIcons name="check" size={12} color={C.white} />}
      </View>
      <Text
        className="ml-2.5 text-[13px] font-semibold"
        style={{ color: C.navy }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View
      className="flex-row rounded-full p-1 border mb-2.5"
      style={{ borderColor: C.border, backgroundColor: C.tint }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            activeOpacity={0.85}
            onPress={() => onChange(opt.value)}
            className="flex-1 items-center py-1.5 rounded-full"
            style={{ backgroundColor: active ? C.navy : "transparent" }}
          >
            <Text
              className="text-[11px] font-bold"
              style={{ color: active ? C.white : C.navySoft }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SchoolEntry({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { school: string; yearGraduated: string };
  onChange: (v: { school: string; yearGraduated: string }) => void;
}) {
  return (
    <View className="mb-3">
      <Text
        className="text-[11px] font-bold mb-1.5 uppercase tracking-[1px]"
        style={{ color: C.navy }}
      >
        {label}
      </Text>
      <Row>
        <Input
          label="School"
          value={value.school}
          onChangeText={(v) => onChange({ ...value, school: v })}
          placeholder="Name of school"
        />
        <Input
          label="Year graduated"
          value={value.yearGraduated}
          onChangeText={(v) => onChange({ ...value, yearGraduated: v })}
          placeholder="2018"
          keyboardType="numeric"
        />
      </Row>
    </View>
  );
}
