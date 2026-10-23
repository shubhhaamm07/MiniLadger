declare module "*.svg" {
  import type { FC } from "react";
  import type { SvgProps } from "react-native-svg";

  const Illustration: FC<SvgProps>;
  export default Illustration;
}
