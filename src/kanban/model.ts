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

export const cardCreateClicked = createEvent<{ card: KanbanCardForm; columnId: string }>();
export const cardEditClicked = createEvent<{ card: KanbanCardForm; columnId: string; cardId: string }>();
export const cardDeleteClicked = createEvent<{ columnId: string; cardId: string }>();
export const cardMoved = createEvent<{
  sourceColumnId: string;
  destinationColumnId: string;
  sourceIndex: number;
  destinationIndex: number;
}>();

const cardMovedInTheColumn = cardMoved.filter({
  fn: ({ sourceColumnId, destinationColumnId }) => sourceColumnId === destinationColumnId,
});

const cardMovedToAnotherColumn = cardMoved.filter({
  fn: ({ sourceColumnId, destinationColumnId }) => sourceColumnId !== destinationColumnId,
});

export const $board = createStore<KanbanBoard>(INITIAL_BOARD);

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

$board.on(cardMovedInTheColumn, (board, { sourceColumnId, sourceIndex, destinationIndex }) => {
  const updatedBoard = board.map((column) => {
    if (column.id === sourceColumnId) {
      const updatedList = listReorder(column, sourceIndex, destinationIndex);
      return updatedList;
    }
    return column;
  });

  return updatedBoard;
});

$board.on(cardMovedToAnotherColumn, (board, { sourceColumnId, destinationColumnId, sourceIndex, destinationIndex }) => {
  const updatedBoard = moveCard(board, sourceColumnId, destinationColumnId, sourceIndex, destinationIndex);
  return updatedBoard;
});

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

// debug($board, cardEditClicked);
