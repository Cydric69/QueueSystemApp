// components/TicketReceiptModal.tsx

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

export interface TicketReceiptData {
  ticketNumber: string;
  ticketId: string;
  department: string;
  departmentLabel: string;
  transactionLabel: string;
  studentName: string;
  amount?: number;
  queuePosition?: number | null;
  nowServing?: { ticketNumber: string; window?: string | null } | null;
  peopleAhead?: number | null;
  createdAt?: string;
}

export default function TicketReceiptModal({
  visible,
  data,
  onConfirm,
}: {
  visible: boolean;
  data: TicketReceiptData | null;
  onConfirm: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyNumber = async () => {
    if (!data) return;
    try {
      await Clipboard.setStringAsync(data.ticketNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard isn't critical */
    }
  };

  const formatAmount = (n?: number) =>
    n == null
      ? null
      : `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onConfirm}
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
              <MaterialIcons
                name="confirmation-number"
                size={28}
                color={C.white}
              />
            </View>
            <Text
              style={{
                color: C.white,
                fontSize: 12,
                fontWeight: "600",
                letterSpacing: 2,
                textTransform: "uppercase",
                opacity: 0.72,
              }}
            >
              Your Ticket
            </Text>
            <Text
              selectable
              style={{
                color: C.white,
                fontSize: 52,
                fontFamily: SERIF,
                fontWeight: "700",
                marginTop: 4,
                letterSpacing: 1,
              }}
            >
              #{data?.ticketNumber ?? "—"}
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.72)",
                fontSize: 12,
                marginTop: 6,
                textAlign: "center",
              }}
            >
              {data?.departmentLabel ?? ""}
            </Text>
          </View>

          {/* Body */}
          <ScrollView
            style={{ maxHeight: 340 }}
            contentContainerStyle={{ padding: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Copy button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={copyNumber}
              style={{
                alignSelf: "center",
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 16,
                paddingVertical: 9,
                borderRadius: 999,
                backgroundColor: copied ? C.navy : C.tint,
                marginBottom: 20,
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
                {copied ? "Copied" : "Copy ticket number"}
              </Text>
            </TouchableOpacity>

            {/* Queue status snapshot */}
            {data?.peopleAhead != null && (
              <View
                style={{
                  backgroundColor: C.tint,
                  borderRadius: 18,
                  padding: 16,
                  marginBottom: 16,
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
                  {data.peopleAhead === 0 ? "You're next" : "People ahead"}
                </Text>
                <Text
                  style={{
                    fontSize: 32,
                    fontFamily: SERIF,
                    fontWeight: "700",
                    color: C.navy,
                    marginTop: 4,
                  }}
                >
                  {data.peopleAhead}
                </Text>
                {data.nowServing?.ticketNumber && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      marginTop: 6,
                    }}
                  >
                    Now serving #{data.nowServing.ticketNumber}
                    {data.nowServing.window
                      ? ` · ${data.nowServing.window}`
                      : ""}
                  </Text>
                )}
              </View>
            )}

            {/* Details */}
            <Detail label="Transaction" value={data?.transactionLabel ?? "—"} />
            <Detail label="Student" value={data?.studentName ?? "—"} />
            {formatAmount(data?.amount) && (
              <Detail label="Amount" value={formatAmount(data?.amount) ?? ""} />
            )}
            {data?.createdAt && (
              <Detail
                label="Submitted"
                value={new Date(data.createdAt).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
            )}

            {/* Notice */}
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
                Watch the screen for your number. We'll also notify you when
                it's your turn.
              </Text>
            </View>
          </ScrollView>

          {/* Confirm button */}
          <Pressable
            onPress={onConfirm}
            style={{
              marginHorizontal: 24,
              marginBottom: 24,
              marginTop: 4,
              paddingVertical: 15,
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
              Got it
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 9,
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
        style={{
          flex: 1,
          textAlign: "right",
          fontSize: 13,
          color: C.navy,
          fontWeight: "600",
        }}
      >
        {value}
      </Text>
    </View>
  );
}
