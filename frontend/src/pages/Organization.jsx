import { useEffect, useState } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Message } from "primereact/message";
import { departmentsApi, categoriesApi, usersApi, vendorsApi } from "../api";

function StatusTag({ value }) {
  const severity = value === "Active" ? "success" : "warning";
  return (
    <Tag
      value={value}
      className={severity === "success" ? "af-badge-emerald" : "af-badge-amber"}
    />
  );
}

const TABS = ["departments", "categories", "employees", "vendors"];

function Organization() {
  const [tabIndex, setTabIndex] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Edit / Promote states for Employees
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [promoRole, setPromoRole] = useState("Employee");
  const [promoDept, setPromoDept] = useState("");
  const [promoStatus, setPromoStatus] = useState("Active");

  // Dynamic field editor state for categories
  const [customFields, setCustomFields] = useState([]);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      departmentsApi.getDepartments(),
      categoriesApi.getCategories(),
      usersApi.getUsers(),
      vendorsApi.getVendors(),
    ])
      .then(([d, c, e, v]) => {
        setDepartments(d || []);
        setCategories(c || []);
        setEmployees(e || []);
        setVendors(v || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const openAddDialog = () => {
    setSaveError("");
    setCustomFields([]);
    setNewFieldName("");
    setNewFieldType("text");

    const tab = TABS[tabIndex];
    if (tab === "departments") {
      setForm({ departmentName: "", departmentCode: "", location: "", parentDepartment: null, status: "Active" });
    } else if (tab === "categories") {
      setForm({ name: "", description: "" });
    } else if (tab === "employees") {
      setForm({ name: "", email: "", password: "", role: "Employee", department: "" });
    } else if (tab === "vendors") {
      setForm({ vendorName: "", contactPerson: "", email: "", phone: "" });
    }

    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const tab = TABS[tabIndex];
      if (tab === "departments") {
        await departmentsApi.createDepartment(form);
      } else if (tab === "categories") {
        await categoriesApi.createCategory({ ...form, customFields });
      } else if (tab === "employees") {
        await usersApi.createUser(form);
      } else if (tab === "vendors") {
        await vendorsApi.createVendor(form);
      }
      setDialogOpen(false);
      loadAll();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Promote / Update Employee
  const openPromoDialog = (emp) => {
    setSelectedEmp(emp);
    setPromoRole(emp.role);
    setPromoDept(emp.department?._id || "");
    setPromoStatus(emp.status || "Active");
    setSaveError("");
    setPromoDialogOpen(true);
  };

  const handleSavePromo = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await usersApi.updateUser(selectedEmp._id, {
        role: promoRole,
        department: promoDept || null,
        status: promoStatus,
      });
      setPromoDialogOpen(false);
      loadAll();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Add Dynamic Field Helper
  const addCustomField = () => {
    if (!newFieldName.trim()) return;
    setCustomFields([...customFields, { name: newFieldName.trim(), type: newFieldType }]);
    setNewFieldName("");
    setNewFieldType("text");
  };

  const removeCustomField = (index) => {
    setCustomFields(customFields.filter((_, idx) => idx !== index));
  };

  const renderDialogFields = () => {
    const tab = TABS[tabIndex];
    if (tab === "departments") {
      const deptOptions = departments.map((d) => ({ label: d.departmentName, value: d._id }));
      return (
        <>
          <Field label="Department name">
            <InputText className="w-full" value={form.departmentName || ""} onChange={(e) => setForm({ ...form, departmentName: e.target.value })} />
          </Field>
          <Field label="Department code">
            <InputText className="w-full" value={form.departmentCode || ""} onChange={(e) => setForm({ ...form, departmentCode: e.target.value })} />
          </Field>
          <Field label="Location">
            <InputText className="w-full" value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Field label="Parent Department (Optional)">
            <Dropdown
              className="w-full"
              value={form.parentDepartment}
              onChange={(e) => setForm({ ...form, parentDepartment: e.value })}
              options={deptOptions}
              placeholder="Select parent department"
              showClear
            />
          </Field>
        </>
      );
    }
    if (tab === "categories") {
      return (
        <>
          <Field label="Category name">
            <InputText className="w-full" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Description">
            <InputText className="w-full" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>

          {/* Dynamic Fields Editor */}
          <div className="border-t border-white/5 pt-4">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">Category Custom Fields</span>
            <div className="flex gap-2 mb-3">
              <InputText
                placeholder="Field label (e.g. Screen Size)"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="flex-1"
              />
              <Dropdown
                value={newFieldType}
                options={["text", "number", "date"]}
                onChange={(e) => setNewFieldType(e.value)}
                style={{ width: "7.5rem" }}
              />
              <Button icon="pi pi-plus" onClick={addCustomField} />
            </div>

            <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {customFields.map((f, idx) => (
                <li key={idx} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-1.5 text-xs">
                  <span>{f.name} <span className="text-slate-500 font-mono">({f.type})</span></span>
                  <button type="button" onClick={() => removeCustomField(idx)} className="text-rose-400 hover:text-rose-300">
                    <i className="pi pi-trash" />
                  </button>
                </li>
              ))}
              {customFields.length === 0 && (
                <p className="text-xs text-slate-500 py-2 text-center">No custom fields defined yet.</p>
              )}
            </ul>
          </div>
        </>
      );
    }
    if (tab === "employees") {
      const deptOptions = departments.map((d) => ({ label: d.departmentName, value: d._id }));
      return (
        <>
          <Field label="Name">
            <InputText className="w-full" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <InputText className="w-full" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Temporary password">
            <InputText className="w-full" value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Department">
            <Dropdown
              className="w-full"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.value })}
              options={deptOptions}
              placeholder="Select department"
            />
          </Field>
          <Field label="Role">
            <Dropdown
              className="w-full"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.value })}
              options={["Admin", "Asset Manager", "Department Head", "Employee"]}
            />
          </Field>
        </>
      );
    }
    return (
      <>
        <Field label="Vendor name">
          <InputText className="w-full" value={form.vendorName || ""} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} />
        </Field>
        <Field label="Contact person">
          <InputText className="w-full" value={form.contactPerson || ""} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
        </Field>
        <Field label="Email">
          <InputText className="w-full" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Phone">
          <InputText className="w-full" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
      </>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button label="Add Entry" icon="pi pi-plus" onClick={openAddDialog} />
      </div>

      {error && <Message severity="error" text={error} className="mb-4 w-full justify-start" />}

      <div className="af-glass overflow-hidden rounded-2xl p-2 border border-white/5">
        <TabView activeIndex={tabIndex} onTabChange={(e) => setTabIndex(e.index)}>
          <TabPanel header="Departments">
            <DataTable value={departments} loading={loading} className="text-sm" emptyMessage="No departments yet.">
              <Column field="departmentName" header="Department" body={(r) => <span className="font-semibold text-white">{r.departmentName}</span>} />
              <Column field="departmentCode" header="Code" body={(r) => <span className="font-mono text-xs text-slate-400">{r.departmentCode}</span>} />
              <Column field="location" header="Location" />
              <Column header="Manager" body={(r) => r.manager?.name || "—"} />
              <Column field="status" header="Status" body={(r) => <StatusTag value={r.status} />} />
            </DataTable>
          </TabPanel>

          <TabPanel header="Categories">
            <DataTable value={categories} loading={loading} className="text-sm" emptyMessage="No categories yet.">
              <Column field="name" header="Category" body={(r) => <span className="font-semibold text-white">{r.name}</span>} />
              <Column field="description" header="Description" />
              <Column
                header="Custom Fields"
                body={(r) =>
                  r.customFields && r.customFields.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {r.customFields.map((f, idx) => (
                        <Tag key={idx} value={`${f.name} (${f.type})`} className="af-badge-slate text-[10px]" />
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">None</span>
                  )
                }
              />
            </DataTable>
          </TabPanel>

          <TabPanel header="Employees">
            <DataTable value={employees} loading={loading} className="text-sm" emptyMessage="No employees yet.">
              <Column field="name" header="Name" body={(r) => <span className="font-semibold text-white">{r.name}</span>} />
              <Column field="email" header="Email" />
              <Column field="department" header="Department" body={(r) => r.department?.departmentName || "—"} />
              <Column field="role" header="Role" body={(r) => <Tag value={r.role} className="af-badge-indigo" />} />
              <Column field="status" header="Status" body={(r) => <StatusTag value={r.status} />} />
              <Column
                header="Actions"
                body={(r) => (
                  <Button
                    label="Promote / Edit"
                    size="small"
                    outlined
                    icon="pi pi-user-edit"
                    className="!py-1 !px-2.5 text-xs"
                    onClick={() => openPromoDialog(r)}
                  />
                )}
              />
            </DataTable>
          </TabPanel>

          <TabPanel header="Vendors">
            <DataTable value={vendors} loading={loading} className="text-sm" emptyMessage="No vendors yet.">
              <Column field="vendorName" header="Vendor" body={(r) => <span className="font-semibold text-white">{r.vendorName}</span>} />
              <Column field="contactPerson" header="Contact" />
              <Column field="email" header="Email" />
              <Column field="phone" header="Phone" />
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      <Dialog
        header={`Add ${TABS[tabIndex].slice(0, -1)}`}
        visible={dialogOpen}
        onHide={() => setDialogOpen(false)}
        style={{ width: "29rem" }}
      >
        <div className="space-y-4 pt-2">
          {renderDialogFields()}
          {saveError && <Message severity="error" text={saveError} className="w-full justify-start" />}
          <Button label="Save" className="w-full justify-center" loading={saving} onClick={handleSave} />
        </div>
      </Dialog>

      {/* Promotion / Edit Role dialog */}
      <Dialog
        header={`Promote / Edit Employee`}
        visible={promoDialogOpen}
        onHide={() => setPromoDialogOpen(false)}
        style={{ width: "26rem" }}
      >
        {selectedEmp && (
          <div className="space-y-4 pt-2">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-sm">
              <p className="text-slate-400">Employee Name: <span className="text-white font-bold">{selectedEmp.name}</span></p>
              <p className="text-slate-400">Email: <span className="text-white font-mono text-xs">{selectedEmp.email}</span></p>
            </div>
            <Field label="Assign Role">
              <Dropdown
                className="w-full"
                value={promoRole}
                onChange={(e) => setPromoRole(e.value)}
                options={["Admin", "Asset Manager", "Department Head", "Employee"]}
              />
            </Field>
            <Field label="Department">
              <Dropdown
                className="w-full"
                value={promoDept}
                onChange={(e) => setPromoDept(e.value)}
                options={departments.map((d) => ({ label: d.departmentName, value: d._id }))}
                placeholder="Select department"
                showClear
              />
            </Field>
            <Field label="Status">
              <Dropdown
                className="w-full"
                value={promoStatus}
                onChange={(e) => setPromoStatus(e.value)}
                options={["Active", "Inactive"]}
              />
            </Field>
            {saveError && <Message severity="error" text={saveError} className="w-full justify-start" />}
            <Button label="Save Updates" className="w-full justify-center" loading={saving} onClick={handleSavePromo} />
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

export default Organization;
