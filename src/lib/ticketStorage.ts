import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "bcc.activeTicketId";

export const saveActiveTicket = (ticketId: string) =>
  AsyncStorage.setItem(KEY, ticketId);

export const getActiveTicket = () => AsyncStorage.getItem(KEY);

export const clearActiveTicket = () => AsyncStorage.removeItem(KEY);
