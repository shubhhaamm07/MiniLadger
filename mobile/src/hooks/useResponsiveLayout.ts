import { useWindowDimensions } from "react-native";

export function useResponsiveLayout() {
  const { width, height, fontScale } = useWindowDimensions();

  return {
    isWide: width >= 820,
    isNarrow: width < 360,
    isShort: height < 720,
    horizontalPadding: width < 360 ? 16 : width < 600 ? 22 : 32,
    fontScale,
  };
}
