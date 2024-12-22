import { api } from "@/shared/api";
import { createEffect, createEvent, createStore, sample } from "effector";
import { createGate } from "effector-react";

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

export const PageGate = createGate();

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

export const $board = createStore<KanbanBoard>([]);

/** Load lists and cards from db */

const boardsLoadFx = createEffect(async () => {
  const [lists, cards] = await Promise.all([api.kanban.listsLoadFx(), api.kanban.cardsLoadFx()]);

  const updatedLists = lists.map((list) => ({
    ...list,
    cards: cards.filter((card) => card.list_id === list.id),
  }));

  console.log("Updated lists", updatedLists);
  return updatedLists;
});

sample({
  clock: PageGate.open,
  target: boardsLoadFx,
});
$board.on(boardsLoadFx.doneData, (_, board) => board);

/** Create initial lists if there are none */

const boardsInitializeFx = createEffect(async () => {
  const lists = await Promise.all([
    api.kanban.listCreateFx({ title: "To Do" }),
    api.kanban.listCreateFx({ title: "In Progress" }),
    api.kanban.listCreateFx({ title: "Done" }),
  ]);

  return lists.filter((list) => list !== null);
});

sample({
  clock: boardsLoadFx.doneData,
  source: $board,
  filter: (boards) => boards.length === 0,
  target: boardsInitializeFx,
});

$board.on(boardsInitializeFx.doneData, (_, board) => board.map((list) => ({ ...list, cards: [] })));

export const cardCreateClicked = createEvent<{ card: KanbanCardForm; columnId: string }>();
export const cardCreated = createEvent<{ card: KanbanCard; columnId: string }>();

sample({
  clock: cardCreateClicked,
  fn: ({ card, columnId }) => ({ card: { ...card, id: crypto.randomUUID() }, columnId }),
  target: cardCreated,
});

$board.on(cardCreated, (board, { card, columnId }) => {
  const updatedBoard = board.map((column) => {
    if (column.id === columnId) {
      return { ...column, cards: [...column.cards, card] };
    }

    return column;
  });

  return updatedBoard;
});

const cardSaveFx = createEffect(
  async ({ card: { id: _, ...card }, columnId }: { card: KanbanCard; columnId: string }) => {
    return await api.kanban.cardCreateFx({ ...card, list_id: columnId });
  },
);

sample({
  clock: cardCreated,
  target: cardSaveFx,
});

const cardSavedSuccess = createEvent<{ originalId: string; card: KanbanCard; columnId: string }>();
const cardSavedError = createEvent<{ originalId: string; columnId: string }>();

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
  const updatedBoard = board.map((column) => {
    if (column.id === columnId) {
      const updatedCards = column.cards.map((existingCard) => (existingCard.id === originalId ? card : existingCard));
      return { ...column, cards: updatedCards };
    }

    return column;
  });

  return updatedBoard;
});

$board.on(cardSavedError, (board, { originalId, columnId }) => {
  const updatedBoard = board.map((column) => {
    if (column.id === columnId) {
      const updatedCards = column.cards.filter((card) => card.id !== originalId);
      return { ...column, cards: updatedCards };
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
