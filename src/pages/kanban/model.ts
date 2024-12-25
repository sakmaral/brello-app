// Imports
import { api } from "@/shared/api";
import { type CardUpdate } from "@/shared/api/kanban.api";
import { createEffect, createEvent, createStore, sample } from "effector";
import { createGate } from "effector-react";

// Types
export type KanbanBoard = KanbanList[];
export type KanbanList = {
  id: string;
  title: string;
  cards: KanbanCard[];
  sort_order: number;
};
export type KanbanCard = {
  id: string;
  title: string;
  sort_order: number;
};
export type KanbanCardForm = Pick<KanbanCard, "title">;
export type CardId = KanbanCard["id"];

// Gate
export const PageGate = createGate();

// Events
export const cardCreateClicked = createEvent<{ card: KanbanCardForm; columnId: string }>();
export const cardCreated = createEvent<{ card: KanbanCard; columnId: string }>();
const cardSavedSuccess = createEvent<{ originalId: string; card: KanbanCard; columnId: string }>();
const cardSavedError = createEvent<{ originalId: string; columnId: string }>();

export const cardEditClicked = createEvent<{ card: KanbanCardForm; columnId: string; cardId: string }>();
export const cardDeleteClicked = createEvent<{ columnId: string; cardId: string }>();
export const cardMoved = createEvent<{
  sourceColumnId: string;
  destinationColumnId: string;
  sourceIndex: number;
  destinationIndex: number;
  cardId: string;
}>();
const cardMovedWithOrder = createEvent<{
  sourceColumnId: string;
  destinationColumnId: string;
  sourceIndex: number;
  destinationIndex: number;
  cardId: string;
  sortOrder: number;
}>();

// Filters for card movement
const cardMovedInTheColumn = cardMovedWithOrder.filter({
  fn: ({ sourceColumnId, destinationColumnId }) => sourceColumnId === destinationColumnId,
});
const cardMovedToAnotherColumn = cardMovedWithOrder.filter({
  fn: ({ sourceColumnId, destinationColumnId }) => sourceColumnId !== destinationColumnId,
});

// Stores
export const $board = createStore<KanbanBoard>([]);
export const $cardPendingMap = createStore<Record<CardId, boolean>>({});

/** Effects */

// Load board data
const boardsLoadFx = createEffect(async () => {
  const [lists, cards] = await Promise.all([api.kanban.listsLoadFx(), api.kanban.cardsLoadFx()]);
  return lists.map((list) => ({
    ...list,
    cards: cards.filter((card) => card.list_id === list.id),
  }));
});

// Initialize board with default lists
const boardsInitializeFx = createEffect(async () => {
  const defaultLists = [
    { title: "To Do", sort_order: 1000 },
    { title: "In Progress", sort_order: 2000 },
    { title: "Done", sort_order: 3000 },
  ];
  const results = await Promise.all(defaultLists.map(api.kanban.listCreateFx));

  return results.filter((result) => result !== null);
});

// Create and save a new card
const cardSaveFx = createEffect(async ({ card, columnId }: { card: KanbanCard; columnId: string }) => {
  return await api.kanban.cardCreateFx({ ...card, list_id: columnId });
});

// Edit card
const cardEditFx = createEffect(
  async ({ cardId, card }: { cardId: string; card: Partial<CardUpdate> }) =>
    await api.kanban.cardUpdateFx({ ...card, id: cardId }),
);

// Delete card
const cardDeleteFx = createEffect(async ({ cardId }: { cardId: string }) => {
  await api.kanban.cardDeleteFx({ cardId });
});

/** Handlers and Samples */

// Load board on page open

sample({
  clock: PageGate.open,
  target: boardsLoadFx,
});

$board.on(boardsLoadFx.doneData, (_, board) => board);

// Initialize board if empty

sample({
  clock: boardsLoadFx.doneData,
  source: $board,
  filter: (boards) => boards.length === 0,
  target: boardsInitializeFx,
});

$board.on(boardsInitializeFx.doneData, (_, lists) => lists.map((list) => ({ ...list, cards: [] })));

// Handle card creation
sample({
  clock: cardCreateClicked,
  source: $board,
  fn: (board, { card, columnId }) => {
    const column = board.find((col) => col.id === columnId);
    const sort_order = column?.cards.length ? Math.max(...column.cards.map((c) => c.sort_order)) + 1000 : 10000;
    return { card: { ...card, id: crypto.randomUUID(), sort_order }, columnId };
  },
  target: cardCreated,
});

$board.on(cardCreated, (board, { card, columnId }) =>
  board.map((column) => (column.id === columnId ? { ...column, cards: [...column.cards, card] } : column)),
);

