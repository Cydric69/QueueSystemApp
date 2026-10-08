// src/components/TermsModal.tsx

import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const TERMS_SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: "By using the Binalbagan Catholic College Queueing System, you agree to abide by these Terms and Policies. If you do not agree, please do not use this application.",
  },
  {
    title: "2. Purpose of the System",
    body: "This app allows students and guardians to book queue tickets for the Dean and Cashier offices, and to request documents from the Registrar. It is intended to reduce physical waiting time on campus.",
  },
  {
    title: "3. Accurate Information",
    body: "You agree to provide truthful, accurate, and complete information about the student and requester. Providing false information may result in cancellation of your ticket and disciplinary action as per school policy.",
  },
  {
    title: "4. Proper Use",
    body: "You agree not to create fake tickets, spam the queue, or abuse the system. Repeated misuse may result in your access being revoked.",
  },
  {
    title: "5. Data Privacy (RA 10173)",
    body: "We collect only the information needed to process your request — student name, year level, campus, contact details, and requester information. Your data is stored securely and is used solely for queue management and document processing. It will not be shared with third parties without your consent, except as required by law.",
  },
  {
    title: "6. Notifications",
    body: "You may receive SMS or email notifications about your ticket status. By providing your contact information, you consent to receive these notifications.",
  },
  {
    title: "7. Ticket Validity",
    body: "Queue numbers are valid only on the day they are issued. Missed numbers may need to be re-issued. Registrar document requests must be claimed within 30 days of being marked ready.",
  },
  {
    title: "8. Changes to Terms",
    body: "The school may update these terms at any time. Continued use of the app after changes means you accept the updated terms.",
  },
  {
    title: "9. Contact",
    body: "For questions or concerns, please contact the Registrar or the IT Office of Binalbagan Catholic College.",
  },
];

export default function TermsModal({ visible, onAccept, onDecline }: Props) {
  const [agreed, setAgreed] = useState(false);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const padding = 24;
    const isEnd =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - padding;
    if (isEnd) setScrolledToEnd(true);
  };

  const close = () => {
    setAgreed(false);
    setScrolledToEnd(false);
    onDecline();
  };

  const accept = () => {
    setAgreed(false);
    setScrolledToEnd(false);
    onAccept();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={close}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <Pressable className="flex-1" onPress={close} />
        <SafeAreaView
          edges={["bottom"]}
          className="bg-card rounded-t-3xl max-h-[90%]"
        >
          {/* Header */}
          <View className="pt-2 px-5 pb-3">
            <View className="w-10 h-1 rounded-full bg-border self-center mb-3" />
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-primary-light items-center justify-center">
                <MaterialIcons name="privacy-tip" size={22} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-extrabold text-text">
                  Terms & Policies
                </Text>
                <Text className="text-xs text-text-secondary mt-0.5">
                  Please read before continuing
                </Text>
              </View>
              <TouchableOpacity
                onPress={close}
                className="w-9 h-9 rounded-full items-center justify-center"
              >
                <MaterialIcons name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Scrollable terms */}
          <ScrollView
            className="border-t border-border"
            contentContainerClassName="p-5 pb-3"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator
          >
            <Text className="text-sm text-text leading-[21px] mb-4">
              Welcome to the Binalbagan Catholic College Queueing System. By
              tapping "I Agree" below, you confirm that you have read,
              understood, and accepted the following terms.
            </Text>

            {TERMS_SECTIONS.map((s) => (
              <View key={s.title} className="mb-4">
                <Text className="text-sm font-bold text-text mb-1">
                  {s.title}
                </Text>
                <Text className="text-[13px] text-text-secondary leading-5">
                  {s.body}
                </Text>
              </View>
            ))}

            <Text className="text-[11px] text-text-secondary text-center italic mt-2">
              Last updated: {new Date().getFullYear()}
            </Text>
          </ScrollView>

          {!scrolledToEnd && (
            <View className="flex-row items-center justify-center gap-1 py-1.5 bg-primary-light">
              <MaterialIcons
                name="keyboard-arrow-down"
                size={16}
                color="#6B7280"
              />
              <Text className="text-[11px] text-primary-dark font-semibold">
                Scroll to read all terms
              </Text>
            </View>
          )}

          {/* Checkbox */}
          <TouchableOpacity
            className="flex-row items-center px-5 py-3.5 gap-3 border-t border-border"
            onPress={() => setAgreed((v) => !v)}
            activeOpacity={0.7}
          >
            <View
              className={`w-6 h-6 rounded-md border-2 items-center justify-center ${
                agreed ? "bg-primary border-primary" : "border-border"
              }`}
            >
              {agreed ? (
                <MaterialIcons name="check" size={16} color="#FFFFFF" />
              ) : null}
            </View>
            <Text className="flex-1 text-[13px] text-text">
              I have read and agree to the Terms & Policies
            </Text>
          </TouchableOpacity>

          {/* Actions */}
          <View className="flex-row gap-3 px-5 pb-4">
            <TouchableOpacity
              className="flex-1 py-3.5 rounded-xl items-center justify-center bg-card border-2 border-border"
              onPress={close}
              activeOpacity={0.8}
            >
              <Text className="text-text font-bold text-base">Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-3.5 rounded-xl items-center justify-center bg-primary ${
                !agreed ? "opacity-40" : ""
              }`}
              onPress={accept}
              disabled={!agreed}
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-base">I Agree</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
