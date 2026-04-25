import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from "react-router";
import { Root } from "./pages/Root";
import { ErrorPage } from "./pages/ErrorPage";
import { RequireAccess } from "./context/AuthContext";

const Dashboard         = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const TransactionHistory = lazy(() => import('./pages/TransactionHistory').then(m => ({ default: m.TransactionHistory })));
const Budgets           = lazy(() => import('./pages/Budgets').then(m => ({ default: m.Budgets })));
const Invest            = lazy(() => import('./pages/Invest').then(m => ({ default: m.Invest })));
const Settings          = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const BankAccounts      = lazy(() => import('./pages/BankAccounts').then(m => ({ default: m.BankAccounts })));
const Login             = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));

function withSuspense(Component: React.ComponentType) {
  return () => React.createElement(Suspense, { fallback: null }, React.createElement(Component));
}

function withAccess(Component: React.ComponentType) {
  return () => React.createElement(
    Suspense, { fallback: null },
    React.createElement(RequireAccess, null, React.createElement(Component))
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    ErrorBoundary: ErrorPage,
    children: [
      { index: true,              Component: withAccess(Dashboard) },
      { path: "transactions",     Component: withAccess(TransactionHistory) },
      { path: "budgets",          Component: withAccess(Budgets) },
      { path: "invest",           Component: withAccess(Invest) },
      { path: "settings",         Component: withAccess(Settings) },
      { path: "bank-accounts",    Component: withAccess(BankAccounts) },
      { path: "login",            Component: withSuspense(Login) },
    ],
  },
]);
