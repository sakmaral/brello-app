import { useState } from "react";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
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

// type KanbanBoard = KanbanList[];

type KanbanList = {
  id: string;
  title: string;
  cards: KanbanCard[];
};

type KanbanCard = {
  id: string;
  title: string;
};

const INITIAL_BOARD: KanbanList[] = [
  {
    id: crypto.randomUUID(),
    title: "To Do",
    cards: [
      { id: crypto.randomUUID(), title: "Setup the Workplace" },
      { id: crypto.randomUUID(), title: "Review opened issues" },
    ],
  },
  {
    id: crypto.randomUUID(),
    title: "In Progress",
    cards: [{ id: crypto.randomUUID(), title: "Implement Kanban feature" }],
  },
  {
    id: crypto.randomUUID(),
    title: "Done",
    cards: [{ id: crypto.randomUUID(), title: "Initialized project" }],
  },
];
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

const Header = () => {
  return (
    <header className={styles.header}>
      <nav className={cn(containerStyles, styles.nav)}>
        <Logo />
        <img className={styles.avatar} src={user.image} alt={user.name} />
      </nav>
    </header>
  );
};

const Board = () => {
  const [board] = useState(INITIAL_BOARD);

  return (
    <section className={cn(containerStyles, styles.section)}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>Sprint #1</h1>
      </header>
      <DragDropContext onDragEnd={() => {}}>
        <div className={cn(styles.board, customScrollStyles)}>
          {board.map((column) => (
            <KanbanColumn key={column.id} id={column.id} title={column.title} cards={column.cards} />
          ))}
        </div>
      </DragDropContext>
    </section>
  );
};

function KanbanColumn({ id, title, cards }: { id: string; title: string; cards: KanbanCard[] }) {
  return (
    <Droppable key={id} droppableId={id}>
      {(provided) => (
        <div ref={provided.innerRef} className={styles.column} {...provided.droppableProps}>
          <p className={styles.columnTitle}>{title}</p>
          <div className={styles.list}>
            {cards.map(({ id, title }, index) => (
              <KanbanCard key={id} id={id} index={index} title={title} />
            ))}
            {provided.placeholder}
            <form className={styles.form}>
              <Textarea onValue={() => {}} placeholder="Start making new card here" />
              <Button>Add card</Button>
            </form>
          </div>
        </div>
      )}
    </Droppable>
  );
}

const KanbanCard = ({ id, index, title }: { id: string; index: number; title: string }) => {
  return (
    <Draggable key={id} draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(styles.item, snapshot.isDragging ? styles.dragging : null)}
        >
          <p className={styles.itemText}>{title}</p>
        </div>
      )}
    </Draggable>
  );
};
