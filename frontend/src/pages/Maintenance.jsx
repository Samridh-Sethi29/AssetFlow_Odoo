import { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Message } from "primereact/message";
import { Tag } from "primereact/tag";
import { assetsApi, maintenanceApi, usersApi, vendorsApi } from "../api";
import { useAuth } from "../context/useAuth";

const COLUMNS = ["Pending", "Approved", "In Progress", "Completed"];

const PRIORITY_SEVERITY = {
  Low: "af-badge-emerald",
  Medium: "af-badge-indigo",
  High: "af-badge-amber",
  Critical: "af-badge-rose",
};

function Maintenance() {
  const { user: currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Request Form State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ asset: "", issue: "", priority: "Medium", assignedVendor: "", estimatedCost: 0 });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Assign Tech Dialog State
  const [techDialogOpen, setTechDialogOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [assignedTech, setAssignedTech] = useState("");

  // Completion Dialog State
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [actualCost, setActualCost] = useState(0);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      maintenanceApi.getMaintenance(),
      assetsApi.getAssets(),
      usersApi.getUsers(),
      vendorsApi.getVendors(),
    ])
      .then(([m, a, e, v]) => {
        setRequests(m || []);
        setAssets(a || []);
        setEmployees(e || []);
        setVendors(v || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const assetOptions = useMemo(() => {
    return assets
      .filter((a) => a.status === "Available" || a.status === "Allocated")
      .map((a) => ({ label: `${a.assetTag} — ${a.assetName}`, value: a._id }));
  }, [assets]);

  const technicianOptions = useMemo(() => {
    return employees
      .filter((e) => e.status === "Active")
      .map((e) => ({ label: `${e.name} (${e.role})`, value: e._id }));
  }, [employees]);

  const vendorOptions = useMemo(() => {
    return vendors.map((v) => ({ label: v.vendorName, value: v._id }));
  }, [vendors]);

  const grouped = useMemo(() => {
    return COLUMNS.reduce((acc, col) => {
      acc[col] = requests.filter((r) => r.status === col);
      return acc;
    }, {});
  }, [requests]);

  const openCreateDialog = () => {
    setForm({ asset: "", issue: "", priority: "Medium", assignedVendor: "", estimatedCost: 0 });
    setSaveError("");
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!form.asset || !form.issue) {
      setSaveError("Select an asset and describe the issue.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await maintenanceApi.createMaintenance(form);
      setDialogOpen(false);
      loadAll();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // State actions
  const handleApprove = async (item) => {
    try {
      await maintenanceApi.updateMaintenance(item._id, { status: "Approved" });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async (item) => {
    try {
      await maintenanceApi.updateMaintenance(item._id, { status: "Rejected" });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const openTechDialog = (item) => {
    setSelectedReq(item);
    setAssignedTech(item.assignedTechnician?._id || "");
    setTechDialogOpen(true);
  };

  const handleAssignTech = async () => {
    if (!assignedTech) return;
    try {
      await maintenanceApi.updateMaintenance(selectedReq._id, {
        assignedTechnician: assignedTech,
        status: "In Progress",
      });
      setTechDialogOpen(false);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const openCompleteDialog = (item) => {
    setSelectedReq(item);
    setActualCost(item.estimatedCost || 0);
    setCompleteDialogOpen(true);
  };

  const handleComplete = async () => {
    try {
      await maintenanceApi.updateMaintenance(selectedReq._id, {
        status: "Completed",
        actualCost: parseFloat(actualCost) || 0,
      });
      setCompleteDialogOpen(false);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const isManager = ["Admin", "Asset Manager"].includes(currentUser?.role);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button label="New Request" icon="pi pi-plus" onClick={openCreateDialog} />
      </div>

      {error && <Message severity="error" text={error} className="mb-4 w-full justify-start" />}

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => (
          <div key={col} className="bg-white/25 rounded-2xl p-4 border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {col}
              </span>
              <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-slate-400 font-bold">
                {grouped[col]?.length || 0}
              </span>
            </div>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {loading && <p className="text-xs text-indigo-400">Loading...</p>}
              {!loading &&
                (grouped[col] || []).map((item) => (
                  <div key={item._id} className="af-glass rounded-xl p-4 space-y-3 relative border border-white/5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-indigo-300 font-bold">{item.asset?.assetTag}</span>
                      <Tag value={item.priority} className={PRIORITY_SEVERITY[item.priority]} />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-white leading-tight">{item.issue}</p>
                      <p className="text-xs text-slate-400 mt-1">{item.asset?.assetName}</p>
                    </div>

                    {item.assignedTechnician && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold border-t border-white/5 pt-2">
                        <i className="pi pi-user text-[10px] text-indigo-400" />
                        <span>Tech: {item.assignedTechnician.name}</span>
                      </div>
                    )}

                    {/* Column Specific Actions */}
                    {isManager && col === "Pending" && (
                      <div className="flex gap-2 pt-1.5 border-t border-white/5">
                        <Button
                          label="Approve"
                          size="small"
                          className="!py-1 !px-2.5 text-xs !bg-emerald-500/10 hover:!bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                          onClick={() => handleApprove(item)}
                        />
                        <Button
                          label="Reject"
                          size="small"
                          severity="danger"
                          outlined
                          className="!py-1 !px-2.5 text-xs"
                          onClick={() => handleReject(item)}
                        />
                      </div>
                    )}

                    {isManager && col === "Approved" && (
                      <div className="pt-1 border-t border-white/5">
                        <Button
                          label="Dispatch Tech"
                          icon="pi pi-user-plus"
                          size="small"
                          className="w-full !py-1.5 text-xs"
                          onClick={() => openTechDialog(item)}
                        />
                      </div>
                    )}

                    {col === "In Progress" && (
                      <div className="pt-1 border-t border-white/5">
                        <Button
                          label="Resolve Request"
                          icon="pi pi-check-circle"
                          size="small"
                          className="w-full !py-1.5 text-xs !bg-emerald-500/10 hover:!bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                          onClick={() => openCompleteDialog(item)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              {!loading && !grouped[col]?.length && (
                <div className="rounded-xl border border-dashed border-white/5 p-4 text-center text-xs text-slate-500 font-semibold">
                  No requests
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Request Dialog */}
      <Dialog header="New Maintenance Request" visible={dialogOpen} onHide={() => setDialogOpen(false)} style={{ width: "28rem" }}>
        <div className="space-y-4 pt-2">
          <Field label="Asset *">
            <Dropdown className="w-full" value={form.asset} onChange={(e) => setForm({ ...form, asset: e.value })} options={assetOptions} filter placeholder="Select asset" />
          </Field>
          <Field label="Issue *">
            <InputText className="w-full" value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} placeholder="Describe the issue..." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <Dropdown className="w-full" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.value })} options={["Low", "Medium", "High", "Critical"]} />
            </Field>
            <Field label="Estimated Cost">
              <InputText type="number" className="w-full" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: parseFloat(e.target.value) || 0 })} />
            </Field>
          </div>
          <Field label="Assigned Vendor (Optional)">
            <Dropdown className="w-full" value={form.assignedVendor} onChange={(e) => setForm({ ...form, assignedVendor: e.value })} options={vendorOptions} placeholder="Select vendor" showClear />
          </Field>
          {saveError && <Message severity="error" text={saveError} className="w-full justify-start" />}
          <Button label="Submit Request" className="w-full justify-center mt-2" loading={saving} onClick={handleCreate} />
        </div>
      </Dialog>

      {/* Dispatch Tech Dialog */}
      <Dialog header="Dispatch Technician" visible={techDialogOpen} onHide={() => setTechDialogOpen(false)} style={{ width: "26rem" }}>
        {selectedReq && (
          <div className="space-y-4 pt-2">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-sm">
              <p className="text-slate-400">Asset: <span className="text-white font-bold">{selectedReq.asset?.assetTag} · {selectedReq.asset?.assetName}</span></p>
              <p className="text-slate-400">Issue: <span className="text-white font-bold">"{selectedReq.issue}"</span></p>
            </div>
            <Field label="Select Technician">
              <Dropdown
                className="w-full"
                value={assignedTech}
                onChange={(e) => setAssignedTech(e.value)}
                options={technicianOptions}
                filter
                placeholder="Select staff technician..."
              />
            </Field>
            <Button label="Dispatch & Start Work" className="w-full justify-center mt-2" onClick={handleAssignTech} />
          </div>
        )}
      </Dialog>

      {/* Complete Resolution Dialog */}
      <Dialog header="Resolve Maintenance Request" visible={completeDialogOpen} onHide={() => setCompleteDialogOpen(false)} style={{ width: "26rem" }}>
        {selectedReq && (
          <div className="space-y-4 pt-2">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-sm">
              <p className="text-slate-400">Asset: <span className="text-white font-bold">{selectedReq.asset?.assetTag} · {selectedReq.asset?.assetName}</span></p>
              <p className="text-slate-400">Estimated Cost: <span className="text-white font-bold">${selectedReq.estimatedCost}</span></p>
            </div>
            <Field label="Actual Cost">
              <InputText type="number" className="w-full" value={actualCost} onChange={(e) => setActualCost(e.target.value)} />
            </Field>
            <Button label="Complete & Mark Resolved" className="w-full justify-center mt-2" onClick={handleComplete} />
          </div>
        )}
      </Dialog>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export default Maintenance;
