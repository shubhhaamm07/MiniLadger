import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { getLoans, getSummary, markLoanRepaid } from "../lib/api";
import { formatDate, formatMoney, isOverdue } from "../lib/format";
import type { Loan, Summary } from "../lib/types";

const emptySummary: Summary = {
  totalLentPaise: 0,
  totalRepaidPaise: 0,
  overduePaise: 0,
};

export default function DashboardScreen() {
  const { token, signOut } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [repayingId, setRepayingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [nextLoans, nextSummary] = await Promise.all([
        getLoans(token),
        getSummary(token),
      ]);
      setLoans(nextLoans);
      setSummary(nextSummary);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load your ledger.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      router.replace("/");
      return;
    }
    // The API responds asynchronously, then load updates the screen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load, token]);

  async function repay(loanId: number) {
    if (!token) return;
    setRepayingId(loanId);
    setError("");
    try {
      await markLoanRepaid(token, loanId);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not mark this entry repaid.",
      );
    } finally {
      setRepayingId(null);
    }
  }

  if (!token) return null;

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        <View className="mx-auto w-full max-w-2xl px-5 pb-12 pt-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-coral">
                <Text className="text-xl font-black text-white">m.</Text>
              </View>
              <Text className="ml-3 text-xl font-black text-ink">
                MiniLedger
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                signOut();
                router.replace("/");
              }}
              accessibilityRole="button"
            >
              <Text className="font-bold text-muted">Log out</Text>
            </TouchableOpacity>
          </View>
          <Text className="mt-10 text-xs font-bold uppercase tracking-[3px] text-coral">
            YOUR MONEY, AT A GLANCE
          </Text>
          <Text className="mt-2 text-4xl font-black leading-tight text-ink">
            Your ledger
          </Text>
          <Text className="mt-2 text-base text-muted">
            Every loan, all in one calm place.
          </Text>

          <View className="mt-8 overflow-hidden rounded-[30px] bg-ink px-6 pb-7 pt-6">
            <Text className="text-sm font-semibold text-[#D8D0CB]">
              Total lent
            </Text>
            <Text className="mt-2 text-4xl font-black text-white">
              {formatMoney(summary.totalLentPaise)}
            </Text>
            <View className="mt-7 flex-row border-t border-[#514946] pt-5">
              <View className="flex-1 pr-2">
                <Text className="text-sm text-[#D8D0CB]">Repaid</Text>
                <Text className="mt-2 text-xl font-bold text-white">
                  {formatMoney(summary.totalRepaidPaise)}
                </Text>
              </View>
              <View className="flex-1 border-l border-[#514946] pl-5">
                <Text className="text-sm text-[#D8D0CB]">Overdue</Text>
                <Text className="mt-2 text-xl font-bold text-coral">
                  {formatMoney(summary.overduePaise)}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-10 flex-row items-center justify-between">
            <Text className="text-2xl font-black text-ink">Entries</Text>
            <TouchableOpacity
              className="rounded-full bg-coral px-5 py-3"
              onPress={() => router.push("/add")}
              accessibilityRole="button"
            >
              <Text className="font-bold text-white">+ Add loan</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View className="mt-5 rounded-2xl bg-[#FDE9E7] p-4">
              <Text className="text-[#A83531]">{error}</Text>
              <TouchableOpacity
                onPress={() => void load()}
                accessibilityRole="button"
              >
                <Text className="mt-2 font-bold text-[#A83531]">Try again</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {loading ? (
            <ActivityIndicator className="mt-10" color="#E96F6B" />
          ) : loans.length === 0 ? (
            <View className="mt-5 rounded-[26px] border border-[#E6DED8] bg-white px-6 py-10">
              <Text className="text-2xl font-black text-ink">
                A fresh start.
              </Text>
              <Text className="mt-2 text-base leading-6 text-muted">
                Add your first loan and it will appear here.
              </Text>
            </View>
          ) : (
            loans.map((loan) => {
              const overdue = isOverdue(loan.dueDate, loan.repaidAt);
              const repaid = Boolean(loan.repaidAt);
              return (
                <View
                  key={loan.id}
                  className={
                    "mt-4 rounded-[26px] border p-5 " +
                    (overdue
                      ? "border-[#F2ABA7] bg-[#FFF0EE]"
                      : "border-[#E6DED8] bg-white")
                  }
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-lg font-black text-ink">
                        {loan.friendName}
                      </Text>
                      <Text className="mt-1 text-sm text-muted">
                        Due {formatDate(loan.dueDate)}
                      </Text>
                    </View>
                    <Text className="text-lg font-black text-ink">
                      {formatMoney(loan.amountPaise)}
                    </Text>
                  </View>
                  <View className="mt-5 flex-row items-center justify-between">
                    <Text
                      className={
                        "rounded-full px-3 py-1 text-xs font-bold " +
                        (repaid
                          ? "bg-[#E6F2E9] text-[#36794C]"
                          : overdue
                            ? "bg-[#F9D0CD] text-[#A83531]"
                            : "bg-cream text-muted")
                      }
                    >
                      {repaid ? "Repaid" : overdue ? "Overdue" : "Pending"}
                    </Text>
                    {!repaid && (
                      <TouchableOpacity
                        onPress={() => void repay(loan.id)}
                        disabled={repayingId === loan.id}
                        accessibilityRole="button"
                      >
                        <Text className="font-bold text-coral">
                          {repayingId === loan.id ? "Saving..." : "Mark repaid"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