sample({
  clock: cardCreated,
  target: cardSaveFx,
});

$cardPendingMap
  .on(cardSaveFx, (pendingMap, { card }) => ({
    ...pendingMap,
    [card.id]: true,
  }))
  .on(cardSaveFx.finally, (pendingMap, { params }) => {
    const updatingPendingMap = { ...pendingMap };
    delete updatingPendingMap[params.card.id];
    return updatingPendingMap;
  });

sample({
  clock: cardSaveFx.done,
  filter: ({ result }) => result !== null,
  fn: ({ params, result: card }) => ({ originalId: params.card.id, card: card!, columnId: params.columnId }),
  target: cardSavedSuccess,
});

sample({
  clock: [cardSaveFx.fail, cardSaveFx.done.filter({ fn: ({ result }) => result === null })],
  fn: ({ params: { columnId, card } }) => ({ originalId: card.id, columnId }),
  target: cardSavedError,
});

$board.on(cardSavedSuccess, (board, { originalId, card, columnId }) => {
  return board.map((column) =>
    column.id === columnId
      ? { ...column, cards: column.cards.map((existingCard) => (existingCard.id === originalId ? card : existingCard)) }
      : column,
  );
});

$board.on(cardSavedError, (board, { originalId, columnId }) => {
  return board.map((column) =>
    column.id === columnId ? { ...column, cards: column.cards.filter((card) => card.id !== originalId) } : column,
  );
});

// Handle card edition

sample({ clock: cardEditClicked, target: cardEditFx });

$cardPendingMap
  .on(cardEditFx, (pendingMap, { cardId }) => ({
    ...pendingMap,
    [cardId]: true,
  }))
  .on(cardEditFx.finally, (pendingMap, { params }) => {
    const updatingPendingMap = { ...pendingMap };
    delete updatingPendingMap[params.cardId];
    return updatingPendingMap;
  });

$board.on(cardEditFx.done, (board, { params, result: card }) => {
  if (!card) return board;

  return board.map((column) =>
    column.id === card.list_id
      ? {
          ...column,
          cards: column.cards.map((existingCard) =>
            existingCard.id === params.cardId ? { ...existingCard, ...card } : existingCard,
          ),
        }
      : column,
  );
});

// Handle card deletion

sample({ clock: cardDeleteClicked, target: cardDeleteFx });

$cardPendingMap
  .on(cardDeleteFx, (pendingMap, { cardId }) => ({
    ...pendingMap,
    [cardId]: true,
  }))
  .on(cardDeleteFx.finally, (pendingMap, { params }) => {
    const updatingPendingMap = { ...pendingMap };
    delete updatingPendingMap[params.cardId];
    return updatingPendingMap;
  });

$board.on(cardDeleteFx.done, (board, { params: { cardId } }) => {
  return board.map((column) => {
    const updatedCards = column.cards.filter((card) => card.id !== cardId);

    if (updatedCards.length === column.cards.length) {
      return column;
    }

    return { ...column, cards: updatedCards };
  });
});

/** Change status of the card, move to another list */

sample({
  clock: cardMovedToAnotherColumn,
  fn: ({ destinationColumnId, cardId }) => ({ cardId, card: { list_id: destinationColumnId } }),
  target: cardEditFx,
});

$board.on(cardMovedToAnotherColumn, (board, { sourceColumnId, destinationColumnId, sourceIndex, destinationIndex }) => {
  const updatedBoard = moveCard(board, sourceColumnId, destinationColumnId, sourceIndex, destinationIndex);
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

/** Card reorder */

sample({
  clock: cardMoved,
  source: $board,
  fn: (board, { destinationColumnId, destinationIndex, ...rest }) => {
    const targetColumn = board.find((column) => column.id === destinationColumnId);

    const sortOrder = orderBetween(targetColumn?.cards[destinationIndex - 1], targetColumn?.cards[destinationIndex]);

    return {
      destinationColumnId,
      destinationIndex,
      sortOrder,
      ...rest,
    };
  },
  target: cardMovedWithOrder,
});

sample({
  clock: cardMovedWithOrder,
  fn: ({ cardId, destinationColumnId, sortOrder }) => ({
    cardId,
    card: { list_id: destinationColumnId, sort_order: sortOrder },
  }),
  target: cardEditFx,
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

const orderBetween = (previous?: { sort_order: number }, next?: { sort_order: number }): number => {
  if (previous && next) {
    return (previous.sort_order + next.sort_order) / 2;
  }

  if (previous) {
    return previous.sort_order + 1000;
  }

  if (next) {
    return next.sort_order - 1000;
  }

  return 10_000;
};
