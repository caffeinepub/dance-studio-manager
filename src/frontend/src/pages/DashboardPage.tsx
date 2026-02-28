import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronRight, Clock, Music, Users } from "lucide-react";
import { useState } from "react";
import type { Page } from "../App";
import type { Batch } from "../backend.d.ts";
import {
  useBatchIds,
  useBatchesByDay,
  useStudentIds,
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

interface DashboardPageProps {
  onNavigate: (page: Page) => void;
}

function BatchCard({ batch }: { batch: Batch }) {
  const { data: students = [], isLoading } = useStudentsInBatch(batch.id);
  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-all duration-200 shadow-card group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {batch.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground text-sm">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                {batch.startTime} – {batch.endTime}
              </span>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary border-primary/20 text-xs flex-shrink-0"
          >
            ₹{batch.monthlyFees.toString()}/mo
          </Badge>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex flex-wrap gap-1">
            {batch.daysOfWeek.map((d) => (
              <span
                key={d.toString()}
                className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded"
              >
                {DAYS_SHORT[Number(d)]}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <Users className="w-3.5 h-3.5" />
            {isLoading ? (
              <Skeleton className="w-6 h-4" />
            ) : (
              <span className="font-medium text-foreground">
                {students.length}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const today = new Date();
  const todayDay = today.getDay();
  const [selectedDate, setSelectedDate] = useState<string>(
    today.toISOString().split("T")[0],
  );

  const selectedDayOfWeek = new Date(`${selectedDate}T12:00:00`).getDay();
  const isToday = selectedDate === today.toISOString().split("T")[0];

  const { data: todayBatches = [], isLoading: todayLoading } =
    useBatchesByDay(todayDay);
  const { data: selectedBatches = [], isLoading: selectedLoading } =
    useBatchesByDay(selectedDayOfWeek);
  const { data: studentIds = [], isLoading: studentsLoading } = useStudentIds();
  const { data: batchIds = [], isLoading: batchesLoading } = useBatchIds();

  const displayBatches = isToday ? todayBatches : selectedBatches;
  const displayLoading = isToday ? todayLoading : selectedLoading;

  const formattedDate = today.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase mb-1">
            Today
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {DAYS[todayDay]},{" "}
            <span className="text-primary">
              {today.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {formattedDate}
          </p>
        </div>

        {/* Day Picker */}
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
                  {studentIds.length}
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
        <div className="flex items-center justify-between mb-3">
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
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  },
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

        {displayLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : displayBatches.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium">
                No batches scheduled
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                No classes on {DAYS[selectedDayOfWeek]}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayBatches.map((batch) => (
              <BatchCard key={batch.id.toString()} batch={batch} />
            ))}
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
    </div>
  );
}
