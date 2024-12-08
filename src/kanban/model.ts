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
export const cardCreateClicked = createEvent<{ card: KanbanCard; columnId: string }>();
export const $board = createStore<KanbanBoard>(INITIAL_BOARD);

$board.on(boardUpdate, (_, board) => board);

$board.on(cardCreateClicked, (board, { card, columnId }) => {
  const updatedBoard = board.map((column) => {
    if (column.id === columnId) {
      return { ...column, cards: [...column.cards, card] };
    }

    return column;
  });

  return updatedBoard;
});
