import { type PropsWithChildren, useState } from "react";

import { DragDropContext, Draggable, Droppable, type OnDragEndResponder } from "@hello-pangea/dnd";
import { ActionIcon, Group } from "@mantine/core";
import { IconCheck, IconPencil, IconTrash, IconX } from "@tabler/icons-react";
import cn from "clsx";
import { useUnit } from "effector-react";

import { Button } from "../button";
import { customScrollStyles } from "../custom-scroll-styles";
import { Textarea } from "../textarea";
import styles from "./kanban.module.css";
import { $board, type KanbanBoard, type KanbanCard, type KanbanList, boardUpdate, cardCreateClicked } from "./model";

export function KanbanBoard() {
  const [board, setBoard] = useUnit([$board, boardUpdate]);

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

  function onColumnUpdate(updatedList: KanbanList) {
    const updatedBoard = board.map((column) => (column.id === updatedList.id ? updatedList : column));
    setBoard(updatedBoard);
  }

  return (
    <section className={cn(styles.section)}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>Sprint #1</h1>
      </header>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={cn(styles.board, customScrollStyles)}>
          {board.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              cards={column.cards}
              onUpdate={onColumnUpdate}
            >
              <KanbanCreateCard columnId={column.id} />
            </KanbanColumn>
          ))}
        </div>
      </DragDropContext>
    </section>
  );
}

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

const KanbanColumn = ({
  id,
  title,
  cards,
  children,
  onUpdate,
}: PropsWithChildren & {
  id: string;
  title: string;
  cards: KanbanCard[];
  onUpdate: (updatedList: KanbanList) => void;
}) => {
  function onCardEdit(updatedCard: KanbanCard) {
    const updatedCards = cards.map((card) => (card.id === updatedCard.id ? updatedCard : card));
    onUpdate({ id, title, cards: updatedCards });
  }

  function onCardDelete(cardId: string) {
    const updatedCards = cards.filter((card) => card.id !== cardId);
    onUpdate({ id, title, cards: updatedCards });
  }

  return (
    <Droppable key={id} droppableId={id}>
      {(provided) => (
        <div ref={provided.innerRef} className={styles.column} {...provided.droppableProps}>
          <p className={styles.columnTitle}>{title}</p>
          <div className={styles.list}>
            {cards.map(({ id, title }, index) => (
              <KanbanCard
                key={id}
                id={id}
                index={index}
                title={title}
                onEdit={onCardEdit}
                onDelete={() => onCardDelete(id)}
              />
            ))}
            {provided.placeholder}
            {children}
          </div>
        </div>
      )}
    </Droppable>
  );
};

const KanbanCard = ({
  id,
  index,
  title,
  onEdit,
  onDelete,
}: {
  id: string;
  index: number;
  title: string;
  onEdit: (card: KanbanCard) => void;
  onDelete: () => void;
}) => {
  const [editTitle, setEditTitle] = useState(title);
  const [editMode, setEditMode] = useState(false);

  function onReset() {
    setEditTitle(title);
    setEditMode(false);
  }

  function onEditFinished() {
    onEdit({ id, title: editTitle });
    onReset();
  }

  if (editMode) {
    return (
      <div className={styles.item}>
        <Textarea variant="md" value={editTitle} onValue={setEditTitle} />
        <Group>
          <ActionIcon onClick={onEditFinished}>
            <IconCheck size={14} />
          </ActionIcon>
          <ActionIcon onClick={onReset}>
            <IconX size={14} />
          </ActionIcon>
        </Group>
      </div>
    );
  }

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
          <Group>
            <ActionIcon onClick={() => setEditMode(true)}>
              <IconPencil size={14} />
            </ActionIcon>
            <ActionIcon onClick={() => onDelete()}>
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
        </div>
      )}
    </Draggable>
  );
};

const KanbanCreateCard = ({ columnId }: { columnId: string }) => {
  const [title, setTitle] = useState("");
  const [onCreateCard] = useUnit([cardCreateClicked]);

  function onReset() {
    setTitle("");
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    onCreateCard({ card: { title }, columnId });
    onReset();
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <Textarea variant="md" value={title} onValue={setTitle} placeholder="Start making new card here" />
      <Button type="submit">Add card</Button>
    </form>
  );
};
