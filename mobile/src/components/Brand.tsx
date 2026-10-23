import { Text, View } from "react-native";
import BrandMark from "../../assets/illustrations/brand-mark.svg";

export function Brand() {
  return (
    <View className="flex-row items-center" accessibilityLabel="MiniLedger">
      <BrandMark width={31} height={31} style={{ marginRight: 7 }} />
      <Text className="text-[22px] font-extrabold tracking-tight text-ink">
        MiniLedger
      </Text>
      <Text className="text-[24px] font-extrabold text-coral">.</Text>
    </View>
  );
}
