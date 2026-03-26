import React from 'react';
import { createBrowserRouter } from "react-router";
import { Dashboard } from "./pages/Dashboard";
import { TransactionHistory } from "./pages/TransactionHistory";
import { Root } from "./pages/Root";
import { Login } from "./pages/Login";
import { RequireAccess } from "./context/AuthContext";

// Both authenticated users and guests can access these routes
const ProtectedDashboard = () => React.createElement(RequireAccess, null, React.createElement(Dashboard));
const ProtectedTransactions = () =>
  React.createElement(RequireAccess, null, React.createElement(TransactionHistory));

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
