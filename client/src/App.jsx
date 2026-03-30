import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Portal from "./pages/portal";
import CashierLoginPage from "./pages/cashier/CashierLoginPage";
import CashierPage from "./pages/cashier/CashierPage";
import ManagerLoginPage from "./pages/manager/ManagerLoginPage";
import ManagerNav from "./pages/manager/ManagerNav";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/login" element={<Navigate to="/cashier/login" replace />} />
        <Route path="/cashier/login" element={<CashierLoginPage />} />
        <Route path="/cashier" element={<CashierPage />} />
        <Route path="/manager/login" element={<ManagerLoginPage />} />
        <Route path="/manager" element={<Navigate to="/manager/analytics" replace />} />
        <Route path="/manager/:page" element={<ManagerNav />} />
      </Routes>
    </BrowserRouter>
  );
}

