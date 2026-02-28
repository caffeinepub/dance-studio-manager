import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Camera,
  ChevronDown,
  ClipboardList,
  Edit2,
  Eye,
  Phone,
  Plus,
  Search,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { Batch, Student } from "../backend.d.ts";
import DueCardModal from "../components/DueCardModal";
import { useAuth } from "../contexts/AuthContext";
import {
  useAllBatches,
  useAllStudents,
  useAssignBatch,
  useCreateStudent,
  useMarkStudentInactive,
  useUpdateStudent,
} from "../hooks/useQueries";
import { useStudentPhotos } from "../hooks/useStudentPhotos";
import { getStorageClient } from "../utils/getStorageClient";

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const GUARDIAN_REL_OPTIONS = ["Father", "Mother", "Self", "Other"];

interface StudentFormData {
  name: string;
  dateOfAdmission: string;
  dateOfBirth: string;
  gender: string;
  contactNumber: string;
  studentAadhar: string;
  guardianName: string;
  guardianRelationship: string;
  guardianPhone: string;
  guardianAadhar: string;
  admissionFees: string;
}

const emptyForm: StudentFormData = {
  name: "",
  dateOfAdmission: "",
  dateOfBirth: "",
  gender: "",
  contactNumber: "",
  studentAadhar: "",
  guardianName: "",
  guardianRelationship: "",
  guardianPhone: "",
  guardianAadhar: "",
  admissionFees: "",
};

function calcAgeAtAdmission(dob: string, admissionDate: string): number | null {
  if (!dob || !admissionDate) return null;
  const d = new Date(dob);
  const a = new Date(admissionDate);
  let age = a.getFullYear() - d.getFullYear();
  const m = a.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && a.getDate() < d.getDate())) age--;
  return age >= 0 ? age : null;
}

// ─── Student Form Dialog ─────────────────────────────────────────────────────

