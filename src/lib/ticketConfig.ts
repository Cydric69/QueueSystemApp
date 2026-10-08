export type DepartmentKey = "cashier" | "dean" | "registrar";

export type Option = { value: string; label: string };

export type DepartmentInfo = {
  title: string;
  subtitle: string;
  mode: "queue" | "document";
  sectionTitle: string;
  transactionLabel: string;
  cta: string;
  notice?: string;
  transactions: Option[];
};

export const DEPARTMENT_INFO: Record<DepartmentKey, DepartmentInfo> = {
  cashier: {
    title: "Cashier",
    subtitle: "Tuition, fees & payments",
    mode: "queue",
    sectionTitle: "Transaction",
    transactionLabel: "What do you need?",
    cta: "Get Queue Number",
    transactions: [
      { value: "tuition-payment", label: "Tuition Payment" },
      { value: "miscellaneous-fee", label: "Miscellaneous Fee Payment" },
      { value: "document-payment", label: "Document Payment" },
      { value: "other-school-fees", label: "Other School Fees" },
      { value: "assessment", label: "Assessment" },
    ],
  },
  dean: {
    title: "Dean's Office",
    subtitle: "Academic concerns & advisory",
    mode: "queue",
    sectionTitle: "Transaction",
    transactionLabel: "What do you need?",
    cta: "Get Queue Number",
    transactions: [
      { value: "grade-appeal", label: "Grade Appeal" },
      { value: "academic-concern", label: "Academic Concern" },
      { value: "course-approval", label: "Course Approval" },
      { value: "student-discipline", label: "Student Discipline" },
      { value: "faculty-concern", label: "Faculty Concern" },
      { value: "curriculum-review", label: "Curriculum Review" },
      { value: "academic-advisory", label: "Academic Advisory" },
    ],
  },
  registrar: {
    title: "Registrar",
    subtitle: "Document requests",
    mode: "document",
    sectionTitle: "Document",
    transactionLabel: "Which document?",
    cta: "Submit Request",
    notice:
      "This is a document request, not a queue. You'll get a reference number to track its status.",
    transactions: [
      { value: "certificate-enrollment", label: "Certificate of Enrollment" },
      { value: "transcript-records", label: "Transcript of Records" },
      { value: "request-grades", label: "Request for Grades" },
      { value: "request-assessment", label: "Request for Assessment" },
      { value: "good-moral", label: "Good Moral Certificate" },
      { value: "diploma", label: "Diploma" },
      { value: "other-document", label: "Other Document Request" },
    ],
  },
};

export const TRANSACTION_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(DEPARTMENT_INFO).flatMap((d) =>
    d.transactions.map((t) => [t.value, t.label]),
  ),
);

const toOptions = (values: string[]): Option[] =>
  values.map((v) => ({ value: v, label: v }));

export const GENDER_OPTIONS = toOptions(["Male", "Female", "Other"]);

export const SUFFIX_OPTIONS: Option[] = [
  { value: "", label: "None" },
  ...toOptions(["Jr.", "Sr.", "II", "III", "IV", "V"]),
];

export const RELATIONSHIP_OPTIONS = toOptions([
  "Father",
  "Mother",
  "Guardian",
  "Other",
]);

export const YEAR_LEVEL_OPTIONS = toOptions([
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
]);

const JHS = ["Grade 7", "Grade 8", "Grade 9", "Grade 10"];

export function getCampusForYearLevel(year: string): string {
  if (!year) return "";
  return JHS.includes(year)
    ? "Binalbagan Catholic College - JHS Campus"
    : "Binalbagan Catholic College - Main Campus";
}

// What GET/POST /api/tickets returns
export type TicketView = {
  ticketId: string;
  ticketNumber: string;
  department: DepartmentKey;
  transactionType: string;
  transactionDescription?: string;
  amount: number;
  status: "pending" | "serving" | "completed" | "cancelled";
  servingWindow?: string | null;
  studentName: string;
  createdAt: string;
  peopleAhead: number;
  nowServing: { ticketNumber: string; window?: string | null } | null;
};
