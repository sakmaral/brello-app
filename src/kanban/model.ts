import { createEvent, createStore } from "effector";

export type KanbanBoard = KanbanList[];

export type KanbanList = {
  id: string;
  title: string;
  cards: KanbanCard[];
};

export type KanbanCard = {
  id: string;
  title: string;
};

export type KanbanCardForm = Pick<KanbanCard, "title">;

const INITIAL_BOARD: KanbanBoard = [
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

export const boardUpdate = createEvent<KanbanBoard>();
export const cardCreateClicked = createEvent<{ card: KanbanCardForm; columnId: string }>();
export const cardEditClicked = createEvent<{ card: KanbanCardForm; columnId: string; cardId: string }>();
export const cardDeleteClicked = createEvent<{ columnId: string; cardId: string }>();

export const $board = createStore<KanbanBoard>(INITIAL_BOARD);

// $board.on(boardUpdate, (_, board) => board);

$board.on(cardCreateClicked, (board, { card, columnId }) => {
  const updatedBoard = board.map((column) => {
    if (column.id === columnId) {
      const newCard = { ...card, id: crypto.randomUUID() };
      return { ...column, cards: [...column.cards, newCard] };
    }

    return column;
  });

  return updatedBoard;
});

$board.on(cardEditClicked, (board, { card, columnId, cardId }) => {
  const updatedBoard = board.map((column) => {
    if (column.id === columnId) {
      const updatedCards = column.cards.map((existingCard) =>
        existingCard.id === cardId ? { ...existingCard, ...card } : existingCard,
      );
      return { ...column, cards: updatedCards };
    }

    return column;
  });

  return updatedBoard;
});

$board.on(cardDeleteClicked, (board, { columnId, cardId }) => {
  const updatedBoard = board.map((column) => {
    if (column.id === columnId) {
      const updatedCards = column.cards.filter((card) => card.id !== cardId);
      return { ...column, cards: updatedCards };
    }

    return column;
  });

  return updatedBoard;
});

// debug($board, cardEditClicked);
