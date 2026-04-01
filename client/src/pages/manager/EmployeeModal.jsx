import { useState } from "react";

export default function EmployeeModal({ initialEmployee, onSave, onClose }) {
  const [name, setName] = useState(initialEmployee?.employeeName || "");
  const [isManager, setIsManager] = useState(initialEmployee?.isManager || false);
  const [hoursWorked, setHoursWorked] = useState(
    initialEmployee?.hoursWorked?.toString() || ""
  );
  const [hourlyPay, setHourlyPay] = useState(
    initialEmployee?.hourlyPay?.toString() || ""
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Error handling for invalid employee added/edited
  const handleSave = async () => {
    setError("");

    if (!name.trim()) {
      setError("Employee name is required.");
      return;
    }

    const parsedHours = parseFloat(hoursWorked);
    if (Number.isNaN(parsedHours) || parsedHours < 0) {
      setError("Hours worked must be a valid non-negative number.");
      return;
    }

    const parsedPay = parseFloat(hourlyPay);
    if (Number.isNaN(parsedPay) || parsedPay < 0) {
      setError("Hourly pay must be a valid non-negative number.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        employeeId: initialEmployee?.employeeId,
        employeeName: name.trim(),
        isManager,
        hoursWorked: parsedHours,
        hourlyPay: parsedPay,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save employee.");
    } finally {
      setSaving(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter") handleSave();
  };

  return (
    <div className="modal-overlay manager-modal-overlay">
      <div className="modal manager-modal">
        <div className="modal-header manager-modal-header">
          <h2 className="modal-title manager-modal-title">
            {initialEmployee ? "Edit Employee" : "Add Employee"}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="manager-modal-body">
          <label className="manager-modal-label">Employee name</label>
          <input
            className="manager-modal-input"
            placeholder="e.g. Haley Rivera"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onKey}
            autoFocus
          />

          <label className="manager-modal-label">Is manager</label>
          <label className="manager-checkbox-label">
            <input
              type="checkbox"
              checked={isManager}
              onChange={(e) => setIsManager(e.target.checked)}
            />
            Manager account
          </label>

          <label className="manager-modal-label">Hours worked</label>
          <input
            className="manager-modal-input"
            placeholder="e.g. 40"
            value={hoursWorked}
            onChange={(e) => setHoursWorked(e.target.value)}
            onKeyDown={onKey}
          />

          <label className="manager-modal-label">Hourly pay</label>
          <input
            className="manager-modal-input"
            placeholder="e.g. 15.00"
            value={hourlyPay}
            onChange={(e) => setHourlyPay(e.target.value)}
            onKeyDown={onKey}
          />

          {error && <p className="manager-modal-error">{error}</p>}
        </div>

        <div className="manager-modal-footer">
          <button
            className="modal-btn-action manager-modal-btn-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
