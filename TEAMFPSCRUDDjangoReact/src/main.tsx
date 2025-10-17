import React from "react";
import { createRoot } from "react-dom/client";
import CRUD from "./CRUD";  


createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CRUD />
  </React.StrictMode>
);
