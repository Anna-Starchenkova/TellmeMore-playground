import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Playground from "../app/Playground";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
);
