import React from 'react';
import { createBrowserRouter } from "react-router";
import { Dashboard } from "./pages/Dashboard";
import { TransactionHistory } from "./pages/TransactionHistory";
import { Root } from "./pages/Root";
import { Login } from "./pages/Login";
import { RequireAuth } from "./context/AuthContext";

const ProtectedDashboard = () => React.createElement(RequireAuth, null, React.createElement(Dashboard));
const ProtectedTransactions = () =>
  React.createElement(RequireAuth, null, React.createElement(TransactionHistory));

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: ProtectedDashboard },
      { path: "transactions", Component: ProtectedTransactions },
      { path: "login", Component: Login },
    ],
  },
]);
