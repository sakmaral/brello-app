import { PropsWithChildren, useState } from "react";

import { DragDropContext, Draggable, Droppable, OnDragEndResponder } from "@hello-pangea/dnd";
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

type KanbanBoard = KanbanList[];

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

const moveCard = (
  board: KanbanBoard,
  sourceColumnId: string,
  destinationColumnId: string,
  fromIndex: number,
  toIndex: number,
): KanbanBoard => {
  const sourceColumn = board.find((column) => column.id === sourceColumnId);
  const destinationColumn = board.find((column) => column.id === destinationColumnId);

  if (!sourceColumn || !destinationColumn) {
    return board;
  }
  const card = sourceColumn.cards[fromIndex];

  const updatedSourceColumn = { ...sourceColumn, cards: sourceColumn.cards.filter((_, index) => index !== fromIndex) };
  const updatedDestinationColumn = {
    ...destinationColumn,
    cards: [...destinationColumn.cards.slice(0, toIndex), { ...card }, ...destinationColumn.cards.slice(toIndex)],
  };

  return board.map((column) => {
    if (column.id === sourceColumnId) {
      return updatedSourceColumn;
    }

    if (column.id === destinationColumnId) {
      return updatedDestinationColumn;
    }

    return column;
  });
};

const listReorder = (list: KanbanList, startIndex: number, endIndex: number): KanbanList => {
  const cards = Array.from(list.cards);
  const [removed] = cards.splice(startIndex, 1);
  cards.splice(endIndex, 0, removed);

  return { ...list, cards };
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
  const [board, setBoard] = useState(INITIAL_BOARD);

  const onDragEnd: OnDragEndResponder = ({ source, destination }) => {
    if (!destination) {
      // Dropped outside of a column
      return;
    }

    const sourceId = source.droppableId;
    const destinationId = destination.droppableId;

    const insideTheSameColumn = sourceId === destinationId;
    if (insideTheSameColumn) {
      const column = board.find((column) => column.id === sourceId);
      if (column) {
        const reorderedList = listReorder(column, source.index, destination.index);
        const updatedBoard = board.map((item) => (item.id === sourceId ? reorderedList : item));
        setBoard(updatedBoard);
      }
    } else {
      const updatedBoard = moveCard(board, sourceId, destinationId, source.index, destination.index);
      setBoard(updatedBoard);
    }
  };

  const onCreateCard = (card: KanbanCard, columnId: string) => {
    const updatedBoard = board.map((column) => {
      if (column.id === columnId) {
        return { ...column, cards: [...column.cards, card] };
      }

      return column;
    });

    setBoard(updatedBoard);
  };

  return (
    <section className={cn(containerStyles, styles.section)}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>Sprint #1</h1>
      </header>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={cn(styles.board, customScrollStyles)}>
          {board.map((column) => (
            <KanbanColumn key={column.id} id={column.id} title={column.title} cards={column.cards}>
              <KanbanCreateCard onCreate={(card) => onCreateCard(card, column.id)} />
            </KanbanColumn>
          ))}
        </div>
      </DragDropContext>
    </section>
  );
};

const KanbanColumn = ({
  id,
  title,
  cards,
  children,
}: PropsWithChildren & { id: string; title: string; cards: KanbanCard[] }) => {
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
            {children}
          </div>
        </div>
      )}
    </Droppable>
  );
};

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

const KanbanCreateCard = ({ onCreate }: { onCreate: (card: KanbanCard) => void }) => {
  const [title, setTitle] = useState("");

  function onReset() {
    setTitle("");
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    onCreate({ id: crypto.randomUUID(), title });
    onReset();
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <Textarea variant="md" value={title} onValue={setTitle} placeholder="Start making new card here" />
      <Button type="submit">Add card</Button>
    </form>
  );
};
