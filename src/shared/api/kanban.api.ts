import { type PostgrestError } from "@supabase/supabase-js";
import { createEffect } from "effector";

import { client } from "./client";
import { type Tables } from "./database.types";

export type List = Tables<"lists">;
export type ListCreate = Omit<List, "id" | "created_at">;

export type Card = Tables<"cards">;
export type CardCreate = Omit<Card, "id" | "created_at">;
export type CardDelete = { cardId: string };
export type CardUpdate = Pick<Card, "id"> & Partial<Omit<Card, "id" | "created_at">>;

export const listsLoadFx = createEffect<void, List[], PostgrestError>(async () => {
  const { data } = await client.from("lists").select("*").throwOnError();
  return data ?? [];
});

export const listCreateFx = createEffect<ListCreate, List | null, PostgrestError>(async (list) => {
  const { data } = await client.from("lists").insert(list).select("*").single().throwOnError();
  return data ?? null;
});

export const cardsLoadFx = createEffect<void, Card[], PostgrestError>(async () => {
  const { data } = await client.from("cards").select("*").throwOnError();
  return data ?? [];
});

export const cardCreateFx = createEffect<CardCreate, Card | null, PostgrestError>(async (card) => {
  const { data } = await client.from("cards").insert(card).select("*").single().throwOnError();
  return data ?? null;
});

export const cardDeleteFx = createEffect<CardDelete, null, PostgrestError>(async ({ cardId }) => {
  await client.from("cards").delete().eq("id", cardId).throwOnError();
  return null;
});

export const cardUpdateFx = createEffect<CardUpdate, Card | null, PostgrestError>(async (card) => {
  const { data } = await client.from("cards").update(card).eq("id", card.id).select("*").single().throwOnError();

  return data ?? null;
});
