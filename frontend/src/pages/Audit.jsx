import { useEffect, useMemo, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { auditCyclesApi, departmentsApi, usersApi } from "../api";
import { useAuth } from "../context/useAuth";

const VERIFICATION_SEVERITY = {
  Verified: "af-badge-emerald",
  Missing: "af-badge-rose",
  Damaged: "af-badge-rose",
  Pending: "af-badge-slate",
};

function Audit() {
  const { user: currentUser } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Cycle Dialog Form States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", scopeDepartment: "", scopeLocation: "", startDate: "", endDate: "", assignedAuditors: [] });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Checklist View State
  const [activeCycle, setActiveCycle] = useState(null);

  // Finding Update Dialog States
  const [findingDialogOpen, setFindingDialogOpen] = useState(false);
  const [selectedAssetItem, setSelectedAssetItem] = useState(null);
  const [auditResult, setAuditResult] = useState("Verified");
  const [actualLoc, setActualLoc] = useState("");
  const [remarks, setRemarks] = useState("");

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      auditCyclesApi.getAuditCycles(),
      departmentsApi.getDepartments(),
      usersApi.getUsers(),
    ])
      .then(([cy, d, e]) => {
        setCycles(cy || []);
        setDepartments(d || []);
        setEmployees(e || []);

        // Refresh expanded active cycle if set
        if (activeCycle) {
          const updated = cy.find((c) => c._id === activeCycle._id);
          setActiveCycle(updated || null);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const departmentOptions = useMemo(() => {
    return departments.map((d) => ({ label: d.departmentName, value: d._id }));
  }, [departments]);

  const auditorOptions = useMemo(() => {
    return employees
      .filter((e) => e.status === "Active")
      .map((e) => ({ label: e.name, value: e._id }));
  }, [employees]);

  const openCreateDialog = () => {
    setForm({ title: "", scopeDepartment: "", scopeLocation: "", startDate: "", endDate: "", assignedAuditors: [] });
    setSaveError("");
    setDialogOpen(true);
  };

  const handleCreateCycle = async () => {
    if (!form.title || !form.startDate || !form.endDate) {
      setSaveError("Title, start date and end date are required.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await auditCyclesApi.createAuditCycle(form);
      setDialogOpen(false);
      loadAll();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Open Log Finding Dialog
  const openFindingDialog = (item) => {
    setSelectedAssetItem(item);
    setAuditResult(item.status === "Pending" ? "Verified" : item.status);
    setActualLoc(item.actualLocation || "");
    setRemarks(item.remarks || "");
    setFindingDialogOpen(true);
  };

  const handleSaveFinding = async () => {
    setSaving(true);
    try {
      await auditCyclesApi.updateAuditItem(activeCycle._id, {
        assetId: selectedAssetItem.asset._id,
        status: auditResult,
        actualLocation: actualLoc,
        remarks: remarks,
      });
      setFindingDialogOpen(false);
      loadAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseCycle = async (cycleId) => {
    if (!window.confirm("Are you sure you want to close and lock this audit cycle? Discrepancies will update asset states automatically.")) return;
    try {
      await auditCyclesApi.closeAuditCycle(cycleId);
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const isManager = ["Admin", "Asset Manager"].includes(currentUser?.role);

  return (
    <div className="space-y-6">
      {error && <Message severity="error" text={error} className="mb-4 w-full justify-start" />}

      {/* Audit Cycles Overview */}
      <div className="af-glass rounded-2xl p-6 border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Audit Cycles</h2>
          {isManager && (
            <Button label="New Audit Cycle" icon="pi pi-plus" className="p-button-sm text-xs" onClick={openCreateDialog} />
          )}
        </div>

        <DataTable
          value={cycles}
          className="text-sm"
          emptyMessage="No audit cycles scheduled yet."
          onRowClick={(e) => setActiveCycle(e.data)}
        >
          <Column field="title" header="Audit Title" body={(r) => <span className="font-bold text-white hover:text-indigo-300 transition">{r.title}</span>} />
          <Column header="Scope" body={(r) => r.scopeDepartment?.departmentName || r.scopeLocation || "All Assets"} />
          <Column header="Auditors" body={(r) => (r.assignedAuditors || []).map((a) => a.name).join(", ") || "—"} />
          <Column header="Progress" body={(r) => {
            const total = r.results?.length || 0;
            const completed = r.results?.filter((x) => x.status !== "Pending").length || 0;
            return <span className="font-mono text-xs">{completed} / {total} verified</span>;
          }} />
          <Column
            field="status"
            header="Status"
            body={(r) => (
              <Tag
                value={r.status}
                className={r.status === "Active" ? "af-badge-indigo animate-pulse" : "af-badge-slate"}
              />
            )}
          />
        </DataTable>
      </div>

      {/* Expanded Active Cycle Checklist Panel */}
      {activeCycle && (
        <div className="af-glass rounded-2xl p-6 border border-white/5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">{activeCycle.title}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Active checklist for assigned auditors: {(activeCycle.assignedAuditors || []).map((x) => x.name).join(", ")}
              </p>
            </div>
            {isManager && activeCycle.status === "Active" && (
              <Button
                label="Close & Lock Cycle"
                icon="pi pi-lock"
                severity="danger"
                className="mt-3 sm:mt-0 !bg-rose-500/10 hover:!bg-rose-500/20 text-rose-300 border border-rose-500/20"
                onClick={() => handleCloseCycle(activeCycle._id)}
              />
            )}
          </div>

          <DataTable value={activeCycle.results} className="text-sm" emptyMessage="No assets in this cycle's scope.">
            <Column header="Asset Tag" body={(r) => <span className="font-mono text-xs text-indigo-300 font-semibold">{r.asset?.assetTag}</span>} />
            <Column header="Asset Name" body={(r) => <span className="font-bold text-white">{r.asset?.assetName}</span>} />
            <Column field="actualLocation" header="Audited Location" />
            <Column
              field="status"
              header="Verification"
              body={(r) => <Tag value={r.status} className={VERIFICATION_SEVERITY[r.status]} />}
            />
            <Column field="remarks" header="Auditor Remarks" />
            {activeCycle.status === "Active" && (
              <Column
                header="Action"
                body={(r) => (
                  <Button
                    label="Log Finding"
                    size="small"
                    outlined
                    icon="pi pi-check"
                    className="!py-1 !px-2 text-xs"
                    onClick={() => openFindingDialog(r)}
                  />
                )}
              />
            )}
          </DataTable>

          {/* Auto-Generated Discrepancies Report */}
          <div className="rounded-xl border border-white/5 bg-white/5 p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 block">Flagged Discrepancies Report</span>
            {activeCycle.results?.filter((x) => x.status === "Missing" || x.status === "Damaged").length === 0 ? (
              <p className="text-xs text-slate-500 italic">No discrepancies flagged during verification.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {activeCycle.results
                  ?.filter((x) => x.status === "Missing" || x.status === "Damaged")
                  .map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                      <span>
                        <span className="font-bold text-white font-mono">{item.asset?.assetTag}</span> · {item.asset?.assetName} —{" "}
                        <span className="text-rose-300 font-semibold">{item.remarks || "No remarks"}</span>
                      </span>
                      <Tag value={item.status} className="af-badge-rose" />
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Create Cycle Dialog */}
      <Dialog header="Schedule Audit Cycle" visible={dialogOpen} onHide={() => setDialogOpen(false)} style={{ width: "29rem" }}>
        <div className="space-y-4 pt-2">
          <Field label="Cycle Title *">
            <InputText className="w-full" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Q3 Electronics Audit" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Department Scope">
              <Dropdown className="w-full" value={form.scopeDepartment} onChange={(e) => setForm({ ...form, scopeDepartment: e.value })} options={departmentOptions} placeholder="Select Department" showClear />
            </Field>
            <Field label="Location Scope">
              <InputText className="w-full" value={form.scopeLocation} onChange={(e) => setForm({ ...form, scopeLocation: e.target.value })} placeholder="e.g. Floor 2" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date">
              <InputText type="date" className="w-full" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label="End Date">
              <InputText type="date" className="w-full" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
          </div>
          <Field label="Assign Auditors">
            <Dropdown
              className="w-full"
              value={form.assignedAuditors}
              onChange={(e) => setForm({ ...form, assignedAuditors: e.value })}
              options={auditorOptions}
              placeholder="Select Auditor"
              showClear
            />
          </Field>
          {saveError && <Message severity="error" text={saveError} className="w-full justify-start" />}
          <Button label="Schedule Audit Cycle" className="w-full justify-center mt-2" loading={saving} onClick={handleCreateCycle} />
        </div>
      </Dialog>

      {/* Log Finding Dialog */}
      <Dialog header="Log Auditor Finding" visible={findingDialogOpen} onHide={() => setFindingDialogOpen(false)} style={{ width: "26rem" }}>
        {selectedAssetItem && (
          <div className="space-y-4 pt-2">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-sm">
              <p className="text-slate-400">Asset: <span className="text-white font-bold">{selectedAssetItem.asset?.assetTag} · {selectedAssetItem.asset?.assetName}</span></p>
              <p className="text-slate-400">Original Location: <span className="text-white font-mono text-xs">{selectedAssetItem.asset?.location || "—"}</span></p>
            </div>
            <Field label="Verification Finding">
              <Dropdown
                className="w-full"
                value={auditResult}
                onChange={(e) => setAuditResult(e.value)}
                options={["Verified", "Missing", "Damaged"]}
              />
            </Field>
            <Field label="Actual Audited Location">
              <InputText className="w-full" value={actualLoc} onChange={(e) => setActualLoc(e.target.value)} />
            </Field>
            <Field label="Auditor Remarks">
              <InputText className="w-full" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </Field>
            <Button label="Save Finding" className="w-full justify-center mt-2" onClick={handleSaveFinding} />
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

export default Audit;
