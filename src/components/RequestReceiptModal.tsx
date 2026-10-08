// components/RequestReceiptModal.tsx

import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { C, SERIF } from "@/lib/theme";

export interface ReceiptData {
  requestId: string;
  documentType: string;
  documentLabel: string;
  studentName: string;
  schoolId?: string;
  copies: number;
  purpose: string;
  fee: number;
  submittedAt: string; // ISO date
  isTor?: boolean;
}

const DOCUMENT_LABELS: Record<string, string> = {
  tor: "Transcript of Records",
  "good-moral": "Good Moral Certificate",
  diploma: "Diploma",
  "certificate-of-graduation": "Certificate of Graduation",
  "certificate-of-enrollment": "Certificate of Enrollment",
  other: "Other Document",
};

export function getDocumentLabel(type: string) {
  return DOCUMENT_LABELS[type] ?? type;
}

export default function RequestReceiptModal({
  visible,
  data,
  onClose,
}: {
  visible: boolean;
  data: ReceiptData | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    if (!data) return;
    try {
      await Clipboard.setStringAsync(data.requestId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — clipboard isn't critical
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(15, 23, 34, 0.55)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 420,
            backgroundColor: C.white,
            borderRadius: 28,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 12 },
            elevation: 12,
          }}
        >
          {/* Success strip */}
          <View
            style={{
              backgroundColor: C.navy,
              paddingTop: 28,
              paddingBottom: 24,
              paddingHorizontal: 24,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <MaterialIcons name="check" size={30} color={C.white} />
            </View>
            <Text
              style={{
                color: C.white,
                fontSize: 18,
                fontFamily: SERIF,
                fontWeight: "700",
              }}
            >
              Request submitted
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.72)",
                fontSize: 12,
                marginTop: 4,
                textAlign: "center",
                lineHeight: 17,
              }}
            >
              Save your request ID — you'll need it to check the status.
            </Text>
          </View>

          {/* Receipt body */}
          <ScrollView
            style={{ maxHeight: 420 }}
            contentContainerStyle={{ padding: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Big request ID + copy */}
            <View
              style={{
                backgroundColor: C.tint,
                borderRadius: 20,
                padding: 18,
                borderWidth: 1,
                borderColor: C.border,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: C.navySoft,
                }}
              >
                Request ID
              </Text>
              <Text
                selectable
                style={{
                  fontSize: 26,
                  fontFamily: SERIF,
                  fontWeight: "700",
                  color: C.navy,
                  marginTop: 6,
                  letterSpacing: 1,
                }}
              >
                {data?.requestId ?? "—"}
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={copyId}
                style={{
                  marginTop: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: copied ? C.navy : C.white,
                  borderWidth: 1,
                  borderColor: copied ? C.navy : C.border,
                }}
              >
                <MaterialIcons
                  name={copied ? "check" : "content-copy"}
                  size={14}
                  color={copied ? C.white : C.navy}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: copied ? C.white : C.navy,
                  }}
                >
                  {copied ? "Copied" : "Copy ID"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Details */}
            <View style={{ marginTop: 20 }}>
              <Row label="Document" value={data?.documentLabel ?? "—"} />
              <Row label="Student" value={data?.studentName ?? "—"} />
              {data?.schoolId ? (
                <Row label="School ID" value={data.schoolId} />
              ) : null}
              <Row label="Copies" value={String(data?.copies ?? 1)} />
              <Row label="Purpose" value={data?.purpose ?? "—"} multiline />
              {data?.isTor && data.fee > 0 ? (
                <Row
                  label="Fee"
                  value={`₱${data.fee}`}
                  valueStyle={{ color: C.navy, fontWeight: "700" }}
                />
              ) : null}
              <Row
                label="Submitted"
                value={
                  data?.submittedAt
                    ? new Date(data.submittedAt).toLocaleString([], {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"
                }
              />
            </View>

            {/* Note */}
            <View
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 14,
                backgroundColor: C.tint,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: C.muted,
                  lineHeight: 16,
                }}
              >
                Bring a valid ID when claiming. Pay the fee at the cashier if
                applicable. You can check the status anytime using your Request
                ID.
              </Text>
            </View>
          </ScrollView>

          {/* Footer button */}
          <Pressable
            onPress={onClose}
            style={{
              marginHorizontal: 24,
              marginBottom: 24,
              marginTop: 4,
              paddingVertical: 14,
              borderRadius: 16,
              backgroundColor: C.navy,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: C.white,
                fontSize: 15,
                fontWeight: "700",
              }}
            >
              Done
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Row({
  label,
  value,
  multiline,
  valueStyle,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  valueStyle?: any;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: multiline ? "flex-start" : "center",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        gap: 16,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 1,
          color: C.navySoft,
        }}
      >
        {label}
      </Text>
      <Text
        selectable
        style={[
          {
            flex: 1,
            textAlign: "right",
            fontSize: 13,
            color: C.navy,
            fontWeight: "600",
          },
          valueStyle,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}
