import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { MantineProvider } from "@mantine/core";

import { Application } from "./application.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider>
      <Application />
    </MantineProvider>
  </StrictMode>,
);