function StudentFormDialog({
  open,
  onClose,
  student,
}: {
  open: boolean;
  onClose: () => void;
  student?: Student;
}) {
  const { isAdmin, isStaff } = useAuth();
  const { getPhotoUrl, setPhotoUrl } = useStudentPhotos();
  const [form, setForm] = useState<StudentFormData>(
    student
      ? {
          name: student.name,
          dateOfAdmission: student.dateOfAdmission,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          contactNumber: student.contactNumber,
          studentAadhar: student.studentAadhar,
          guardianName: student.guardianName,
          guardianRelationship: student.guardianRelationship,
          guardianPhone: student.guardianPhone,
          guardianAadhar: student.guardianAadhar,
          admissionFees: "",
        }
      : emptyForm,
  );

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    student ? getPhotoUrl(student.id) : null,
  );
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const isPending =
    createStudent.isPending || updateStudent.isPending || isUploadingPhoto;

  const canUploadPhoto = isAdmin || isStaff;

  const set = (field: keyof StudentFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handlePhotoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Photo must be smaller than 5 MB");
        return;
      }
      setPhotoFile(file);
      const preview = URL.createObjectURL(file);
      setPhotoPreview((prev) => {
        // revoke old object URL if it was created from a file (not a remote URL)
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return preview;
      });
    },
    [],
  );

  const uploadPhoto = async (studentId: bigint): Promise<void> => {
    if (!photoFile) return;
    setIsUploadingPhoto(true);
    try {
      const bytes = new Uint8Array(await photoFile.arrayBuffer());
      const client = await getStorageClient();
      const { hash } = await client.putFile(bytes);
      const url = await client.getDirectURL(hash);
      setPhotoUrl(studentId, url);
    } catch (err) {
      console.error("Photo upload failed:", err);
      toast.error("Photo upload failed — student saved without photo");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Required field validation (all except photo)
    if (!form.name.trim()) return toast.error("Student name is required");
    if (!form.dateOfBirth) return toast.error("Date of birth is required");
    if (!form.dateOfAdmission)
      return toast.error("Date of admission is required");
    if (!form.gender) return toast.error("Gender is required");
    if (!form.contactNumber.trim())
      return toast.error("Contact number is required");
    if (!form.studentAadhar.trim())
      return toast.error("Student Aadhar number is required");
    if (!form.guardianName.trim())
      return toast.error("Guardian name is required");
    if (!form.guardianRelationship)
      return toast.error("Guardian relationship is required");
    if (!form.guardianPhone.trim())
      return toast.error("Guardian phone is required");
    if (!form.guardianAadhar.trim())
      return toast.error("Guardian Aadhar number is required");
    if (!student && !form.admissionFees.trim())
      return toast.error("Admission fees is required");

    const calculatedAge = calcAgeAtAdmission(
      form.dateOfBirth,
      form.dateOfAdmission,
    );

    try {
      if (student) {
        await updateStudent.mutateAsync({
          studentId: student.id,
          name: form.name.trim(),
          dateOfBirth: form.dateOfBirth,
          age: BigInt(calculatedAge ?? 0),
          gender: form.gender,
          contactNumber: form.contactNumber.trim(),
          studentAadhar: form.studentAadhar.trim(),
          guardianName: form.guardianName.trim(),
          guardianRelationship: form.guardianRelationship,
          guardianPhone: form.guardianPhone.trim(),
          guardianAadhar: form.guardianAadhar.trim(),
        });
        // Upload photo if new one selected
        if (photoFile) {
          await uploadPhoto(student.id);
        }
        toast.success("Student updated successfully");
      } else {
        const newId = await createStudent.mutateAsync({
          name: form.name.trim(),
          dateOfAdmission: form.dateOfAdmission,
          dateOfBirth: form.dateOfBirth,
          age: BigInt(calculatedAge ?? 0),
          gender: form.gender,
          contactNumber: form.contactNumber.trim(),
          studentAadhar: form.studentAadhar.trim(),
          guardianName: form.guardianName.trim(),
          guardianRelationship: form.guardianRelationship,
          guardianPhone: form.guardianPhone.trim(),
          guardianAadhar: form.guardianAadhar.trim(),
          admissionFees: BigInt(form.admissionFees || "0"),
        });
        // Upload photo if selected
        if (photoFile) {
          await uploadPhoto(newId);
        }
        toast.success("Student registered successfully");
        setForm(emptyForm);
      }
      onClose();
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">
            {student ? "Edit Student" : "Register New Student"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Photo upload section */}
          {canUploadPhoto && (
            <div className="flex flex-col items-center gap-3 pb-3 border-b border-border">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30 bg-primary/10 flex items-center justify-center">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt={form.name || "Student"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-display font-bold text-primary text-2xl">
                      {form.name ? form.name.charAt(0).toUpperCase() : "?"}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md"
                  title="Upload photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <p className="text-xs text-muted-foreground">
                {photoPreview
                  ? "Click camera icon to change photo"
                  : "Click camera icon to upload photo"}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-foreground text-sm">Student Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Full name"
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Date of Birth *</Label>
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => set("dateOfBirth", e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">
                Date of Admission *
              </Label>
              <Input
                type="date"
                value={form.dateOfAdmission}
                onChange={(e) => set("dateOfAdmission", e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">
                Age at Admission
              </Label>
              <div className="flex h-10 w-full rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground select-none">
                {(() => {
                  const age = calcAgeAtAdmission(
                    form.dateOfBirth,
                    form.dateOfAdmission,
                  );
                  return age !== null
                    ? `${age} year${age !== 1 ? "s" : ""}`
                    : "—";
                })()}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Gender *</Label>
              <Select
                value={form.gender}
                onValueChange={(v) => set("gender", v)}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {GENDER_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">
                Contact Number *
              </Label>
              <Input
                value={form.contactNumber}
                onChange={(e) => set("contactNumber", e.target.value)}
                placeholder="Student's phone"
                className="bg-input border-border"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-foreground text-sm">
                Student Aadhar Card Number *
              </Label>
              <Input
                value={form.studentAadhar}
                onChange={(e) => set("studentAadhar", e.target.value)}
                placeholder="12-digit Aadhar number"
                maxLength={12}
                className="bg-input border-border"
              />
            </div>
            <div className="col-span-2 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">
                Guardian Details
              </p>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-foreground text-sm">Guardian Name *</Label>
              <Input
                value={form.guardianName}
                onChange={(e) => set("guardianName", e.target.value)}
                placeholder="Guardian's full name"
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Relationship *</Label>
              <Select
                value={form.guardianRelationship}
                onValueChange={(v) => set("guardianRelationship", v)}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Relationship" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {GUARDIAN_REL_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">
                Guardian Phone *
              </Label>
              <Input
                value={form.guardianPhone}
                onChange={(e) => set("guardianPhone", e.target.value)}
                placeholder="Guardian's phone"
                className="bg-input border-border"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-foreground text-sm">
                Guardian Aadhar Card Number *
              </Label>
              <Input
                value={form.guardianAadhar}
                onChange={(e) => set("guardianAadhar", e.target.value)}
                placeholder="12-digit Aadhar number"
                maxLength={12}
                className="bg-input border-border"
              />
            </div>
            {/* Admission Fees — only for new student registration */}
            {!student && (
              <div className="col-span-2 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">
                  Fee Details
                </p>
              </div>
            )}
            {!student && (
              <div className="col-span-2 space-y-1.5">
                <Label className="text-foreground text-sm">
                  Admission Fees (₹) *
                </Label>
                <Input
                  type="number"
                  value={form.admissionFees}
                  onChange={(e) => set("admissionFees", e.target.value)}
                  placeholder="e.g. 500"
                  min="0"
                  className="bg-input border-border"
                />
                <p className="text-xs text-muted-foreground">
                  This will appear as a pending due in Fee Collection.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {student ? "Update" : "Register"} Student
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Student Profile Modal ───────────────────────────────────────────────────

function StudentProfileModal({
  student,
  batchName,
  onClose,
}: {
  student: Student;
  batchName: string | null;
  onClose: () => void;
}) {
  const { getPhotoUrl } = useStudentPhotos();
  const photoUrl = getPhotoUrl(student.id);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground sr-only">
            Student Profile
          </DialogTitle>
        </DialogHeader>

        {/* Photo + name */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-primary/40 bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/10">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-display font-bold text-primary text-4xl">
                {student.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="text-center">
            <h2 className="font-display text-xl font-bold text-foreground">
              {student.name}
            </h2>
            {batchName && (
              <Badge className="bg-primary/10 text-primary border-primary/20 mt-1">
                {batchName}
              </Badge>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="space-y-3 border-t border-border pt-4">
          <ProfileRow label="Admission Date" value={student.dateOfAdmission} />
          {student.dateOfBirth && (
            <ProfileRow label="Date of Birth" value={student.dateOfBirth} />
          )}
          <ProfileRow
            label="Age at Admission"
            value={(() => {
              const age = calcAgeAtAdmission(
                student.dateOfBirth,
                student.dateOfAdmission,
              );
              if (age !== null) return `${age} year${age !== 1 ? "s" : ""}`;
              if (student.age) return `${student.age} years`;
              return "—";
            })()}
          />
          <ProfileRow label="Gender" value={student.gender || "—"} />
          {student.contactNumber && (
            <ProfileRow
              label="Contact"
              value={
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {student.contactNumber}
                </span>
              }
            />
          )}
          {student.studentAadhar && (
            <ProfileRow label="Aadhar" value={student.studentAadhar} />
          )}

          <div className="border-t border-border pt-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
              Guardian
            </p>
            <ProfileRow
              label="Name"
              value={`${student.guardianName} (${student.guardianRelationship || "—"})`}
            />
            {student.guardianPhone && (
              <ProfileRow
                label="Phone"
                value={
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {student.guardianPhone}
                  </span>
                }
              />
            )}
            {student.guardianAadhar && (
              <ProfileRow label="Aadhar" value={student.guardianAadhar} />
            )}
          </div>

          {student.admissionFees > 0n && (
            <div className="border-t border-border pt-3">
              <ProfileRow
                label="Admission Fees"
                value={`₹${student.admissionFees.toLocaleString()}`}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-border"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}

// ─── Assign Batch Dialog ─────────────────────────────────────────────────────

function AssignBatchDialog({
  student,
  batches,
  onClose,
}: {
  student: Student;
  batches: Batch[];
  onClose: () => void;
}) {
  const [selectedBatch, setSelectedBatch] = useState<string>(
    student.currentBatchId?.toString() ?? "",
  );
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const assignBatch = useAssignBatch();

  const handleAssign = async () => {
    if (!selectedBatch) return toast.error("Please select a batch");
    try {
      await assignBatch.mutateAsync({
        studentId: student.id,
        batchId: BigInt(selectedBatch),
        startDate,
      });
      toast.success("Batch assigned successfully");
      onClose();
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">
            Assign / Change Batch — {student.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Select Batch</Label>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Choose a batch" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {batches.map((b) => (
                  <SelectItem key={b.id.toString()} value={b.id.toString()}>
                    {b.name} ({b.startTime}–{b.endTime})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">
              Effective From Date
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-input border-border"
            />
            <p className="text-xs text-muted-foreground">
              Fees will be adjusted from this date. Previous batch history is
              preserved.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={assignBatch.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {assignBatch.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Students Page ────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [inactiveStudent, setInactiveStudentState] = useState<Student | null>(
    null,
  );
  const [assignStudent, setAssignStudent] = useState<Student | null>(null);
  const [dueCardStudent, setDueCardStudent] = useState<Student | null>(null);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);

  const { isAdmin } = useAuth();
  const { data: students = [], isLoading } = useAllStudents();
  const { data: batches = [] } = useAllBatches();
  const markInactiveMutation = useMarkStudentInactive();
  const { getPhotoUrl } = useStudentPhotos();

  const filteredStudents = students.filter(
    (s) =>
      s.isActive &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.guardianName.toLowerCase().includes(search.toLowerCase())),
  );

  const getBatchName = (batchId?: bigint) => {
    if (!batchId) return null;
    return batches.find((b) => b.id === batchId)?.name ?? null;
  };

  const handleMarkInactive = async () => {
    if (!inactiveStudent) return;
    try {
      await markInactiveMutation.mutateAsync(inactiveStudent.id);
      toast.success(`${inactiveStudent.name} marked as inactive`);
      setInactiveStudentState(null);
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Students
          </h1>
          <p className="text-muted-foreground text-sm">
            {students.filter((s) => s.isActive).length} active student
            {students.filter((s) => s.isActive).length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students by name or guardian..."
          className="pl-9 bg-card border-border"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">
            {search
              ? "No students match your search"
              : "No students registered yet"}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {!search && "Click 'Add Student' to get started"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredStudents.map((student) => {
            const batchName = getBatchName(student.currentBatchId);
            const photoUrl = getPhotoUrl(student.id);
            return (
              <div
                key={student.id.toString()}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Avatar + student info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => setProfileStudent(student)}
                      className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                      title="View profile"
                      aria-label={`View profile of ${student.name}`}
                    >
                      <Avatar className="w-10 h-10 border border-primary/20">
                        {photoUrl ? (
                          <AvatarImage
                            src={photoUrl}
                            alt={student.name}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary font-display font-bold text-sm">
                          {student.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => setProfileStudent(student)}
                        className="font-medium text-foreground truncate block hover:text-primary transition-colors text-left"
                      >
                        {student.name}
                      </button>
                      <p className="text-muted-foreground text-xs truncate">
                        {student.guardianName} ({student.guardianRelationship})
                        · {student.guardianPhone}
                      </p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:flex-nowrap">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      Adm: {student.dateOfAdmission}
                    </span>
                    {batchName ? (
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20 text-xs"
                      >
                        {batchName}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        No Batch
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProfileStudent(student)}
                      className="text-muted-foreground hover:text-primary h-8 w-8 p-0"
                      title="View Profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDueCardStudent(student)}
                      className="text-muted-foreground hover:text-foreground h-8 px-2 text-xs gap-1"
                      title="View Due Card"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Due Card</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAssignStudent(student)}
                      className="text-muted-foreground hover:text-primary h-8 px-2 text-xs gap-1"
                      title="Assign Batch"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Batch</span>
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditStudent(student)}
                        className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInactiveStudentState(student)}
                        className="text-muted-foreground hover:text-warning h-8 w-8 p-0"
                        title="Mark Inactive"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      {(formOpen || editStudent) && (
        <StudentFormDialog
          open={formOpen || !!editStudent}
          onClose={() => {
            setFormOpen(false);
            setEditStudent(null);
          }}
          student={editStudent ?? undefined}
        />
      )}

      {/* Assign Batch Dialog */}
      {assignStudent && (
        <AssignBatchDialog
          student={assignStudent}
          batches={batches}
          onClose={() => setAssignStudent(null)}
        />
      )}

      {/* Student Profile Modal */}
      {profileStudent && (
        <StudentProfileModal
          student={profileStudent}
          batchName={getBatchName(profileStudent.currentBatchId)}
          onClose={() => setProfileStudent(null)}
        />
      )}

      {/* Mark Inactive Confirmation */}
      <AlertDialog
        open={!!inactiveStudent}
        onOpenChange={(o) => !o && setInactiveStudentState(null)}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Mark Student Inactive?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will mark{" "}
              <strong className="text-foreground">
                {inactiveStudent?.name}
              </strong>{" "}
              as inactive. All their fee history, due cards, and records will be
              preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkInactive}
              className="bg-warning/90 text-warning-foreground hover:bg-warning"
            >
              Mark Inactive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Due Card Modal */}
      {dueCardStudent && (
        <DueCardModal
          student={dueCardStudent}
          onClose={() => setDueCardStudent(null)}
        />
      )}
    </div>
  );
}
