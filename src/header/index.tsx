import cn from "clsx";

import { containerStyles } from "../container";
import { Logo } from "../logo";
import styles from "./header.module.css";

const user = {
  name: "Jane Spoonfighter",
  email: "janspoon@fighter.dev",
  image: "https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-5.png",
};

export const Header = () => {
  return (
    <header className={styles.header}>
      <nav className={cn(containerStyles, styles.nav)}>
        <Logo />
        <img className={styles.avatar} src={user.image} alt={user.name} />
      </nav>
    </header>
  );
};
