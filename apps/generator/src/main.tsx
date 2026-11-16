import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ready } from "./content";

// The interface text of the chosen language comes first; the app is loaded after it, because its modules read text as they load.
void ready.then(async () => {
  const { App } = await import("./App");
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
