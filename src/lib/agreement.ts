// src/lib/agreement.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "terms_accepted_v1";

export async function hasAcceptedTerms(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === "true";
  } catch {
    return false;
  }
}

export async function acceptTerms(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, "true");
  } catch {}
}

export async function resetTerms(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
