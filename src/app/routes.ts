import { createBrowserRouter } from "react-router";
import { Dashboard } from "./pages/Dashboard";
import { TransactionHistory } from "./pages/TransactionHistory";
import { Root } from "./pages/Root";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      { path: "transactions", Component: TransactionHistory },
    ],
  },
]);
