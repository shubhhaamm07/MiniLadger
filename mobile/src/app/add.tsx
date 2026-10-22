import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { addLoan } from "../lib/api";

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T12:00:00");
  return (
    !Number.isNaN(date.getTime()) &&
    [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-") === value
  );
}

export default function AddLoanScreen() {
  const { token } = useAuth();
  const [friendName, setFriendName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
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
      setError(
        "Enter an amount greater than zero, with up to 2 decimal places.",
      );
      return;
    }
    if (!isValidDate(dueDate)) {
      setError(
        "Enter a real due date in YYYY-MM-DD format, for example 2026-10-30.",
      );
      return;
    }
    if (!token) return;
    setBusy(true);
    try {
      await addLoan(token, { friendName: name, amount: rupees, dueDate });
      router.replace("/dashboard");
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
          <View className="mx-auto w-full max-w-xl flex-1 px-6 pb-10 pt-6">
            <TouchableOpacity
              onPress={() => router.replace("/dashboard")}
              accessibilityRole="button"
            >
              <Text className="font-bold text-muted">← Back to ledger</Text>
            </TouchableOpacity>
            <Text className="mt-12 text-xs font-bold uppercase tracking-[3px] text-coral">
              KEEP TRACK, STAY CLOSE
            </Text>
            <Text className="mt-3 text-4xl font-black text-ink">
              Add a loan
            </Text>
            <Text className="mt-3 text-base leading-6 text-muted">
              A few details now, one less thing to remember later.
            </Text>
            <View className="mt-9 rounded-[30px] bg-white p-6">
              <Text className="mb-2 text-sm font-bold text-ink">
                Friend&apos;s name
              </Text>
              <TextInput
                className="rounded-2xl border border-[#E4DDD7] bg-cream px-5 py-4 text-base text-ink"
                placeholder="e.g. Maya"
                placeholderTextColor="#9B928C"
                maxLength={100}
                value={friendName}
                onChangeText={setFriendName}
                editable={!busy}
              />
              <Text className="mb-2 mt-6 text-sm font-bold text-ink">
                Amount lent (₹)
              </Text>
              <TextInput
                className="rounded-2xl border border-[#E4DDD7] bg-cream px-5 py-4 text-base text-ink"
                placeholder="e.g. 1200"
                placeholderTextColor="#9B928C"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                editable={!busy}
              />
              <Text className="mb-2 mt-6 text-sm font-bold text-ink">
                Due date
              </Text>
              <TextInput
                className="rounded-2xl border border-[#E4DDD7] bg-cream px-5 py-4 text-base text-ink"
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9B928C"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                value={dueDate}
                onChangeText={setDueDate}
                editable={!busy}
              />
              <Text className="mt-2 text-xs text-muted">
                Example: 2026-10-30
              </Text>
              {error ? (
                <Text className="mt-5 text-sm text-[#BB3E3A]">{error}</Text>
              ) : null}
              <TouchableOpacity
                className="mt-8 min-h-14 items-center justify-center rounded-full bg-coral"
                onPress={() => void save()}
                disabled={busy}
                accessibilityRole="button"
              >
                {busy ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-base font-bold text-white">
                    Save loan
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
