import { useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddTransaction from "./pages/AddTransaction";
import Transactions from "./pages/Transactions";
import AddRekening from "./pages/AddRekening";
import AddTabungan from "./pages/AddTabungan";
import AddAnggaran from "./pages/AddAnggaran";
import UtangPiutang from "./pages/UtangPiutang";
import AdminUsers from "./pages/AdminUsers";
import Settings from "./pages/Settings";

import AppLayout from "./layouts/AppLayout";

function getUserFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );
  const [authPage, setAuthPage] = useState("login");
  const [page, setPage] = useState("dashboard");
  const [user, setUser] = useState(getUserFromToken());

  function handleLogout() {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUser(null);
    setAuthPage("login");
    setPage("dashboard");
  }

  function handleLogin() {
    setUser(getUserFromToken());
    setIsLoggedIn(true);
    setPage("dashboard");
  }

  if (!isLoggedIn) {
    if (authPage === "register") {
      return <Register onBackToLogin={() => setAuthPage("login")} />;
    }

    return (
      <Login
        onLogin={handleLogin}
        onShowRegister={() => setAuthPage("register")}
      />
    );
  }

  let content;

  if (page === "add-transaction") {
    content = (
      <AddTransaction
        onBack={() => setPage("dashboard")}
        onSuccess={() => setPage("dashboard")}
      />
    );
  } else if (page === "transactions") {
    content = <Transactions onBack={() => setPage("dashboard")} />;
  } else if (page === "add-rekening") {
    content = (
      <AddRekening
        onBack={() => setPage("dashboard")}
        onSuccess={() => setPage("dashboard")}
      />
    );
  } else if (page === "add-tabungan") {
    content = (
      <AddTabungan
        onBack={() => setPage("dashboard")}
        onSuccess={() => setPage("dashboard")}
      />
    );
  } else if (page === "add-anggaran") {
    content = (
      <AddAnggaran
        onBack={() => setPage("dashboard")}
        onSuccess={() => setPage("dashboard")}
      />
    );
  } else if (page === "utang-piutang") {
    content = <UtangPiutang onBack={() => setPage("dashboard")} />;
  } else if (page === "admin-users") {
    content = <AdminUsers onBack={() => setPage("dashboard")} />;
  } else if (page === "settings") {
    content = <Settings onBack={() => setPage("dashboard")} />;
  } else {
    content = <Dashboard />;
  }

  return (
    <AppLayout
      page={page}
      setPage={setPage}
      user={user}
      onLogout={handleLogout}
    >
      {content}
    </AppLayout>
  );
}
