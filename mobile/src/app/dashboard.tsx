import { router, useLocalSearchParams } from "expo-router";
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
import CoinCheck from "../../assets/illustrations/coin-check.svg";
import LedgerEmpty from "../../assets/illustrations/ledger-empty.svg";
import { Brand } from "../components/Brand";
import { useAuth } from "../context/AuthContext";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { getLoans, getSummary, markLoanRepaid } from "../lib/api";
import { formatDate, formatMoney, isOverdue } from "../lib/format";
import type { Loan, Summary } from "../lib/types";

type Filter = "All" | "Pending" | "Overdue" | "Repaid";
const filters: Filter[] = ["All", "Pending", "Overdue", "Repaid"];
const emptySummary: Summary = {
  totalLentPaise: 0,
  totalRepaidPaise: 0,
  overduePaise: 0,
};

function loanStatus(loan: Loan): Exclude<Filter, "All"> {
  if (loan.repaidAt) return "Repaid";
  return isOverdue(loan.dueDate, loan.repaidAt) ? "Overdue" : "Pending";
}

export default function DashboardScreen() {
  const { token, signOut } = useAuth();
  const { isWide, isNarrow, horizontalPadding } = useResponsiveLayout();
  const { added } = useLocalSearchParams<{ added?: string }>();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [filter, setFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [repayingId, setRepayingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    added === "1" ? "Loan added to your ledger." : "",
  );

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
    setSuccess("");
    try {
      await markLoanRepaid(token, loanId);
      await load();
      setSuccess("Loan marked as repaid.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update this loan.",
      );
    } finally {
      setRepayingId(null);
    }
  }

  if (!token) return null;

  const stillToReceive = Math.max(
    0,
    summary.totalLentPaise - summary.totalRepaidPaise,
  );
  const visibleLoans = loans.filter(
    (loan) => filter === "All" || loanStatus(loan) === filter,
  );

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
        <View
          className="mx-auto w-full"
          style={{
            maxWidth: 1100,
            paddingHorizontal: horizontalPadding,
            paddingTop: 22,
            paddingBottom: 48,
          }}
        >
          <View className="flex-row items-center justify-between">
            <Brand />
            <TouchableOpacity
              className="min-h-11 justify-center px-2"
              onPress={() => {
                signOut();
                router.replace("/");
              }}
              accessibilityRole="button"
            >
              <Text className="text-[13px] font-semibold text-muted">
                Log out
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: isWide ? 50 : 30 }}>
            <Text className="text-[11px] font-bold uppercase tracking-[2px] text-coral">
              YOUR PRIVATE LEDGER
            </Text>
            <Text className="mt-2 text-[32px] font-bold tracking-tight text-ink">
              Money, made clear.
            </Text>
            <Text className="mt-1 text-[14px] leading-5 text-muted">
              See what you lent and what has come back.
            </Text>
          </View>

          {success ? (
            <View className="mt-5 flex-row items-center justify-between rounded-2xl bg-[#E7F3E9] px-4 py-3">
              <Text className="flex-1 text-[13px] font-semibold text-[#27683F]">
                {success}
              </Text>
              <TouchableOpacity
                className="min-h-11 min-w-11 items-center justify-center"
                onPress={() => setSuccess("")}
                accessibilityLabel="Dismiss success message"
                accessibilityRole="button"
              >
                <Text className="text-[20px] text-[#27683F]">×</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {error ? (
            <View className="mt-5 rounded-2xl bg-[#FBE8E5] px-4 py-3">
              <Text className="text-[13px] text-[#A3322D]">{error}</Text>
              <TouchableOpacity
                className="min-h-11 justify-center"
                onPress={() => void load()}
                accessibilityRole="button"
              >
                <Text className="font-semibold text-[#A3322D]">Try again</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View
            style={{
              flexDirection: isWide ? "row" : "column",
              alignItems: "flex-start",
              gap: isWide ? 28 : 32,
              marginTop: 28,
            }}
          >
            <View
              className="w-full rounded-[28px] bg-ink"
              style={{
                padding: isNarrow ? 20 : 24,
                width: isWide ? 360 : "100%",
              }}
            >
              <CoinCheck
                width={50}
                height={50}
                style={{ position: "absolute", right: 16, top: 12 }}
              />
              <Text className="text-[11px] font-bold uppercase tracking-[2px] text-[#E8A29E]">
                STILL TO RECEIVE
              </Text>
              <Text
                className="mt-2 font-bold tracking-tight text-white"
                style={{
                  fontSize: isNarrow ? 32 : 38,
                  lineHeight: isNarrow ? 38 : 44,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {loading ? "—" : formatMoney(stillToReceive)}
              </Text>
              <Text className="mt-1 text-[13px] text-[#CFC3BC]">
                Money your friends have yet to repay.
              </Text>

              <View className="mt-6 flex-row border-t border-[#514843] pt-5">
                <View className="flex-1 pr-3">
                  <Text className="text-[12px] text-[#CFC3BC]">Total lent</Text>
                  <Text
                    className="mt-1 text-[17px] font-semibold text-white"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatMoney(summary.totalLentPaise)}
                  </Text>
                </View>
                <View className="flex-1 border-l border-[#514843] pl-4">
                  <Text className="text-[12px] text-[#CFC3BC]">Repaid</Text>
                  <Text
                    className="mt-1 text-[17px] font-semibold text-white"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatMoney(summary.totalRepaidPaise)}
                  </Text>
                </View>
              </View>
              <View className="mt-5 flex-row items-center justify-between rounded-2xl bg-[#382F2B] px-4 py-3">
                <Text className="text-[13px] text-[#E0D5CE]">Overdue</Text>
                <Text
                  className="text-[15px] font-semibold text-[#FFB2AA]"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatMoney(summary.overduePaise)}
                </Text>
              </View>
            </View>

            <View
              style={{
                flex: isWide ? 1 : undefined,
                width: isWide ? undefined : "100%",
              }}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-[24px] font-bold tracking-tight text-ink">
                    Entries
                  </Text>
                  <Text className="mt-1 text-[13px] text-muted">
                    {loans.length} {loans.length === 1 ? "loan" : "loans"}{" "}
                    recorded
                  </Text>
                </View>
                <TouchableOpacity
                  className="min-h-[46px] items-center justify-center rounded-full bg-coral px-5"
                  onPress={() => router.push("/add")}
                  accessibilityRole="button"
                >
                  <Text className="text-[14px] font-bold text-white">
                    Add loan
                  </Text>
                </TouchableOpacity>
              </View>

              {loans.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mt-5"
                  contentContainerStyle={{ gap: 8, paddingRight: 8 }}
                >
                  {filters.map((option) => (
                    <TouchableOpacity
                      key={option}
                      className={
                        "min-h-11 items-center justify-center rounded-full px-4 " +
                        (filter === option
                          ? "bg-ink"
                          : "border border-[#E4DAD2] bg-white")
                      }
                      onPress={() => setFilter(option)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: filter === option }}
                    >
                      <Text
                        className={
                          "text-[13px] font-semibold " +
                          (filter === option ? "text-white" : "text-muted")
                        }
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {loading ? (
                <ActivityIndicator className="mt-10" color="#E96F6B" />
              ) : loans.length === 0 ? (
                <View className="mt-5 rounded-[24px] border border-[#E9E0D9] bg-white p-6">
                  <View
                    className="items-center"
                    accessibilityLabel="An empty ledger ready for your first loan"
                  >
                    <LedgerEmpty width={168} height={122} />
                  </View>
                  <Text className="text-[11px] font-bold uppercase tracking-[2px] text-coral">
                    A FRESH START
                  </Text>
                  <Text className="mt-3 text-[21px] font-semibold text-ink">
                    No loans to remember yet.
                  </Text>
                  <Text className="mt-2 text-[14px] leading-5 text-muted">
                    Add your first entry and we will keep the details together.
                  </Text>
                </View>
              ) : visibleLoans.length === 0 ? (
                <View className="mt-5 rounded-[24px] bg-white p-6">
                  <Text className="text-[15px] text-muted">
                    No {filter.toLowerCase()} entries right now.
                  </Text>
                </View>
              ) : (
                visibleLoans.map((loan) => {
                  const status = loanStatus(loan);
                  const overdue = status === "Overdue";
                  return (
                    <View
                      key={loan.id}
                      className={
                        "mt-4 rounded-[24px] border bg-white p-[18px] " +
                        (overdue ? "border-[#E9A39D]" : "border-[#E9E0D9]")
                      }
                    >
                      <View className="flex-row items-start">
                        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#F4E8E2]">
                          <Text className="text-[16px] font-bold text-[#8E514D]">
                            {loan.friendName.slice(0, 1).toUpperCase()}
                          </Text>
                        </View>
                        <View className="ml-3 flex-1">
                          <Text
                            className="text-[16px] font-semibold text-ink"
                            numberOfLines={1}
                          >
                            {loan.friendName}
                          </Text>
                          <Text
                            className={
                              "mt-1 text-[12px] " +
                              (overdue ? "text-[#A3322D]" : "text-muted")
                            }
                          >
                            Due {formatDate(loan.dueDate)}
                          </Text>
                        </View>
                        {!isNarrow && (
                          <Text
                            className="ml-2 text-[17px] font-semibold text-ink"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                          >
                            {formatMoney(loan.amountPaise)}
                          </Text>
                        )}
                      </View>
                      {isNarrow && (
                        <Text className="mt-3 text-[18px] font-semibold text-ink">
                          {formatMoney(loan.amountPaise)}
                        </Text>
                      )}
                      <View className="mt-4 flex-row items-center justify-between border-t border-[#F0E9E3] pt-3">
                        <Text
                          className={
                            "overflow-hidden rounded-full px-3 py-1 text-[12px] font-semibold " +
                            (status === "Repaid"
                              ? "bg-[#E7F3E9] text-[#27683F]"
                              : overdue
                                ? "bg-[#FBE8E5] text-[#A3322D]"
                                : "bg-[#F4F0EC] text-muted")
                          }
                        >
                          {status}
                        </Text>
                        {status !== "Repaid" && (
                          <TouchableOpacity
                            className="min-h-11 items-center justify-center rounded-full border border-[#E6C1BD] px-4"
                            onPress={() => void repay(loan.id)}
                            disabled={repayingId === loan.id}
                            accessibilityRole="button"
                          >
                            <Text className="text-[12px] font-semibold text-[#A3322D]">
                              {repayingId === loan.id
                                ? "Saving..."
                                : "Mark repaid"}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
