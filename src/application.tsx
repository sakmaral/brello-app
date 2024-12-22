import { KanbanBoard } from "@/pages/kanban/view";

import "@mantine/core/styles/ActionIcon.css";
import "@mantine/core/styles/Loader.css";

import styles from "./application.module.css";
import { Header } from "./header";

export const Application = () => {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <KanbanBoard />
      </main>
    </>
  );
};
