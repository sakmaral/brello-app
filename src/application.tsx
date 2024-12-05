import { useState } from "react";

import cn from "clsx";

import styles from "./application.module.css";
import { Button } from "./button";
import { containerStyles } from "./container";
import { customScrollStyles } from "./custom-scroll-styles";
import { Logo } from "./logo";
import { Textarea } from "./textarea";

const user = {
  name: "Jane Spoonfighter",
  email: "janspoon@fighter.dev",
  image: "https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-5.png",
};

export const Application = () => {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <Board />
      </main>
    </>
  );
};

function Header() {
  return (
    <header className={styles.header}>
      <nav className={cn(containerStyles, styles.nav)}>
        <Logo />
        <img className={styles.avatar} src={user.image} alt={user.name} />
      </nav>
    </header>
  );
}

function Board() {
  return (
    <section className={cn(containerStyles, styles.section)}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>Sprint #1</h1>
      </header>
      <div className={cn(styles.grid, customScrollStyles)}>
        <KanbanColumn
          title="To Do"
          issues={[
            { id: "a8d2c2b1-3d4b-4f19-b915-4530d8f693d4", text: "Set up project repository" },
            {
              id: "b7f9285d-c78a-4f25-9b60-7edbfcf06335",
              text: "Research best practices for Kanban board implementation",
            },
            { id: "d467f865-d378-4a6f-bd4a-611c5d1de939", text: "Create initial components for UI" },
            { id: "ae44a1cb-cb8b-4e5a-bcc8-4888c1822146", text: "Design logo and branding" },
            { id: "92f84ba6-f354-4d1b-8e23-dc75be0ffba3", text: "Write unit tests for core features" },
            { id: "98ff4789-e9ad-4d88-8259-24972c6f132e", text: "Prepare project documentation" },
            { id: "32f8b8ea-95de-4d1e-8ae6-517877db8f7b", text: "Plan webinar content for week 1" },
          ]}
        />
        <KanbanColumn
          title="In Progress"
          issues={[{ id: "c3d3a66f-6eb5-46ec-a07e-c8436886272f", text: "Develop Board component" }]}
        />
        <KanbanColumn
          title="Done"
          issues={[
            { id: "843a6832-f9f2-43b1-bd6f-ef27b87f1b64", text: "Install project dependencies" },
            { id: "fdd854a2-b31d-4ed5-b18d-2c44c0cfb444", text: "Set up ESLint and Prettier" },
            { id: "f2deaba9-7e52-442a-b764-219849af07e8", text: "Configure Webpack for project" },
            { id: "b90b7d41-1ba2-4b44-b7d9-9a2a8b237d4b", text: "Create responsive layout for Kanban board" },
            { id: "e823d3ac-bdfd-4410-b49f-41719734b7b8", text: "Implement user authentication" },
            { id: "620f509d-d192-45d1-9f43-2ed1c49f0c6f", text: "Deploy app on Vercel" },
            { id: "a1dbf9b4-2523-45b5-b8a3-1af00c7fbe6e", text: "Set up CI/CD pipeline" },
            { id: "7761eccc-765f-49a7-8474-46b0be8058d2", text: "Add basic styling for header" },
            { id: "b0b2c8e3-2299-4ef9-b7cb-88f28fc2f72b", text: "Integrate Telegram group for support" },
            { id: "d4d6adbc-7d4e-4d1d-b9b9-8be91b776cb2", text: "Fix bug with form submission" },
          ]}
        />
      </div>
    </section>
  );
}

interface Issue {
  id: string;
  text: string;
}

function KanbanColumn({ title, issues }: { title: string; issues: Issue[] }) {
  const [, setValue] = useState<string>("");

  return (
    <div className={styles.column}>
      <p className={styles.columnTitle}>{title}</p>
      <div className={styles.list}>
        {issues.map(({ id, text }) => (
          <KanbanCard key={id} text={text} />
        ))}
        <form className={styles.form}>
          <Textarea onValue={setValue} placeholder="Type some text here" />
          <Button>Add card</Button>
        </form>
      </div>
    </div>
  );
}

function KanbanCard({ text }: { text: string }) {
  return (
    <div className={styles.item}>
      <p className={styles.itemText}>{text}</p>
    </div>
  );
}
