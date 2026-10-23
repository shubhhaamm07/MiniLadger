import { useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  value: string;
  onSelect: (date: string) => void;
  onClose: () => void;
};

const weekdays = ["M", "T", "W", "T", "F", "S", "S"];

function dateText(year: number, month: number, day: number): string {
  return [
    year,
    String(month + 1).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

export function DatePickerModal({ value, onSelect, onClose }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const daySize = Math.min(44, (Math.min(width, 420) - 40) / 7);
  const [month, setMonth] = useState(() => {
    const initial = value ? new Date(value + "T12:00:00") : new Date();
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });

  const year = month.getFullYear();
  const monthNumber = month.getMonth();
  const firstWeekday = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthNumber + 1, 0).getDate();
  const cells = Array.from(
    { length: firstWeekday + daysInMonth },
    (_, index) => (index < firstWeekday ? 0 : index - firstWeekday + 1),
  );
  const today = new Date();
  const todayText = dateText(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  function moveMonth(by: number) {
    setMonth(new Date(year, monthNumber + by, 1));
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View
        className="flex-1 bg-black/50"
        style={{
          justifyContent: width >= 600 ? "center" : "flex-end",
          alignItems: "center",
        }}
      >
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
          accessibilityLabel="Close calendar"
        />
        <View
          className="w-full rounded-t-[28px] bg-white px-5 pt-5"
          style={{
            maxWidth: width >= 600 ? 420 : undefined,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderBottomLeftRadius: width >= 600 ? 28 : 0,
            borderBottomRightRadius: width >= 600 ? 28 : 0,
            paddingBottom: Math.max(insets.bottom, 18),
          }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-[20px] font-bold text-ink">
              Choose due date
            </Text>
            <TouchableOpacity
              className="min-h-11 justify-center px-2"
              onPress={onClose}
              accessibilityRole="button"
            >
              <Text className="text-[14px] font-semibold text-muted">Done</Text>
            </TouchableOpacity>
          </View>
          <View className="mt-4 flex-row items-center justify-between">
            <TouchableOpacity
              className="min-h-11 justify-center px-2"
              onPress={() => moveMonth(-1)}
              accessibilityLabel="Previous month"
              accessibilityRole="button"
            >
              <Text className="text-[14px] font-semibold text-coral">Prev</Text>
            </TouchableOpacity>
            <Text className="text-[16px] font-semibold text-ink">
              {month.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </Text>
            <TouchableOpacity
              className="min-h-11 justify-center px-2"
              onPress={() => moveMonth(1)}
              accessibilityLabel="Next month"
              accessibilityRole="button"
            >
              <Text className="text-[14px] font-semibold text-coral">Next</Text>
            </TouchableOpacity>
          </View>
          <View className="mt-2 flex-row">
            {weekdays.map((day, index) => (
              <View key={index} className="w-[14.2857%] items-center py-2">
                <Text className="text-[12px] font-semibold text-muted">
                  {day}
                </Text>
              </View>
            ))}
          </View>
          <View className="flex-row flex-wrap">
            {cells.map((day, index) => {
              if (day === 0)
                return <View key={index} className="w-[14.2857%] h-11" />;
              const option = dateText(year, monthNumber, day);
              const selected = option === value;
              return (
                <View
                  key={index}
                  className="w-[14.2857%] items-center justify-center py-1"
                >
                  <TouchableOpacity
                    className={
                      "items-center justify-center rounded-full " +
                      (selected
                        ? "bg-coral"
                        : option === todayText
                          ? "bg-[#F8E9E5]"
                          : "")
                    }
                    style={{ width: daySize, height: daySize }}
                    onPress={() => onSelect(option)}
                    accessibilityLabel={new Date(
                      option + "T12:00:00",
                    ).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      className={
                        "text-[14px] " +
                        (selected ? "font-bold text-white" : "text-ink")
                      }
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
