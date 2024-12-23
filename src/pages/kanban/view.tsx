import { type FC, type PropsWithChildren, useState } from "react";

import { Button } from "@/button";
import { customScrollStyles } from "@/custom-scroll-styles";
import { Textarea } from "@/textarea";
import { DragDropContext, Draggable, Droppable, type OnDragEndResponder } from "@hello-pangea/dnd";
import { ActionIcon, Group, Loader } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCheck, IconPencil, IconTrash, IconX } from "@tabler/icons-react";
import cn from "clsx";
import { useGate, useStoreMap, useUnit } from "effector-react";

import styles from "./kanban.module.css";
import {
  $board,
  $cardPendingMap,
  type KanbanCard,
  PageGate,
  cardCreateClicked,
  cardDeleteClicked,
  cardEditClicked,
  cardMoved,
} from "./model";

export function KanbanBoard() {
  const [board, cardMove] = useUnit([$board, cardMoved]);

  useGate(PageGate);

  const onDragEnd: OnDragEndResponder = ({ source, destination }) => {
    if (!destination) {
      // Dropped outside of a column
      return;
    }

    const sourceColumnId = source.droppableId;
    const destinationColumnId = destination.droppableId;
    const sourceIndex = source.index;
    const destinationIndex = destination.index;

    cardMove({ sourceColumnId, destinationColumnId, sourceIndex, destinationIndex });
  };

  return (
    <section className={cn(styles.section)}>
      <header className={styles.headerSection}>
        <h1 className={styles.title}>Sprint #1</h1>
      </header>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={cn(styles.board, customScrollStyles)}>
          {board.map((column) => (
            <KanbanColumn key={column.id} id={column.id} title={column.title} cards={column.cards}>
              <KanbanCreateCard columnId={column.id} />
            </KanbanColumn>
          ))}
        </div>
      </DragDropContext>
    </section>
  );
}

const KanbanColumn = ({
  id,
  title,
  cards,
  children,
}: PropsWithChildren & {
  id: string;
  title: string;
  cards: KanbanCard[];
}) => {
  return (
    <Droppable key={id} droppableId={id}>
      {(provided) => (
        <div ref={provided.innerRef} className={styles.column} {...provided.droppableProps}>
          <p className={styles.columnTitle}>{title}</p>
          <div className={styles.list}>
            {cards.map((card, index) => (
              <KanbanCard key={card.id} id={card.id} index={index} title={card.title} columnId={id} />
            ))}
            {provided.placeholder}
            {children}
          </div>
        </div>
      )}
    </Droppable>
  );
};

const KanbanCard = ({ id, index, title, columnId }: { id: string; index: number; title: string; columnId: string }) => {
  const onDelete = useUnit(cardDeleteClicked);

  const [editMode, editHandlers] = useDisclosure(false);

  const disabled = useStoreMap({
    store: $cardPendingMap,
    keys: [id],
    fn: (pendingMap) => pendingMap[id] ?? false,
  });

  if (editMode) {
    return <KanbanEditCard cardId={id} title={title} columnId={columnId} onFinished={editHandlers.close} />;
  }

  return (
    <Draggable key={id} draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(styles.item, disabled && styles.disabled, snapshot.isDragging ? styles.dragging : null)}
        >
          <p className={styles.itemText}>{title}</p>
          <Group hidden={!disabled}>
            <Loader size="sm" />
          </Group>
          <Group hidden={disabled}>
            <ActionIcon onClick={editHandlers.open}>
              <IconPencil size={14} />
            </ActionIcon>
            <ActionIcon onClick={() => onDelete({ cardId: id, columnId })}>
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
        </div>
      )}
    </Draggable>
  );
};

interface KanbanEditCardProps {
  cardId: string;
  title: string;
  columnId: string;
  onFinished: () => void;
}

const KanbanEditCard: FC<KanbanEditCardProps> = ({ title, cardId, columnId, onFinished }) => {
  const [editTitle, setEditTitle] = useState(title);

  const onEdit = useUnit(cardEditClicked);

  function onEditFinished() {
    onEdit({ cardId, card: { title: editTitle }, columnId });
    onFinished();
  }

  return (
    <div className={styles.item}>
      <Textarea variant="md" value={editTitle} onValue={setEditTitle} />
      <Group>
        <ActionIcon onClick={onEditFinished}>
          <IconCheck size={14} />
        </ActionIcon>
        <ActionIcon onClick={onFinished}>
          <IconX size={14} />
        </ActionIcon>
      </Group>
    </div>
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
