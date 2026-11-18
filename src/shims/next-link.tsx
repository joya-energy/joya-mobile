import { Link as ExpoLink, type Href } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text } from "react-native";

type Props = {
  href: string;
  children?: ReactNode;
  className?: string;
  replace?: boolean;
  asChild?: boolean;
};

/** Shim for `next/link`. */
export default function Link({ href, children, className, replace }: Props) {
  if (typeof children === "string") {
    return (
      <ExpoLink href={href as Href} replace={replace} asChild>
        <Pressable>
          <Text className={className}>{children}</Text>
        </Pressable>
      </ExpoLink>
    );
  }

  return (
    <ExpoLink href={href as Href} replace={replace} className={className}>
      {children}
    </ExpoLink>
  );
}
