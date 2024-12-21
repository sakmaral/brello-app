import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { api } from "@/shared/api";
import { MantineProvider } from "@mantine/core";

import { Application } from "./application.tsx";
import "./index.css";

api.kanban.listsLoadFx();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="auto">
      <Application />
    </MantineProvider>
  </StrictMode>,
);
