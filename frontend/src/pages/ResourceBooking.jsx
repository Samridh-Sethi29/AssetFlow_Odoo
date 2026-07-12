import { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { Tag } from "primereact/tag";
import { assetsApi, bookingsApi } from "../api";

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getBookingStatusBadge(status) {
  if (status === "Approved") return "af-badge-indigo";
  if (status === "Pending") return "af-badge-amber";
  if (status === "Rejected") return "af-badge-rose";
  return "af-badge-emerald";
}

const HOURS = [
  { label: "09:00 AM - 10:00 AM", startHour: 9, endHour: 10 },
  { label: "10:00 AM - 11:00 AM", startHour: 10, endHour: 11 },
  { label: "11:00 AM - 12:00 PM", startHour: 11, endHour: 12 },
  { label: "12:00 PM - 01:00 PM", startHour: 12, endHour: 13 },
  { label: "01:00 PM - 02:00 PM", startHour: 13, endHour: 14 },
  { label: "02:00 PM - 03:00 PM", startHour: 14, endHour: 15 },
  { label: "03:00 PM - 04:00 PM", startHour: 15, endHour: 16 },
  { label: "04:00 PM - 05:00 PM", startHour: 16, endHour: 17 },
  { label: "05:00 PM - 06:00 PM", startHour: 17, endHour: 18 },
];

function ResourceBooking() {
  const [assets, setAssets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ startTime: "", endTime: "", purpose: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const loadAll = () => {
    setLoading(true);
    Promise.all([assetsApi.getAssets(), bookingsApi.getBookings()])
      .then(([a, b]) => {
        setAssets(a || []);
        setBookings(b || []);
        if (!selectedAsset && a?.length) setSelectedAsset(a[0]._id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const assetOptions = useMemo(() => {
    // Only display assets that are shared/bookable, or all for convenience
    return assets.map((a) => ({ label: `${a.assetTag} — ${a.assetName}`, value: a._id }));
  }, [assets]);

  const activeAsset = assets.find((a) => a._id === selectedAsset);

  // Filter and sort bookings for selected asset and date
  const selectedDateBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (b.asset?._id !== selectedAsset) return false;
      const bDate = new Date(b.startTime).toISOString().split("T")[0];
      return bDate === selectedDate && b.status !== "Rejected";
    });
  }, [bookings, selectedAsset, selectedDate]);

  // Construct Visual Hour Slots for Schedule Grid
  const hourlySlots = useMemo(() => {
    return HOURS.map((slot) => {
      const slotStart = new Date(selectedDate);
      slotStart.setHours(slot.startHour, 0, 0, 0);

      const slotEnd = new Date(selectedDate);
      slotEnd.setHours(slot.endHour, 0, 0, 0);

      // Check if any booking overlaps with this hourly slot
      const overlappingBooking = selectedDateBookings.find((b) => {
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        return bStart < slotEnd && bEnd > slotStart;
      });

      return {
        ...slot,
        booking: overlappingBooking || null,
        slotStart,
        slotEnd,
      };
    });
  }, [selectedDate, selectedDateBookings]);

  const openBookingDialog = (slot) => {
    // Format dates to fit datetime-local inputs
    const startStr = new Date(slot.slotStart.getTime() - slot.slotStart.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    const endStr = new Date(slot.slotEnd.getTime() - slot.slotEnd.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setForm({
      startTime: startStr,
      endTime: endStr,
      purpose: "",
    });
    setSaveError("");
    setDialogOpen(true);
  };

  const handleBook = async () => {
    if (!selectedAsset || !form.startTime || !form.endTime || !form.purpose) {
      setSaveError("Fill in start time, end time and purpose.");
      return;
    }
    if (new Date(form.endTime) <= new Date(form.startTime)) {
      setSaveError("End time must be later than start time.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await bookingsApi.createBooking({
        asset: selectedAsset,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        purpose: form.purpose,
      });
      setDialogOpen(false);
      loadAll();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <Message severity="error" text={error} className="mb-4 w-full justify-start" />}

      {/* Selectors */}
      <div className="af-glass rounded-2xl p-6 border border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Select Resource</label>
            <Dropdown
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.value)}
              options={assetOptions}
              className="w-full"
              filter
              placeholder="Select a resource to book"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Select Date</label>
            <InputText
              type="date"
              className="w-full"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Calendar Slots Grid */}
      <div className="af-glass rounded-2xl p-6 border border-white/5">
        <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-slate-300">
          Daily Schedule Timeline for {activeAsset ? activeAsset.assetName : ""}
        </h2>

        {loading ? (
          <p className="text-sm text-indigo-400"><i className="pi pi-spin pi-spinner mr-2" />Loading schedule...</p>
        ) : assetOptions.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500 font-semibold border border-dashed border-white/10 rounded-xl bg-white/5 p-4">
            <i className="pi pi-exclamation-circle text-amber-400 text-2xl mb-2.5 block" />
            No resources are registered in the directory yet.
            <p className="text-xs text-slate-500 font-medium mt-1">Please go to the Assets page to register bookable resources.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hourlySlots.map((slot, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <span className="w-48 shrink-0 text-xs font-mono font-bold text-slate-500">
                  {slot.label}
                </span>

                {slot.booking ? (
                  <div className="flex-1 flex items-center justify-between rounded-xl bg-white/5 border border-white/5 px-4 py-3 text-sm">
                    <div>
                      <span className="font-bold text-slate-300 block">{slot.booking.purpose}</span>
                      <span className="text-xs text-slate-500 font-semibold">Booked by {slot.booking.employee?.name || "Staff"}</span>
                    </div>
                    <Tag value={slot.booking.status} className={getBookingStatusBadge(slot.booking.status)} />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between rounded-xl bg-indigo-500/5 border border-dashed border-indigo-500/20 px-4 py-3 text-sm hover:bg-indigo-500/10 transition duration-150">
                    <span className="text-indigo-300 font-semibold text-xs uppercase tracking-wider">Available Slot</span>
                    <Button
                      label="Book Slot"
                      icon="pi pi-calendar-plus"
                      size="small"
                      className="!py-1 !px-3 text-xs"
                      onClick={() => openBookingDialog(slot)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Form Dialog */}
      <Dialog header="Book Resource Slot" visible={dialogOpen} onHide={() => setDialogOpen(false)} style={{ width: "26rem" }}>
        <div className="space-y-4 pt-2">
          <Field label="Start time">
            <InputText type="datetime-local" className="w-full" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          </Field>
          <Field label="End time">
            <InputText type="datetime-local" className="w-full" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </Field>
          <Field label="Purpose">
            <InputText className="w-full" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Project Sync Meeting" />
          </Field>
          {saveError && <Message severity="error" text={saveError} className="w-full justify-start" />}
          <Button label="Confirm Booking" className="w-full justify-center mt-2" loading={saving} onClick={handleBook} />
        </div>
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

export default ResourceBooking;
