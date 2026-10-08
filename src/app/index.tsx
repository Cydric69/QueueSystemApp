// app/index.tsx

import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { hasAcceptedTerms } from "@/lib/agreement";
import { C, SERIF } from "@/lib/theme";

import HomeScreen from "@/screens/HomeScreen";
import LiveQueueScreen from "@/screens/LiveQueueScreen";

const LOGO = require("../components/bcclogo.jpg");

type Tab = "home" | "queue";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>("home");
  const greeting = getGreeting();

  useEffect(() => {
    (async () => {
      const accepted = await hasAcceptedTerms();
      if (accepted) {
        setChecking(false);
      } else {
        router.replace("/get-started");
      }
    })();
  }, [router]);

  if (checking) {
    return <View className="flex-1 bg-white" />;
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* ── SHARED HEADER ────────────────────────────────────── */}
      <View
        className="px-6 pb-3 bg-white"
        style={{ paddingTop: insets.top + 20 }}
      >
        <View className="flex-row items-center">
          <View
            className="w-[52px] h-[52px] rounded-full border-2 items-center justify-center bg-white"
            style={{ borderColor: C.navy }}
          >
            <Image
              source={LOGO}
              className="w-[42px] h-[42px] rounded-full"
              resizeMode="contain"
            />
          </View>
          <View className="ml-3.5 flex-1">
            <Text
              className="text-[10px] font-semibold uppercase tracking-[2px]"
              style={{ color: C.navySoft }}
            >
              Binalbagan Catholic College
            </Text>
            <Text
              className="text-[20px] mt-0.5"
              style={{
                color: C.navy,
                fontFamily: SERIF,
                fontWeight: "700",
              }}
            >
              {tab === "home" ? greeting : "Live Queue"}
            </Text>
          </View>
        </View>

        {/* Tab switcher */}
        <View
          className="flex-row rounded-full p-1 mt-6 border"
          style={{ backgroundColor: C.tint, borderColor: C.border }}
        >
          <TabButton
            label="Home"
            icon="home"
            active={tab === "home"}
            onPress={() => setTab("home")}
          />
          <TabButton
            label="Live Queue"
            icon="sensors"
            active={tab === "queue"}
            onPress={() => setTab("queue")}
          />
        </View>
      </View>

      {/* ── SCREEN CONTENT ──────────────────────────────────── */}
      <View className="flex-1">
        {tab === "home" ? <HomeScreen /> : <LiveQueueScreen />}
      </View>
    </View>
  );
}

function TabButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-full"
      style={{ backgroundColor: active ? C.navy : "transparent" }}
    >
      <MaterialIcons
        name={icon}
        size={16}
        color={active ? C.white : C.navySoft}
      />
      <Text
        className="text-[13px] font-bold"
        style={{ color: active ? C.white : C.navySoft }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
