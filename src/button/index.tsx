import { ElementProps, UnstyledButton, UnstyledButtonProps } from "@mantine/core";
import cn from "clsx";

import styles from "./styles.module.css";

interface Props extends UnstyledButtonProps, ElementProps<"button", keyof UnstyledButtonProps> {}

export function Button({ className, children, ...rest }: Props) {
  return (
    <UnstyledButton className={cn(styles.root, styles.sizeLg, styles.variantPrimary, className)} {...rest}>
      {children}
    </UnstyledButton>
  );
}
