// src/screens/GetStartedScreen.tsx

import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import TermsModal from "@/components/TermsModal";
import { acceptTerms, hasAcceptedTerms } from "@/lib/agreement";

const LOGO = require("../components/bcclogo.jpg");

const SERIF = Platform.select({ ios: "Georgia", android: "serif" });

// Palette — white dominant, navy accent only
const NAVY = "#0A2A5E";
const NAVY_SOFT = "#1E4A8A";
const WHITE = "#FFFFFF";
const NAVY_TINT = "#F4F7FB";
const BORDER = "#E3E9F2";
const MUTED = "#6B7A90";

const FEATURES = [
  {
    icon: "description" as const,
    title: "Request Documents",
    desc: "TOR, good moral, diploma, and other registrar documents.",
  },
  {
    icon: "confirmation-number" as const,
    title: "Book a Queue",
    desc: "Get a live number for the Dean or Cashier.",
  },
  {
    icon: "notifications-active" as const,
    title: "Track Status",
    desc: "Know when your ticket is serving or ready.",
  },
];

export default function GetStartedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showTerms, setShowTerms] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const accepted = await hasAcceptedTerms();
      if (accepted) {
        router.replace("/");
      } else {
        setChecking(false);
      }
    })();
  }, [router]);

  if (checking) {
    return <View style={{ flex: 1, backgroundColor: WHITE }} />;
  }

  const handleAccept = async () => {
    await acceptTerms();
    setShowTerms(false);
    router.replace("/");
  };

  return (
    <View style={{ flex: 1, backgroundColor: WHITE }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Scrollable content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: insets.top + 24,
          paddingBottom: 16,
        }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header — white background, navy text */}
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: NAVY_SOFT,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            Binalbagan Catholic College
          </Text>
          <Text
            style={{
              fontSize: 26,
              color: NAVY,
              marginTop: 8,
              textAlign: "center",
              fontFamily: SERIF,
              fontWeight: "700",
            }}
          >
            Student Queue Portal
          </Text>
          <View
            style={{
              width: 56,
              height: 3,
              borderRadius: 999,
              backgroundColor: NAVY,
              marginTop: 16,
            }}
          />
        </View>

        {/* Crest — navy ring on white */}
        <Animated.View
          entering={FadeIn.duration(500)}
          style={{ alignItems: "center", marginTop: 24 }}
        >
          <View
            style={{
              width: 112,
              height: 112,
              borderRadius: 56,
              backgroundColor: WHITE,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 4,
              borderColor: NAVY,
              shadowColor: NAVY,
              shadowOpacity: 0.15,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 6,
            }}
          >
            <Image
              source={LOGO}
              style={{ width: 88, height: 88, borderRadius: 44 }}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Tagline */}
        <View style={{ marginTop: 24 }}>
          <Text
            style={{
              fontSize: 20,
              color: NAVY,
              textAlign: "center",
              fontFamily: SERIF,
              fontWeight: "700",
            }}
          >
            Skip the line.
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: MUTED,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            Get your queue number in seconds.
          </Text>
        </View>

        {/* Services — light navy tint card */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(450)}
          style={{
            backgroundColor: NAVY_TINT,
            borderRadius: 24,
            marginTop: 24,
            paddingHorizontal: 20,
            borderWidth: 1,
            borderColor: BORDER,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: NAVY,
              letterSpacing: 2,
              textTransform: "uppercase",
              paddingTop: 16,
            }}
          >
            Our Services
          </Text>
          {FEATURES.map((f, i) => (
            <View
              key={f.title}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                paddingVertical: 16,
                borderBottomWidth: i < FEATURES.length - 1 ? 1 : 0,
                borderBottomColor: BORDER,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: WHITE,
                  borderWidth: 1.5,
                  borderColor: NAVY,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons name={f.icon} size={21} color={NAVY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: NAVY,
                  }}
                >
                  {f.title}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: MUTED,
                    marginTop: 2,
                    lineHeight: 17,
                  }}
                >
                  {f.desc}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Pinned footer — always visible */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 14,
          paddingBottom: insets.bottom + 16,
          backgroundColor: WHITE,
          borderTopWidth: 1,
          borderTopColor: BORDER,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setShowTerms(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: NAVY,
            paddingVertical: 16,
            borderRadius: 16,
            minHeight: 52,
          }}
        >
          <Text style={{ color: WHITE, fontWeight: "700", fontSize: 16 }}>
            Get Started
          </Text>
          <MaterialIcons
            name="arrow-forward"
            size={20}
            color={WHITE}
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 12,
            color: MUTED,
            textAlign: "center",
            lineHeight: 18,
            marginTop: 12,
          }}
        >
          By continuing you agree to our{" "}
          <Text
            style={{ color: NAVY, fontWeight: "700" }}
            onPress={() => setShowTerms(true)}
          >
            Terms & Policies
          </Text>
        </Text>
      </View>

      <TermsModal
        visible={showTerms}
        onAccept={handleAccept}
        onDecline={() => setShowTerms(false)}
      />
    </View>
  );
}
