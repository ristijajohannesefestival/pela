import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App";
import { VenueAdmin } from "./components/VenueAdmin";
import "./styles/globals.css";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/dj", element: <VenueAdmin /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
