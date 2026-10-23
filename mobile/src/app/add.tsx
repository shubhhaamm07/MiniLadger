import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Brand } from "../components/Brand";
import { DatePickerModal } from "../components/DatePickerModal";
import { useAuth } from "../context/AuthContext";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { addLoan } from "../lib/api";
import { formatDate } from "../lib/format";

export default function AddLoanScreen() {
  const { token } = useAuth();
  const { isWide, horizontalPadding } = useResponsiveLayout();
  const [friendName, setFriendName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) router.replace("/");
  }, [token]);

  async function save() {
    const name = friendName.trim();
    const rupees = Number(amount);
    setError("");
    if (!name || name.length > 100) {
      setError("Enter your friend's name (up to 100 characters).");
      return;
    }
    if (
      !/^\d+(\.\d{1,2})?$/.test(amount) ||
      !Number.isFinite(rupees) ||
      rupees <= 0
    ) {
      setError("Enter an amount above zero, with up to 2 decimal places.");
      return;
    }
    if (!dueDate) {
      setError("Choose a due date from the calendar.");
      return;
    }
    if (!token) return;

    setBusy(true);
    try {
      await addLoan(token, { friendName: name, amount: rupees, dueDate });
      router.replace({ pathname: "/dashboard", params: { added: "1" } });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save your loan.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!token) return null;

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            className="mx-auto w-full flex-1"
            style={{
              maxWidth: 1060,
              paddingHorizontal: horizontalPadding,
              paddingTop: 22,
              paddingBottom: 36,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Brand />
              <TouchableOpacity
                className="min-h-11 justify-center px-2"
                onPress={() => router.replace("/dashboard")}
                accessibilityRole="button"
              >
                <Text className="text-[13px] font-semibold text-muted">
                  Back
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: isWide ? "row" : "column",
                gap: isWide ? 36 : 24,
                marginTop: isWide ? 50 : 30,
              }}
            >
              <View style={{ flex: isWide ? 1 : undefined }}>
                <Text className="text-[11px] font-bold uppercase tracking-[2px] text-coral">
                  A SMALL NOTE, WELL KEPT
                </Text>
                <Text className="mt-2 text-[32px] font-bold tracking-tight text-ink">
                  Add a loan
                </Text>
                <Text className="mt-2 text-[14px] leading-5 text-muted">
                  Record the essentials. We will keep them easy to find.
                </Text>
                {isWide && (
                  <View className="mt-8 rounded-[28px] bg-ink p-7">
                    <Text className="text-[18px] font-semibold leading-6 text-white">
                      A clearer picture of money between friends.
                    </Text>
                    <Text className="mt-3 text-[14px] leading-5 text-[#D9D0CA]">
                      Your entry will appear in the ledger, and we will
                      highlight it when the due date passes.
                    </Text>
                  </View>
                )}
              </View>

              <View
                className="rounded-[28px] border border-[#E9E0D9] bg-white"
                style={{
                  flex: isWide ? 1 : undefined,
                  padding: isWide ? 30 : 20,
                }}
              >
                <Text className="text-[20px] font-semibold text-ink">
                  Loan details
                </Text>
                <Text className="mt-1 text-[13px] text-muted">
                  Just three things to remember.
                </Text>

                <Text className="mb-2 mt-6 text-[13px] font-semibold text-ink">
                  Friend&apos;s name
                </Text>
                <TextInput
                  className="min-h-[52px] rounded-2xl border border-[#DDD4CC] bg-[#FCFAF8] px-4 text-[16px] text-ink"
                  placeholder="e.g. Maya"
                  placeholderTextColor="#837A73"
                  maxLength={100}
                  value={friendName}
                  onChangeText={setFriendName}
                  editable={!busy}
                  accessibilityLabel="Friend's name"
                />

                <Text className="mb-2 mt-5 text-[13px] font-semibold text-ink">
                  Amount lent
                </Text>
                <View className="min-h-[52px] flex-row items-center rounded-2xl border border-[#DDD4CC] bg-[#FCFAF8] px-4">
                  <Text className="mr-2 text-[17px] font-semibold text-muted">
                    ₹
                  </Text>
                  <TextInput
                    className="min-h-[50px] flex-1 text-[16px] text-ink"
                    placeholder="1200.00"
                    placeholderTextColor="#837A73"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    editable={!busy}
                    accessibilityLabel="Amount lent in rupees"
                  />
                </View>

                <Text className="mb-2 mt-5 text-[13px] font-semibold text-ink">
                  Due date
                </Text>
                <TouchableOpacity
                  className="min-h-[52px] flex-row items-center justify-between rounded-2xl border border-[#DDD4CC] bg-[#FCFAF8] px-4"
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowCalendar(true);
                  }}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel={
                    dueDate
                      ? "Due date " + formatDate(dueDate)
                      : "Choose a due date"
                  }
                >
                  <Text
                    className={
                      "text-[16px] " + (dueDate ? "text-ink" : "text-[#837A73]")
                    }
                  >
                    {dueDate ? formatDate(dueDate) : "Choose a date"}
                  </Text>
                  <Text className="text-[13px] font-semibold text-coral">
                    Calendar
                  </Text>
                </TouchableOpacity>

                {error ? (
                  <Text className="mt-4 text-[13px] text-[#A3322D]">
                    {error}
                  </Text>
                ) : null}

                <TouchableOpacity
                  className="mt-7 min-h-[52px] items-center justify-center rounded-full bg-coral"
                  onPress={() => void save()}
                  disabled={busy}
                  accessibilityRole="button"
                >
                  {busy ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-[15px] font-bold text-white">
                      Save loan
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {showCalendar && (
        <DatePickerModal
          value={dueDate}
          onClose={() => setShowCalendar(false)}
          onSelect={(date) => {
            setDueDate(date);
            setShowCalendar(false);
            setError("");
          }}
        />
      )}
    </SafeAreaView>
  );
}
