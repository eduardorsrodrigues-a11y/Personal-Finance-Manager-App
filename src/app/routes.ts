import React from 'react';
import { createBrowserRouter } from "react-router";
import { Dashboard } from "./pages/Dashboard";
import { TransactionHistory } from "./pages/TransactionHistory";
import { Budgets } from "./pages/Budgets";
import { Invest } from "./pages/Invest";
import { Settings } from "./pages/Settings";
import { Root } from "./pages/Root";
import { Login } from "./pages/Login";
import { ErrorPage } from "./pages/ErrorPage";
import { RequireAccess } from "./context/AuthContext";

// Both authenticated users and guests can access these routes
const ProtectedDashboard = () => React.createElement(RequireAccess, null, React.createElement(Dashboard));
const ProtectedTransactions = () =>
  React.createElement(RequireAccess, null, React.createElement(TransactionHistory));
const ProtectedBudgets = () =>
  React.createElement(RequireAccess, null, React.createElement(Budgets));
const ProtectedInvest = () =>
  React.createElement(RequireAccess, null, React.createElement(Invest));
const ProtectedSettings = () =>
  React.createElement(RequireAccess, null, React.createElement(Settings));

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    ErrorBoundary: ErrorPage,
    children: [
      { index: true, Component: ProtectedDashboard },
      { path: "transactions", Component: ProtectedTransactions },
      { path: "budgets", Component: ProtectedBudgets },
      { path: "invest", Component: ProtectedInvest },
      { path: "settings", Component: ProtectedSettings },
      { path: "login", Component: Login },
    ],
  },
]);
