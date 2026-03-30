import "../../styles/manager.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "");


export default function AnalyticsPage() {
  return <h1>Manager Menu Page</h1>;
}