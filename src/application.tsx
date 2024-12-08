import styles from "./application.module.css";
import { Header } from "./header";
import { KanbanBoard } from "./kanban";

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
