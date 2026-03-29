import { BrowserRouter, Routes, Route } from "react-router-dom";
import Portal from "./pages/Portal";
import LoginPage from "./pages/LoginPage";
import CashierPage from "./pages/cashier/CashierPage";
import AnalyticsPage from "./pages/manager/AnalyticsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cashier" element={<CashierPage />} />
        <Route path="/manager" element={<AnalyticsPage />} />
      </Routes>
    </BrowserRouter>
  );
}