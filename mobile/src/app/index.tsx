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
import { Brand } from "../components/Brand";
import { useAuth } from "../context/AuthContext";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { requestOtp, verifyOtp } from "../lib/api";

export default function LoginScreen() {
  const { token, signIn } = useAuth();
  const { isWide, isShort, horizontalPadding } = useResponsiveLayout();
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
      setError("Enter a valid phone number, for example +919876543210.");
      return;
    }
    if (step === "otp" && !/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit code from your backend terminal.");
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
          <View
            className="mx-auto w-full flex-1"
            style={{
              maxWidth: 1080,
              paddingHorizontal: horizontalPadding,
              paddingTop: isShort ? 16 : 26,
              paddingBottom: 28,
            }}
          >
            <Brand />

            <View
              className="flex-1"
              style={{
                flexDirection: isWide ? "row" : "column",
                alignItems: isWide ? "center" : "stretch",
                gap: isWide ? 28 : isShort ? 18 : 24,
                marginTop: isWide ? 42 : isShort ? 22 : 32,
              }}
            >
              <View
                className="justify-between rounded-[28px] bg-ink"
                style={{
                  flex: isWide ? 1 : undefined,
                  minHeight: isWide ? 430 : undefined,
                  padding: isWide ? 36 : isShort ? 22 : 26,
                }}
              >
                <View>
                  <Text className="text-[11px] font-bold uppercase tracking-[2px] text-coral">
                    A CLEARER WAY TO LEND
                  </Text>
                  <Text
                    className="mt-3 font-extrabold tracking-tight text-white"
                    style={{
                      fontSize: isWide ? 46 : isShort ? 29 : 34,
                      lineHeight: isWide ? 52 : isShort ? 34 : 40,
                    }}
                  >
                    Money lent.{"\n"}Peace kept.
                  </Text>
                  <Text className="mt-3 text-[15px] leading-[22px] text-[#D9D0CA]">
                    One simple place for every loan between friends.
                  </Text>
                </View>
                {isWide && (
                  <Text className="mt-10 text-sm text-[#BFB4AC]">
                    Know what is due, what is back, and what is still yours.
                  </Text>
                )}
              </View>

              <View
                className="rounded-[28px] border border-[#E9E0D9] bg-white"
                style={{
                  flex: isWide ? 1 : undefined,
                  padding: isWide ? 36 : 22,
                }}
              >
                <Text className="text-[11px] font-bold uppercase tracking-[2px] text-coral">
                  {step === "phone" ? "WELCOME" : "ONE MORE STEP"}
                </Text>
                <Text className="mt-2 text-[28px] font-bold tracking-tight text-ink">
                  {step === "phone" ? "Open your ledger" : "Enter your code"}
                </Text>
                <Text className="mt-1 text-[14px] leading-5 text-muted">
                  {step === "phone"
                    ? "Sign in with your phone number."
                    : "This demo prints the code in the backend terminal."}
                </Text>

                <Text className="mb-2 mt-6 text-[13px] font-semibold text-ink">
                  Phone number
                </Text>
                <TextInput
                  className="min-h-[52px] rounded-2xl border border-[#DDD4CC] bg-[#FCFAF8] px-4 text-[16px] text-ink"
                  placeholder="+919876543210"
                  placeholderTextColor="#837A73"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  value={phone}
                  onChangeText={setPhone}
                  editable={!busy && step === "phone"}
                  accessibilityLabel="Phone number"
                />

                {step === "otp" && (
                  <>
                    <Text className="mb-2 mt-5 text-[13px] font-semibold text-ink">
                      6-digit code
                    </Text>
                    <TextInput
                      className="min-h-[52px] rounded-2xl border border-[#DDD4CC] bg-[#FCFAF8] px-4 text-[17px] tracking-[4px] text-ink"
                      placeholder="000000"
                      placeholderTextColor="#837A73"
                      keyboardType="number-pad"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      onChangeText={setOtp}
                      editable={!busy}
                      accessibilityLabel="One-time code"
                    />
                  </>
                )}

                {error ? (
                  <Text className="mt-3 text-[13px] text-[#A3322D]">
                    {error}
                  </Text>
                ) : null}

                <TouchableOpacity
                  className="mt-5 min-h-[52px] items-center justify-center rounded-full bg-coral px-5"
                  onPress={() => void submit()}
                  disabled={busy}
                  accessibilityRole="button"
                >
                  {busy ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-[15px] font-bold text-white">
                      {step === "phone" ? "Get demo code" : "Continue"}
                    </Text>
                  )}
                </TouchableOpacity>

                {step === "otp" && (
                  <TouchableOpacity
                    className="min-h-11 items-center justify-center"
                    onPress={() => {
                      setStep("phone");
                      setOtp("");
                      setError("");
                    }}
                    disabled={busy}
                    accessibilityRole="button"
                  >
                    <Text className="text-[13px] font-semibold text-muted">
                      Change phone number
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Text className="mt-5 text-center text-[12px] text-muted">
              Your entries stay private to your account.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
