import { Image, type ImageProps } from "expo-image";
import { StyleSheet } from "react-native";

type Props = {
  src: string | number;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  style?: ImageProps["style"];
};

/** Shim for `next/image`. */
export default function NextImage({
  src,
  alt,
  width,
  height,
  className,
  fill,
  style,
}: Props) {
  return (
    <Image
      source={typeof src === "string" ? { uri: src } : src}
      accessibilityLabel={alt}
      className={className}
      style={[
        fill ? StyleSheet.absoluteFillObject : undefined,
        width || height ? { width, height } : undefined,
        style,
      ]}
      contentFit="cover"
    />
  );
}
