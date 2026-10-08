import "../../global.css";

import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ gestureEnabled: false }} />
      <Stack.Screen name="get-started" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
