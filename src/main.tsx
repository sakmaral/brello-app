import { createRoot } from "react-dom/client";

import { MantineProvider } from "@mantine/core";

import { Application } from "./application.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <MantineProvider defaultColorScheme="auto">
    <Application />
  </MantineProvider>,
);
