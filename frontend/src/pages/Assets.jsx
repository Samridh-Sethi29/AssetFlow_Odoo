import { useEffect, useMemo, useState } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Sidebar } from "primereact/sidebar";
import { Message } from "primereact/message";
import { assetsApi, categoriesApi, departmentsApi, vendorsApi } from "../api";

const STATUS_OPTIONS = ["Available", "Allocated", "Reserved", "Maintenance", "Lost", "Retired", "Disposed"];
const CONDITION_OPTIONS = ["Excellent", "Good", "Fair", "Poor", "Damaged"];

const EMPTY_ASSET = {
  assetTag: "",
  assetName: "",
  category: "",
  vendor: "",
  department: "",
  brand: "",
  model: "",
  serialNumber: "",
  location: "",
  purchaseDate: "",
  purchasePrice: 0,
  warrantyStart: "",
  warrantyEnd: "",
  remarks: "",
};

function getStatusBadge(status) {
  if (status === "Available") return "af-badge-emerald";
  if (status === "Allocated") return "af-badge-indigo";
  if (status === "Maintenance") return "af-badge-amber";
  if (status === "Lost" || status === "Disposed") return "af-badge-rose";
  return "af-badge-slate";
}

function Assets() {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtering states
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState(null);

  // Dialog / Form states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_ASSET);
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Detail Sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      assetsApi.getAssets(),
      categoriesApi.getCategories(),
      departmentsApi.getDepartments(),
      vendorsApi.getVendors(),
    ])
      .then(([a, c, d, v]) => {
        setAssets(a || []);
        setCategories(c || []);
        setDepartments(d || []);
        setVendors(v || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const categoryOptions = useMemo(() => categories.map((c) => ({ label: c.name, value: c._id })), [categories]);
  const departmentOptions = useMemo(() => departments.map((d) => ({ label: d.departmentName, value: d._id })), [departments]);
  const vendorOptions = useMemo(() => vendors.map((v) => ({ label: v.vendorName, value: v._id })), [vendors]);

  const selectedCategoryDoc = useMemo(() => {
    return categories.find((c) => c._id === form.category);
  }, [form.category, categories]);

  const filtered = assets.filter((a) => {
    const matchesSearch =
      !search ||
      a.assetTag?.toLowerCase().includes(search.toLowerCase()) ||
      a.assetName?.toLowerCase().includes(search.toLowerCase()) ||
      a.serialNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || a.category?._id === categoryFilter;
    const matchesStatus = !statusFilter || a.status === statusFilter;
    const matchesDepartment = !departmentFilter || a.department?._id === departmentFilter;
    return matchesSearch && matchesCategory && matchesStatus && matchesDepartment;
  });

  const openRegisterDialog = () => {
    setForm(EMPTY_ASSET);
    setCustomFieldValues({});
    setImageFile(null);
    setDocFile(null);
    setSaveError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.assetTag || !form.assetName || !form.category) {
      setSaveError("Asset tag, name and category are required.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          formData.append(key, val);
        }
      });

      // Append custom fields as stringified map
      formData.append("customValues", JSON.stringify(customFieldValues));

      if (imageFile) {
        formData.append("images", imageFile);
      }
      if (docFile) {
        formData.append("documents", docFile);
      }

      await assetsApi.createAsset(formData);
      setDialogOpen(false);
      loadAll();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Details and Timeline drawer
  const handleRowClick = (e) => {
    const asset = e.data;
    setSelectedAsset(asset);
    setSidebarOpen(true);
    setHistory([]);
    setHistoryLoading(true);

    assetsApi
      .getAssetHistory(asset._id)
      .then((data) => setHistory(data || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  };

  const handleDispose = async (assetId) => {
    if (!window.confirm("Are you sure you want to mark this asset as disposed?")) return;
    try {
      await assetsApi.deleteAsset(assetId);
      setSidebarOpen(false);
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions */}
      <div className="flex items-center gap-3">
        <span className="p-input-icon-left relative flex-1">
          <i className="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <InputText
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tag, name or serial..."
            className="w-full !pl-10"
          />
        </span>
        <Button label="Register Asset" icon="pi pi-plus" onClick={openRegisterDialog} />
      </div>

      {error && <Message severity="error" text={error} className="mb-4 w-full justify-start" />}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Dropdown
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.value)}
          options={categoryOptions}
          placeholder="Category — all"
          showClear
          className="w-full"
        />
        <Dropdown
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.value)}
          options={STATUS_OPTIONS}
          placeholder="Status — all"
          showClear
          className="w-full"
        />
        <Dropdown
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.value)}
          options={departmentOptions}
          placeholder="Department — all"
          showClear
          className="w-full"
        />
      </div>

      {/* Data Directory */}
      <div className="af-glass overflow-hidden rounded-2xl border border-white/5">
        <DataTable
          value={filtered}
          loading={loading}
          className="text-sm"
          emptyMessage="No assets match your filters."
          onRowClick={handleRowClick}
        >
          <Column field="assetTag" header="Tag" body={(r) => <span className="font-mono text-xs font-semibold text-indigo-300">{r.assetTag}</span>} />
          <Column field="assetName" header="Name" body={(r) => <span className="font-bold text-white">{r.assetName}</span>} />
          <Column header="Category" body={(r) => r.category?.name || "—"} />
          <Column
            field="status"
            header="Status"
            body={(r) => <Tag value={r.status} className={getStatusBadge(r.status)} />}
          />
          <Column field="location" header="Location" />
          <Column field="condition" header="Condition" body={(r) => r.condition || "Excellent"} />
        </DataTable>
      </div>

      {/* Create Dialog */}
      <Dialog header="Register Asset" visible={dialogOpen} onHide={() => setDialogOpen(false)} style={{ width: "32rem" }}>
        <div className="space-y-4 pt-2 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Asset tag *">
              <InputText className="w-full" value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} placeholder="e.g. AF-0001" />
            </Field>
            <Field label="Asset name *">
              <InputText className="w-full" value={form.assetName} onChange={(e) => setForm({ ...form, assetName: e.target.value })} placeholder="e.g. Macbook Pro" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category *">
              <Dropdown className="w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.value })} options={categoryOptions} placeholder="Select category" />
            </Field>
            <Field label="Department">
              <Dropdown className="w-full" value={form.department} onChange={(e) => setForm({ ...form, department: e.value })} options={departmentOptions} placeholder="Select department" showClear />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Brand">
              <InputText className="w-full" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </Field>
            <Field label="Model">
              <InputText className="w-full" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Serial number">
              <InputText className="w-full" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
            </Field>
            <Field label="Vendor">
              <Dropdown className="w-full" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.value })} options={vendorOptions} placeholder="Select vendor" showClear />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Purchase cost">
              <InputText type="number" className="w-full" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: parseFloat(e.target.value) || 0 })} />
            </Field>
            <Field label="Purchase date">
              <InputText type="date" className="w-full" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Warranty start">
              <InputText type="date" className="w-full" value={form.warrantyStart} onChange={(e) => setForm({ ...form, warrantyStart: e.target.value })} />
            </Field>
            <Field label="Warranty end">
              <InputText type="date" className="w-full" value={form.warrantyEnd} onChange={(e) => setForm({ ...form, warrantyEnd: e.target.value })} />
            </Field>
          </div>

          <Field label="Location">
            <InputText className="w-full" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Office 302" />
          </Field>

          {/* Dynamic Fields */}
          {selectedCategoryDoc && selectedCategoryDoc.customFields && selectedCategoryDoc.customFields.length > 0 && (
            <div className="border-t border-white/5 pt-4 space-y-4">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">Category-Specific Details</span>
              {selectedCategoryDoc.customFields.map((f, idx) => (
                <Field key={idx} label={f.name}>
                  <InputText
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    className="w-full"
                    value={customFieldValues[f.name] || ""}
                    onChange={(e) => setCustomFieldValues({ ...customFieldValues, [f.name]: e.target.value })}
                  />
                </Field>
              ))}
            </div>
          )}

          {/* File Uploads */}
          <div className="border-t border-white/5 pt-4 space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">Photos & Documentation</span>
            <Field label="Upload photo (JPEG / PNG / WebP)">
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-300 hover:file:bg-indigo-500/20" />
            </Field>
            <Field label="Upload document (PDF / DOC)">
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setDocFile(e.target.files[0])} className="text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-300 hover:file:bg-indigo-500/20" />
            </Field>
          </div>

          <Field label="Remarks">
            <InputText className="w-full" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
          </Field>

          {saveError && <Message severity="error" text={saveError} className="w-full justify-start" />}
          <Button label="Register Asset" className="w-full justify-center mt-4" loading={saving} onClick={handleSave} />
        </div>
      </Dialog>

      {/* Detail Sidebar / Drawer */}
      <Sidebar visible={sidebarOpen} position="right" onHide={() => setSidebarOpen(false)} style={{ width: "30rem" }} className="af-glass text-slate-200 border-l border-white/5">
        {selectedAsset && (
          <div className="flex flex-col h-full justify-between pb-6 max-h-screen overflow-y-auto pr-1">
            <div className="space-y-6">
              {/* Image & Title */}
              <div>
                {selectedAsset.images && selectedAsset.images.length > 0 ? (
                  <img
                    src={`http://localhost:5001${selectedAsset.images[0]}`}
                    alt="Asset"
                    className="w-full h-44 object-cover rounded-2xl mb-4 border border-white/5"
                  />
                ) : (
                  <div className="w-full h-24 bg-white/5 rounded-2xl mb-4 border border-dashed border-white/10 flex items-center justify-center text-slate-500">
                    <i className="pi pi-image text-3xl" />
                  </div>
                )}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-sm text-indigo-300 font-bold">{selectedAsset.assetTag}</span>
                  <Tag value={selectedAsset.status} className={getStatusBadge(selectedAsset.status)} />
                </div>
                <h2 className="text-xl font-bold text-white leading-tight">{selectedAsset.assetName}</h2>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 text-xs">
                <div>
                  <p className="text-slate-400 uppercase tracking-wider font-bold mb-0.5">Category</p>
                  <p className="text-slate-200 font-semibold">{selectedAsset.category?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase tracking-wider font-bold mb-0.5">Department</p>
                  <p className="text-slate-200 font-semibold">{selectedAsset.department?.departmentName || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase tracking-wider font-bold mb-0.5">Brand / Model</p>
                  <p className="text-slate-200 font-semibold">{selectedAsset.brand ? `${selectedAsset.brand} ${selectedAsset.model}` : "—"}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase tracking-wider font-bold mb-0.5">Serial number</p>
                  <p className="text-slate-200 font-mono">{selectedAsset.serialNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase tracking-wider font-bold mb-0.5">Location</p>
                  <p className="text-slate-200 font-semibold">{selectedAsset.location || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase tracking-wider font-bold mb-0.5">Condition</p>
                  <p className="text-slate-200 font-semibold">{selectedAsset.condition || "Excellent"}</p>
                </div>
              </div>

              {/* Dynamic properties */}
              {selectedAsset.customValues && selectedAsset.customValues.size > 0 && (
                <div className="border-t border-white/5 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">Category-Specific Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {Array.from(selectedAsset.customValues.entries()).map(([key, val]) => (
                      <div key={key}>
                        <p className="text-slate-400 uppercase tracking-wider font-bold mb-0.5">{key}</p>
                        <p className="text-slate-200 font-semibold">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* History Timeline */}
              <div className="border-t border-white/5 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Asset Activity History</h3>
                {historyLoading ? (
                  <p className="text-xs text-indigo-400"><i className="pi pi-spin pi-spinner mr-2" />Loading history...</p>
                ) : history.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No history records found.</p>
                ) : (
                  <div className="relative pl-4 border-l border-white/5 space-y-4 text-xs">
                    {history.map((h, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500 border-2 border-[#0f172a]" />
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-slate-200">{h.action}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">{new Date(h.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-400">{h.description}</p>
                        {h.performedBy && (
                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">by {h.performedBy.name}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {selectedAsset.status !== "Disposed" && (
              <div className="mt-8 pt-4 border-t border-white/5 flex gap-2">
                <Button label="Dispose Asset" severity="danger" outlined className="flex-1 text-xs" onClick={() => handleDispose(selectedAsset._id)} />
              </div>
            )}
          </div>
        )}
      </Sidebar>
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

export default Assets;
