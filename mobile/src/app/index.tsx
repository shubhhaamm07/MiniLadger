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
import { requestOtp, verifyOtp } from "../lib/api";

export default function LoginScreen() {
  const { token, signIn } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) router.replace("/dashboard");
  }, [token]);

  async function submit() {
    const cleanPhone = phone.replace(/[\s()-]/g, "");
    setError("");
    if (step === "phone" && !/^\+?[1-9]\d{9,14}$/.test(cleanPhone)) {
      setError(
        "Enter a valid phone number with country code, for example +919876543210.",
      );
      return;
    }
    if (step === "otp" && !/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit code shown in your backend terminal.");
      return;
    }
    setBusy(true);
    try {
      if (step === "phone") {
        await requestOtp(cleanPhone);
        setPhone(cleanPhone);
        setStep("otp");
      } else {
        const result = await verifyOtp(cleanPhone, otp.trim());
        signIn(result.token);
        router.replace("/dashboard");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (token) return null;

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
          <View className="mx-auto w-full max-w-xl flex-1 px-6 pb-10 pt-8">
            <View className="flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-coral">
                <Text className="text-xl font-black text-white">m.</Text>
              </View>
              <Text className="ml-3 text-xl font-black tracking-tight text-ink">
                MiniLedger
              </Text>
            </View>
            <View className="mt-12 overflow-hidden rounded-[32px] bg-ink px-7 pb-9 pt-8">
              <Text className="text-xs font-bold uppercase tracking-[3px] text-coral">
                MONEY, MADE SIMPLE
              </Text>
              <Text className="mt-5 text-4xl font-black leading-tight text-white">
                Keep your loans in good company.
              </Text>
              <Text className="mt-4 text-base leading-6 text-[#D8D0CB]">
                Remember what you lent, when it is due, and what has come back.
              </Text>
              <View className="mt-8 h-2 w-32 rounded-full bg-coral" />
            </View>
            <Text className="mt-10 text-3xl font-black text-ink">
              {step === "phone" ? "Welcome back" : "Check your code"}
            </Text>
            <Text className="mt-2 text-base leading-6 text-muted">
              {step === "phone"
                ? "Enter your phone number to open your ledger."
                : "For this demo, the code is printed in the backend terminal."}
            </Text>
            <Text className="mb-2 mt-7 text-sm font-bold text-ink">
              Phone number
            </Text>
            <TextInput
              className="rounded-2xl border border-[#E4DDD7] bg-white px-5 py-4 text-base text-ink"
              placeholder="+919876543210"
              placeholderTextColor="#9B928C"
              keyboardType="phone-pad"
              autoComplete="tel"
              value={phone}
              onChangeText={setPhone}
              editable={!busy && step === "phone"}
            />
            {step === "otp" && (
              <>
                <Text className="mb-2 mt-5 text-sm font-bold text-ink">
                  6-digit code
                </Text>
                <TextInput
                  className="rounded-2xl border border-[#E4DDD7] bg-white px-5 py-4 text-base tracking-[4px] text-ink"
                  placeholder="000000"
                  placeholderTextColor="#9B928C"
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                  editable={!busy}
                />
              </>
            )}
            {error ? (
              <Text className="mt-4 text-sm text-[#BB3E3A]">{error}</Text>
            ) : null}
            <TouchableOpacity
              className="mt-7 min-h-14 flex-row items-center justify-center rounded-full bg-coral px-6"
              onPress={() => void submit()}
              disabled={busy}
              accessibilityRole="button"
            >
              {busy ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-bold text-white">
                  {step === "phone" ? "Send demo code" : "Open my ledger"}
                </Text>
              )}
            </TouchableOpacity>
            {step === "otp" && (
              <TouchableOpacity
                className="mt-5 items-center"
                onPress={() => {
                  setStep("phone");
                  setOtp("");
                  setError("");
                }}
                disabled={busy}
                accessibilityRole="button"
              >
                <Text className="font-semibold text-muted">
                  Change phone number
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
