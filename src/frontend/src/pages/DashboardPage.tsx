import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  CheckSquare,
  ChevronRight,
  Clock,
  Music,
  Plus,
  Star,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Page } from "../App";
import type { Batch, SoloProgramme } from "../backend.d.ts";
import { useAuth } from "../contexts/AuthContext";
import {
  useAllSoloRegistrations,
  useAllStudents,
  useBatchIds,
  useBatchesByDay,
  useSoloProgrammesByDay,
  useStudentsInBatch,
} from "../hooks/useQueries";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type ScheduleItem =
  | { kind: "batch"; batch: Batch }
  | { kind: "solo"; programme: SoloProgramme };

function timeToMinutes(time: string): number {
  if (!time || !time.includes(":")) return -1;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function nowToMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

type TimeStatus = "past" | "current" | "next" | "future";

// ─── Batch Student Modal ──────────────────────────────────────────────────────

function BatchStudentModal({
  batch,
  onClose,
  onNavigate,
}: {
  batch: Batch;
  onClose: () => void;
  onNavigate: (page: Page) => void;
}) {
  const { data: students = [], isLoading } = useStudentsInBatch(batch.id);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Music className="w-3.5 h-3.5 text-primary" />
            </div>
            {batch.name} — Students
          </DialogTitle>
        </DialogHeader>
        <div className="flex-shrink-0">
          <Button
            onClick={() => {
              onNavigate("students");
              onClose();
            }}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <Plus className="w-4 h-4" />
            Add / Assign Student to this Batch
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="space-y-2 py-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                No students in this batch yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {students.map((student) => (
                <div
                  key={student.id.toString()}
                  className="flex items-center gap-3 bg-secondary/30 border border-border rounded-lg px-3 py-2.5"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary text-xs">
                      {student.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {student.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {student.fatherName} · {student.fatherMobile}
                    </p>
                  </div>
                  <Badge
                    className={`text-[10px] px-1.5 py-0 h-4 flex-shrink-0 ${student.isActive ? "bg-green-500/15 text-green-600 border-green-500/20" : "bg-muted text-muted-foreground border-border"}`}
                  >
                    {student.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 pt-2 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-border gap-2"
          >
            <X className="w-4 h-4" /> Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BatchStudentCount({ batchId }: { batchId: bigint }) {
  const { data: students = [], isLoading } = useStudentsInBatch(batchId);
  if (isLoading) return <Skeleton className="w-6 h-4 inline-block" />;
  return (
    <span className="font-semibold text-foreground">{students.length}</span>
  );
}

function ScheduleCard({
  item,
  status,
  soloRegistrationCount,
  onClick,
  onAttendance,
}: {
  item: ScheduleItem;
  status: TimeStatus;
  soloRegistrationCount: number;
  onClick?: () => void;
  onAttendance?: () => void;
}) {
  const isNext = status === "next";
  const isCurrent = status === "current";
  const isPast = status === "past";

  let ringClass = "";
  if (isCurrent)
    ringClass =
      "ring-2 ring-green-500/70 shadow-[0_0_20px_rgba(34,197,94,0.3)]";
  if (isNext)
    ringClass =
      "ring-2 ring-primary/80 shadow-[0_0_20px_oklch(0.62_0.22_27_/_0.35)]";

  const containerClass = [
    "relative rounded-xl border transition-all duration-300 p-4",
    isPast
      ? "opacity-50 bg-card/50 border-border/50"
      : "bg-card border-border hover:border-primary/30",
    ringClass,
  ]
    .filter(Boolean)
    .join(" ");

  if (item.kind === "batch") {
    const { batch } = item;
    return (
      <div className={containerClass}>
        {isNext && (
          <div className="absolute -top-2.5 left-3">
            <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0 h-5 shadow-glow">
              NEXT
            </Badge>
          </div>
        )}
        {isCurrent && (
          <div className="absolute -top-2.5 left-3">
            <Badge className="bg-green-600 text-white text-[10px] px-2 py-0 h-5">
              NOW
            </Badge>
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            className={`flex items-start gap-3 flex-1 min-w-0 text-left ${onClick ? "cursor-pointer" : ""}`}
            onClick={onClick}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isPast ? "bg-muted/50" : isCurrent ? "bg-green-600/20 border border-green-600/30" : isNext ? "bg-primary/20 border border-primary/30" : "bg-muted/60"}`}
            >
              <Music
                className={`w-4 h-4 ${isPast ? "text-muted-foreground/50" : isCurrent ? "text-green-500" : isNext ? "text-primary" : "text-muted-foreground"}`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`font-display font-semibold text-sm leading-tight ${isPast ? "text-muted-foreground" : "text-foreground"}`}
                >
                  {batch.name}
                </h3>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 border-border/60 text-muted-foreground"
                >
                  Batch
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-xs">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span>
                  {batch.startTime} – {batch.endTime}
                </span>
              </div>
            </div>
          </button>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-primary/20 text-xs"
            >
              ₹{batch.monthlyFees.toString()}/mo
            </Badge>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Users className="w-3 h-3" />
              <BatchStudentCount batchId={batch.id} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-border/50 items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {batch.daysOfWeek.map((d) => (
              <span
                key={d.toString()}
                className="text-xs bg-secondary/60 text-secondary-foreground px-1.5 py-0.5 rounded"
              >
                {DAYS_SHORT[Number(d)]}
              </span>
            ))}
          </div>
          {onAttendance && !isPast && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] px-2 border-primary/40 text-primary hover:bg-primary/10 gap-1"
              onClick={(e) => {
                e.stopPropagation();
                onAttendance();
              }}
              data-ocid="dashboard.batch.attendance.button"
            >
              <CheckSquare className="w-3 h-3" />
              Take Attendance
            </Button>
          )}
        </div>
      </div>
    );
  }

  const { programme } = item;
  const hasTime =
    !!programme.scheduleTime && programme.scheduleTime.trim() !== "";

  return (
    <div className={containerClass}>
      {isNext && hasTime && (
        <div className="absolute -top-2.5 left-3">
          <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0 h-5 shadow-glow">
            NEXT
          </Badge>
        </div>
      )}
      {isCurrent && hasTime && (
        <div className="absolute -top-2.5 left-3">
          <Badge className="bg-green-600 text-white text-[10px] px-2 py-0 h-5">
            NOW
          </Badge>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isPast ? "bg-muted/50" : isCurrent && hasTime ? "bg-green-600/20 border border-green-600/30" : isNext && hasTime ? "bg-primary/20 border border-primary/30" : "bg-primary/10 border border-primary/20"}`}
          >
            <Star
              className={`w-4 h-4 ${isPast ? "text-muted-foreground/50" : isCurrent && hasTime ? "text-green-500" : "text-primary"}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`font-display font-semibold text-sm leading-tight ${isPast ? "text-muted-foreground" : "text-foreground"}`}
              >
                {programme.name}
              </h3>
              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/15 text-primary border border-primary/25">
                Solo
              </Badge>
            </div>
            {hasTime ? (
              <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-xs">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span>{programme.scheduleTime}</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1 italic">
                Time not scheduled
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {soloRegistrationCount > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Users className="w-3 h-3" />
              <span className="font-semibold text-foreground">
                {soloRegistrationCount}
              </span>
            </div>
          )}
          {programme.scheduleDays.length > 0 && (
            <div className="flex flex-wrap gap-0.5 justify-end">
              {programme.scheduleDays.map((d) => (
                <span
                  key={d.toString()}
                  className="text-[10px] bg-primary/10 text-primary/80 px-1 py-0.5 rounded"
                >
                  {DAYS_SHORT[Number(d)]}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────────

interface DashboardPageProps {
  onNavigate: (page: Page) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const today = new Date();
  const todayDay = today.getDay();
  const todayStr = today.toISOString().split("T")[0];
  const { currentUser } = useAuth();
  const canTakeAttendance =
    currentUser?.role === "admin" || currentUser?.role === "staff";

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [currentMinutes, setCurrentMinutes] = useState<number>(nowToMinutes());
  const [selectedBatchForModal, setSelectedBatchForModal] =
    useState<Batch | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMinutes(nowToMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const selectedDayOfWeek = new Date(`${selectedDate}T12:00:00`).getDay();
  const isToday = selectedDate === todayStr;

  const { data: todayBatches = [], isLoading: todayBatchLoading } =
    useBatchesByDay(todayDay);
  const { data: selectedBatches = [], isLoading: selectedBatchLoading } =
    useBatchesByDay(selectedDayOfWeek);
  const { data: todaySoloProgs = [], isLoading: todaySoloLoading } =
    useSoloProgrammesByDay(todayDay);
  const { data: selectedSoloProgs = [], isLoading: selectedSoloLoading } =
    useSoloProgrammesByDay(selectedDayOfWeek);
  const { data: allStudentsData = [], isLoading: studentsLoading } =
    useAllStudents();
  const activeStudentCount = allStudentsData.filter((s) => s.isActive).length;
  const { data: batchIds = [], isLoading: batchesLoading } = useBatchIds();
  const { data: allSoloRegistrations = [] } = useAllSoloRegistrations();

  const displayBatches = isToday ? todayBatches : selectedBatches;
  const displaySolos = isToday ? todaySoloProgs : selectedSoloProgs;
  const displayLoading = isToday
    ? todayBatchLoading || todaySoloLoading
    : selectedBatchLoading || selectedSoloLoading;

  const filteredSolos = displaySolos.filter((prog) => {
    const dateStr = selectedDate;
    return prog.startDate <= dateStr && prog.endDate >= dateStr;
  });

  const batchItems: ScheduleItem[] = displayBatches.map((b) => ({
    kind: "batch",
    batch: b,
  }));
  const soloItems: ScheduleItem[] = filteredSolos.map((p) => ({
    kind: "solo",
    programme: p,
  }));

  const getItemStartTime = (item: ScheduleItem): string => {
    if (item.kind === "batch") return item.batch.startTime;
    return item.programme.scheduleTime || "";
  };

  const timedItems = [...batchItems, ...soloItems].filter(
    (i) => getItemStartTime(i).trim() !== "",
  );
  const untimedItems = [...batchItems, ...soloItems].filter(
    (i) => getItemStartTime(i).trim() === "",
  );

  timedItems.sort(
    (a, b) =>
      timeToMinutes(getItemStartTime(a)) - timeToMinutes(getItemStartTime(b)),
  );

  const getItemEndTime = (item: ScheduleItem): string => {
    if (item.kind === "batch") return item.batch.endTime;
    return "";
  };

  let nextIndex = -1;
  if (isToday) {
    nextIndex = timedItems.findIndex((item) => {
      const start = timeToMinutes(getItemStartTime(item));
      const end = timeToMinutes(getItemEndTime(item));
      const isPast = end !== -1 && end < currentMinutes;
      const isCurrent =
        start <= currentMinutes && (end === -1 || end >= currentMinutes);
      return !isPast && !isCurrent && start > currentMinutes;
    });
  }

  const getStatus = (item: ScheduleItem, index: number): TimeStatus => {
    if (!isToday) return "future";
    const start = timeToMinutes(getItemStartTime(item));
    const end = timeToMinutes(getItemEndTime(item));
    if (end !== -1 && end < currentMinutes) return "past";
    if (start <= currentMinutes && (end === -1 || end >= currentMinutes))
      return "current";
    if (index === nextIndex) return "next";
    return "future";
  };

  const getSoloRegistrationCount = (prog: SoloProgramme): number =>
    allSoloRegistrations.filter(
      (r) => r.programmeId.toString() === prog.id.toString(),
    ).length;

  const formattedDate = today.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const allItems = [...timedItems, ...untimedItems];

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Date Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase mb-1">
            Today
          </p>
          <p className="font-display text-xl sm:text-2xl font-bold text-foreground">
            {DAYS[todayDay]},{" "}
            <span className="text-primary">
              {today.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {formattedDate}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-sm text-foreground outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                Total Students
              </p>
              {studentsLoading ? (
                <Skeleton className="w-12 h-6 mt-0.5" />
              ) : (
                <p className="font-display text-2xl font-bold text-foreground">
                  {activeStudentCount}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center">
              <Music className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                Total Batches
              </p>
              {batchesLoading ? (
                <Skeleton className="w-12 h-6 mt-0.5" />
              ) : (
                <p className="font-display text-2xl font-bold text-foreground">
                  {batchIds.length}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-foreground text-lg">
              {isToday
                ? "Today's Schedule"
                : `Schedule for ${DAYS[selectedDayOfWeek]}`}
            </h2>
            {!isToday && (
              <p className="text-muted-foreground text-sm">
                {new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
                  "en-IN",
                  { day: "numeric", month: "long", year: "numeric" },
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onNavigate("batches")}
            className="flex items-center gap-1 text-primary text-sm hover:underline"
          >
            All Batches <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isToday && (
          <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span>Current class</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span>Next class</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
              <span>Past / Upcoming</span>
            </div>
          </div>
        )}

        {displayLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : allItems.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium">
                No classes scheduled
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                No batches or solo programmes on {DAYS[selectedDayOfWeek]}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {timedItems.map((item, index) => {
              const status = getStatus(item, index);
              const soloCount =
                item.kind === "solo"
                  ? getSoloRegistrationCount(item.programme)
                  : 0;
              return (
                <ScheduleCard
                  key={
                    item.kind === "batch"
                      ? `batch-${item.batch.id.toString()}`
                      : `solo-${item.programme.id.toString()}`
                  }
                  item={item}
                  status={status}
                  soloRegistrationCount={soloCount}
                  onClick={
                    item.kind === "batch"
                      ? () => setSelectedBatchForModal(item.batch)
                      : undefined
                  }
                  onAttendance={
                    item.kind === "batch" && canTakeAttendance
                      ? () => onNavigate("attendance")
                      : undefined
                  }
                />
              );
            })}
            {untimedItems.length > 0 && (
              <>
                {timedItems.length > 0 && (
                  <p className="text-xs text-muted-foreground pt-1 pb-0.5 font-medium">
                    Unscheduled programmes
                  </p>
                )}
                {untimedItems.map((item) => {
                  const soloCount =
                    item.kind === "solo"
                      ? getSoloRegistrationCount(item.programme)
                      : 0;
                  return (
                    <ScheduleCard
                      key={
                        item.kind === "batch"
                          ? `batch-${item.batch.id.toString()}`
                          : `solo-${item.programme.id.toString()}`
                      }
                      item={item}
                      status="future"
                      soloRegistrationCount={soloCount}
                      onClick={
                        item.kind === "batch"
                          ? () => setSelectedBatchForModal(item.batch)
                          : undefined
                      }
                      onAttendance={
                        item.kind === "batch" && canTakeAttendance
                          ? () => onNavigate("attendance")
                          : undefined
                      }
                    />
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-display font-bold text-foreground text-lg mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Add Student",
              page: "students" as Page,
              color: "text-primary bg-primary/10 border-primary/20",
            },
            {
              label: "Add Batch",
              page: "batches" as Page,
              color: "text-accent bg-accent/10 border-accent/20",
            },
            {
              label: "Solo Programme",
              page: "solo" as Page,
              color: "text-chart-3 bg-chart-3/10 border-chart-3/20",
            },
            {
              label: "Collect Fee",
              page: "fees" as Page,
              color: "text-chart-4 bg-chart-4/10 border-chart-4/20",
            },
          ].map(({ label, page, color }) => (
            <button
              type="button"
              key={page}
              onClick={() => onNavigate(page)}
              className={`p-3 rounded-lg border text-sm font-medium transition-all hover:scale-105 ${color}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {selectedBatchForModal && (
        <BatchStudentModal
          batch={selectedBatchForModal}
          onClose={() => setSelectedBatchForModal(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}
