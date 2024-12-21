CREATE TABLE "public"."cards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "list_id" UUID NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE "public"."lists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" CHARACTER VARYING NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX cards_pkey ON public.cards USING BTREE (id);
CREATE UNIQUE INDEX lists_pkey ON public.lists USING BTREE (id);

ALTER TABLE "public"."cards" ADD CONSTRAINT "cards_pkey" PRIMARY KEY USING INDEX "cards_pkey";
ALTER TABLE "public"."lists" ADD CONSTRAINT "lists_pkey" PRIMARY KEY USING INDEX "lists_pkey";

ALTER TABLE "public"."cards" ADD CONSTRAINT "cards_list_id_fkey" FOREIGN KEY (list_id) REFERENCES lists(id) NOT VALID;
ALTER TABLE "public"."cards" VALIDATE CONSTRAINT "cards_list_id_fkey";