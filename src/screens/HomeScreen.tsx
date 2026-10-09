// screens/HomeScreen.tsx

import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { C, SERIF } from "@/lib/theme";

const DEPARTMENTS = [
  {
    key: "cashier",
    icon: "payments" as const,
    title: "Cashier",
    subtitle: "Tuition, fees & payments",
    action: "Get a queue number",
    examples: ["Tuition Payment", "Miscellaneous Fee", "Assessment"],
  },
  {
    key: "dean",
    icon: "school" as const,
    title: "Dean's Office",
    subtitle: "Academic concerns & advisory",
    action: "Get a queue number",
    examples: ["Grade Appeal", "Academic Advisory", "Academic Concern"],
  },
  {
    key: "registrar",
    icon: "description" as const,
    title: "Registrar",
    subtitle: "Document requests",
    action: "Request a document",
    examples: ["Good Moral", "Transcript of Records", "Diploma"],
  },
];

export default function HomeScreen() {
  const router = useRouter();

  const handleResetTerms = async () => {
    await AsyncStorage.clear();
    router.replace("/get-started");
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Services ─────────────────────────────────────────── */}
      <Text
        className="text-[11px] font-bold uppercase tracking-[2px] mb-3"
        style={{ color: C.navy }}
      >
        Choose a Service
      </Text>

      {DEPARTMENTS.map((d, i) => (
        <Animated.View
          key={d.key}
          entering={FadeInDown.delay(i * 90).duration(400)}
          className="mb-3.5"
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              // Registrar has its own dedicated screen, everything else
              // goes through the generic request flow.
              if (d.key === "registrar") {
                router.push("/document-request");
              } else {
                router.push({
                  pathname: "/request/[department]",
                  params: { department: d.key },
                });
              }
            }}
            className="rounded-[22px] border p-[18px]"
            style={{
              backgroundColor: C.tint,
              borderColor: C.border,
            }}
          >
            <View className="flex-row items-center">
              <View
                className="w-12 h-12 rounded-full bg-white items-center justify-center border-[1.5px]"
                style={{ borderColor: C.navy }}
              >
                <MaterialIcons name={d.icon} size={23} color={C.navy} />
              </View>
              <View className="flex-1 ml-3.5">
                <Text
                  className="text-[17px]"
                  style={{
                    color: C.navy,
                    fontFamily: SERIF,
                    fontWeight: "700",
                  }}
                >
                  {d.title}
                </Text>
                <Text className="text-xs mt-0.5" style={{ color: C.muted }}>
                  {d.subtitle}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={26} color={C.navy} />
            </View>

            <View className="flex-row flex-wrap mt-3.5">
              {d.examples.map((e) => (
                <View
                  key={e}
                  className="bg-white border rounded-full px-2.5 py-1 mr-1.5 mb-1.5"
                  style={{ borderColor: C.border }}
                >
                  <Text className="text-[11px]" style={{ color: C.navySoft }}>
                    {e}
                  </Text>
                </View>
              ))}
            </View>

            <Text
              className="text-xs font-bold mt-1.5"
              style={{ color: C.navy }}
            >
              {d.action}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ))}

      {__DEV__ && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleResetTerms}
          className="self-center mt-2 px-[18px] py-2.5 rounded-xl border"
          style={{
            backgroundColor: C.dangerBg,
            borderColor: C.dangerBorder,
          }}
        >
          <Text className="font-semibold text-xs" style={{ color: C.danger }}>
            Reset terms (dev)
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
