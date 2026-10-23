import { Text, View } from "react-native";

export function Brand() {
  return (
    <View className="flex-row items-baseline" accessibilityLabel="MiniLedger">
      <Text className="text-[22px] font-extrabold tracking-tight text-ink">
        MiniLedger
      </Text>
      <Text className="text-[24px] font-extrabold text-coral">.</Text>
    </View>
  );
}
