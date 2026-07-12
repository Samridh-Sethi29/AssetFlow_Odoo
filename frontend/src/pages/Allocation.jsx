import { useEffect, useMemo, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { assetsApi, allocationsApi, usersApi, transfersApi } from "../api";
import { useAuth } from "../context/useAuth";

function Allocation() {
  const { user: currentUser } = useAuth();
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [asset, setAsset] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitInfo, setSubmitInfo] = useState("");

  const loadAll = () => {
    setLoading(true);
    const isManager = ["Admin", "Asset Manager", "Department Head"].includes(currentUser?.role);
    const requests = [
      assetsApi.getAssets(),
      usersApi.getUsers(),
      allocationsApi.getAllocations(),
    ];
    if (isManager) {
      requests.push(transfersApi.getTransfers());
    }
    Promise.all(requests)
      .then(([a, e, al, tr]) => {
        setAssets(a || []);
        setEmployees(e || []);
        setAllocations(al || []);
        if (tr) setTransfers(tr || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, [currentUser]);

  // Show ALL assets, but mark state (e.g. Allocated / Maintenance) in label
  const assetOptions = useMemo(() => {
    return assets
      .filter((a) => a.status !== "Disposed" && a.status !== "Retired")
      .map((a) => ({
        label: `${a.assetTag} — ${a.assetName} [${a.status}]`,
        value: a._id,
        status: a.status,
      }));
  }, [assets]);

  const employeeOptions = useMemo(() => {
    return employees
      .filter((e) => e.status === "Active")
      .map((e) => ({
        label: `${e.name} — ${e.department?.departmentName || "Unassigned"}`,
        value: e._id,
      }));
  }, [employees]);

  const selectedAsset = assets.find((a) => a._id === asset);
  const activeAllocationForAsset = allocations.find(
    (al) => al.asset?._id === asset && al.allocationStatus === "Allocated"
  );

  const isConflict = selectedAsset && selectedAsset.status === "Allocated";

  const submitAllocation = async () => {
    setSubmitError("");
    setSubmitInfo("");
    if (!asset || !employee) {
      setSubmitError("Select both an asset and an employee.");
      return;
    }
    setSubmitting(true);
    try {
      await allocationsApi.allocateAsset({ asset, employee, remarks: reason });
      setSubmitInfo("Asset allocated successfully.");
      setAsset(null);
      setEmployee(null);
      setReason("");
      loadAll();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferRequest = async () => {
    setSubmitError("");
    setSubmitInfo("");
    if (!asset || !employee) {
      setSubmitError("Select both an asset and a target employee.");
      return;
    }
    setSubmitting(true);
    try {
      await transfersApi.createTransfer({
        asset,
        toEmployee: employee,
        remarks: reason,
      });
      setSubmitInfo("Asset is already taken. Transfer request raised for holder approval!");
      setAsset(null);
      setEmployee(null);
      setReason("");
      loadAll();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async (allocationId) => {
    try {
      await allocationsApi.returnAsset(allocationId, { assetConditionAtReturn: "Good" });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApproveTransfer = async (id) => {
    try {
      await transfersApi.approveTransfer(id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectTransfer = async (id) => {
    try {
      await transfersApi.rejectTransfer(id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const isManager = ["Admin", "Asset Manager", "Department Head"].includes(currentUser?.role);

  return (
    <div className="space-y-6">
      {/* Allocation Panel */}
      <div className="af-glass rounded-2xl p-6 border border-white/5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-300">Allocate Asset</h2>

        {error && <Message severity="error" text={error} className="mb-4 w-full justify-start" />}

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Asset</span>
          <Dropdown
            value={asset}
            onChange={(e) => setAsset(e.value)}
            options={assetOptions}
            placeholder="Select an asset"
            className="w-full"
            filter
          />
        </label>

        {/* Conflict Warning & Transfer request action */}
        {selectedAsset && isConflict && activeAllocationForAsset && (
          <div className="my-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3.5 space-y-3">
            <div className="flex items-start gap-3">
              <i className="pi pi-exclamation-triangle mt-0.5 text-rose-400" />
              <div>
                <p className="text-sm font-semibold text-rose-300">
                  Asset currently held by {activeAllocationForAsset.employee?.name}.
                </p>
                <p className="text-xs text-rose-400/80">
                  Direct allocation is blocked. Would you like to request a Transfer instead?
                </p>
              </div>
            </div>
            <Button
              label="Request Asset Transfer"
              icon="pi pi-arrow-right-arrow-left"
              size="small"
              className="!bg-rose-500/20 hover:!bg-rose-500/30 text-rose-300 border border-rose-500/30"
              onClick={handleTransferRequest}
              loading={submitting}
            />
          </div>
        )}

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">To Employee</span>
          <Dropdown
            value={employee}
            onChange={(e) => setEmployee(e.value)}
            options={employeeOptions}
            placeholder="Select employee..."
            className="w-full"
            filter
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Reason / Remarks</span>
          <InputTextarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Add context for this allocation or transfer..."
            className="w-full"
          />
        </label>

        {submitError && <Message severity="error" text={submitError} className="mb-4 w-full justify-start" />}
        {submitInfo && <Message severity="success" text={submitInfo} className="mb-4 w-full justify-start" />}

        {!isConflict && (
          <Button label="Allocate Asset" icon="pi pi-check" loading={submitting} onClick={submitAllocation} />
        )}
      </div>

      {/* Transfer Requests Panel (Managers only) */}
      {isManager && transfers.length > 0 && (
        <div className="af-glass rounded-2xl p-6 border border-white/5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-300">Pending Transfer Requests</h2>
          <DataTable value={transfers.filter((t) => t.status === "Pending")} className="text-sm" emptyMessage="No pending transfer requests.">
            <Column header="Asset" body={(r) => <span className="font-semibold text-white">{r.asset?.assetTag} · {r.asset?.assetName}</span>} />
            <Column header="From Holder" body={(r) => r.fromEmployee?.name || "—"} />
            <Column header="To Requested" body={(r) => <span className="font-bold text-indigo-300">{r.toEmployee?.name}</span>} />
            <Column header="Requested By" body={(r) => r.requestedBy?.name || "—"} />
            <Column field="remarks" header="Remarks" />
            <Column
              header="Action"
              body={(r) => (
                <div className="flex gap-2">
                  <Button icon="pi pi-check" label="Approve" className="p-button-sm !bg-emerald-500/10 hover:!bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 !px-2.5 !py-1 text-xs" onClick={() => handleApproveTransfer(r._id)} />
                  <Button icon="pi pi-times" label="Reject" severity="danger" outlined className="p-button-sm !px-2.5 !py-1 text-xs" onClick={() => handleRejectTransfer(r._id)} />
                </div>
              )}
            />
          </DataTable>
        </div>
      )}

      {/* Allocation History */}
      <div className="af-glass rounded-2xl p-6 border border-white/5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-300">Active Allocations & History</h2>
        {loading ? (
          <p className="text-sm text-indigo-400"><i className="pi pi-spin pi-spinner mr-2" />Loading history...</p>
        ) : allocations.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No allocations yet.</p>
        ) : (
          <ul className="divide-y divide-white/5 space-y-1">
            {allocations.map((h) => (
              <li key={h._id} className="flex items-center justify-between py-3.5 text-sm">
                <div>
                  <span className="font-bold text-white block">
                    {h.asset?.assetTag} — {h.asset?.assetName}
                  </span>
                  <span className="text-xs text-slate-500">
                    Allocated to {h.employee?.name} · {new Date(h.allocationDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Tag
                    value={h.allocationStatus}
                    className={
                      h.allocationStatus === "Allocated"
                        ? "af-badge-indigo"
                        : h.allocationStatus === "Overdue"
                        ? "af-badge-rose"
                        : "af-badge-emerald"
                    }
                  />
                  {h.allocationStatus === "Allocated" && isManager && (
                    <Button label="Return" icon="pi pi-undo" size="small" outlined className="!py-1 !px-2.5 text-xs" onClick={() => handleReturn(h._id)} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Allocation;
