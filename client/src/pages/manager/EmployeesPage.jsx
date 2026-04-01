import { useState, useEffect, useCallback } from "react";
import EmployeeModal from "./EmployeeModal";
import "../../styles/manager.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "");

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_URL}/api/manager/employees`);
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      setError(err.message || "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Saving new/edited employee information
  const handleSaveEmployee = async (employee) => {
    const isEdit = Boolean(employee.employeeId);
    const url = isEdit
      ? `${API_URL}/api/manager/employees/${employee.employeeId}`
      : `${API_URL}/api/manager/employees`;
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeName: employee.employeeName,
        isManager: employee.isManager,
        hoursWorked: employee.hoursWorked,
        hourlyPay: employee.hourlyPay,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Server responded ${res.status}`);
    }

    await reload();
  };

  // Deleting employee information
  const handleRemove = async (employeeId) => {
    if (!window.confirm("Remove this employee?")) return;

    const res = await fetch(`${API_URL}/api/manager/employees/${employeeId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || `Server responded ${res.status}`);
      return;
    }

    await reload();
  };

  const openAddModal = () => {
    setEditingEmployee(null);
    setShowModal(true);
  };

  const openEditModal = (employee) => {
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
  };

  return (
    <div className="manager-page">
      <div className="manager-header">
        <h1 className="manager-title">Employees</h1>
        <div className="manager-actions">
          <button className="btn-secondary" onClick={openAddModal}>
            + Add Employee
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Manager</th>
                <th>Hours Worked</th>
                <th>Hourly Pay</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.employeeId}>
                  <td>{employee.employeeId}</td>
                  <td>{employee.employeeName}</td>
                  <td>{employee.isManager ? "Yes" : "No"}</td>
                  <td>{Number(employee.hoursWorked).toFixed(2)}</td>
                  <td>${Number(employee.hourlyPay).toFixed(2)}</td>
                  <td className="text-right">
                    <button
                      className="btn-secondary"
                      onClick={() => openEditModal(employee)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleRemove(employee.employeeId)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center muted">
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <EmployeeModal
          initialEmployee={editingEmployee}
          onSave={handleSaveEmployee}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
