"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/hooks/useApi";

type ProcessRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
};

type BatchRecord = {
  id: string;
  code: string;
  status: string;
  process_id: string;
  started_at: string | null;
  completed_at: string | null;
  input_quantity: number | null;
  output_quantity: number | null;
  wastage_percentage: number | null;
  process?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type MovementRecord = {
  id: string;
  occurred_at: string;
  quantity: number | null;
  batch?: {
    id: string;
    code: string;
  } | null;
  from_process?: {
    name: string;
  } | null;
  to_process?: {
    name: string;
  } | null;
};

type ProcessRow = {
  process: string;
  batches: number;
  status: string;
  efficiency: string;
  nextAction: string;
};

type AlertRow = {
  title: string;
  description: string;
  tag: string;
  tone: "default" | "warning" | "destructive";
};

const statusStyles: Record<string, string> = {
  Running: "bg-emerald-100 text-emerald-700",
  Scheduled: "bg-sky-100 text-sky-700",
  Paused: "bg-rose-100 text-rose-700",
  "Awaiting QA": "bg-amber-100 text-amber-700",
  Completed: "bg-slate-100 text-slate-700",
  "No batches": "bg-slate-100 text-slate-600",
};

const statusPriority: Array<{ value: string; label: string }> = [
  { value: "in_progress", label: "Running" },
  { value: "awaiting_qc", label: "Awaiting QA" },
  { value: "paused", label: "Paused" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
];

const statusActionMap: Record<string, string> = {
  Running: "Monitor output and QC checkpoints",
  Paused: "Review downtime reason and resume",
  Scheduled: "Confirm material availability",
  "Awaiting QA": "Trigger quality inspection",
  Completed: "Close batch and post output",
  "No batches": "Schedule next shift",
};

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }
  return `${(value * 100).toFixed(1)}%`;
};

const calculateEfficiency = (batch: BatchRecord) => {
  if (!batch.input_quantity || !batch.output_quantity || batch.input_quantity === 0) {
    return null;
  }
  return batch.output_quantity / batch.input_quantity;
};

const average = (values: Array<number | null | undefined>) => {
  const filtered = values.filter((value): value is number => typeof value === "number" && !Number.isNaN(value));
  if (filtered.length === 0) return null;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
};

const deriveProcessRows = (processes: ProcessRecord[], batches: BatchRecord[]): ProcessRow[] => {
  if (processes.length === 0) {
    return [];
  }

  return processes.map((process) => {
    const related = batches.filter((batch) => batch.process_id === process.id);
    const batchCount = related.length;

    const statusLabel = (() => {
      for (const entry of statusPriority) {
        if (related.some((batch) => batch.status === entry.value)) {
          return entry.label;
        }
      }
      return batchCount === 0 ? "No batches" : "Completed";
    })();

    const efficiencyAverage = average(related.map(calculateEfficiency));

    return {
      process: process.name,
      batches: batchCount,
      status: statusLabel,
      efficiency: formatPercent(efficiencyAverage),
      nextAction: statusActionMap[statusLabel] ?? "Review schedule",
    } satisfies ProcessRow;
  });
};

const deriveKpis = (processes: ProcessRecord[], batches: BatchRecord[]) => {
  const totalProcesses = processes.length;
  const activeProcesses = processes.filter((process) => process.is_active).length;
  const totalBatches = batches.length;
  const activeBatches = batches.filter((batch) => batch.status === "in_progress").length;
  const efficiencyAverage = average(batches.map(calculateEfficiency));
  const wastageAverage = average(
    batches.map((batch) =>
      batch.wastage_percentage !== null && batch.wastage_percentage !== undefined
        ? batch.wastage_percentage / 100
        : null
    )
  );

  return [
    {
      label: "Active batches",
      value: activeBatches.toString(),
      meta: `${totalBatches} total recorded`,
    },
    {
      label: "Avg efficiency",
      value: formatPercent(efficiencyAverage),
      meta: "Based on logged output / input",
    },
    {
      label: "Avg wastage",
      value: formatPercent(wastageAverage),
      meta: "Across tracked batches",
    },
    {
      label: "Processes online",
      value: activeProcesses.toString(),
      meta: `${totalProcesses - activeProcesses} awaiting activation`,
    },
  ];
};

const deriveMovements = (movements: MovementRecord[]) => {
  return movements.map((movement) => {
    const timestamp = new Date(movement.occurred_at);
    return {
      id: movement.id,
      batch: movement.batch?.code ?? "Unknown batch",
      from: movement.from_process?.name ?? "Unassigned",
      to: movement.to_process?.name ?? "Unassigned",
      quantity: movement.quantity ? `${movement.quantity}` : "--",
      timestamp: timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: timestamp.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    };
  });
};

const deriveAlerts = (processRows: ProcessRow[], batches: BatchRecord[]) => {
  const alerts: AlertRow[] = [];

  if (processRows.some((row) => row.status === "Awaiting QA")) {
    alerts.push({
      title: "Quality check pending",
      description: "One or more processes need QA clearance before moving forward.",
      tag: "Action required",
      tone: "destructive",
    });
  }

  if (batches.filter((batch) => batch.status === "paused").length > 0) {
    alerts.push({
      title: "Paused production",
      description: "Investigate downtime reasons and resume the affected batches.",
      tag: "Investigate",
      tone: "warning",
    });
  }

  if (processRows.every((row) => row.status === "No batches")) {
    alerts.push({
      title: "No batches scheduled",
      description: "Schedule the next jobs to keep the floor engaged.",
      tag: "Heads-up",
      tone: "default",
    });
  }

  return alerts.length > 0
    ? alerts
    : [
        {
          title: "All systems nominal",
          description: "Production is steady and ready for the next assignments.",
          tag: "Info",
          tone: "default",
        },
      ];
};

export default function DashboardPage() {
  const {
    data: processes,
    isLoading: processesLoading,
    error: processError,
  } = useApi<ProcessRecord[]>("/api/processes?active=true");

  const {
    data: batches,
    isLoading: batchesLoading,
    error: batchError,
  } = useApi<BatchRecord[]>("/api/batches");

  const {
    data: movements,
    isLoading: movementsLoading,
    error: movementError,
  } = useApi<MovementRecord[]>("/api/batch-movements?limit=5");

  const processRows = useMemo(
    () => deriveProcessRows(processes ?? [], batches ?? []),
    [processes, batches]
  );

  const kpis = useMemo(
    () => deriveKpis(processes ?? [], batches ?? []),
    [processes, batches]
  );

  const movementRows = useMemo(
    () => deriveMovements(movements ?? []),
    [movements]
  );

  const alerts = useMemo(
    () => deriveAlerts(processRows, batches ?? []),
    [processRows, batches]
  );

  const loadingKpis = processesLoading || batchesLoading;
  const loadingProcesses = processesLoading || batchesLoading;
  const loadingMovements = movementsLoading;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Production dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Real-time overview of yarn production, process readiness, and key
          efficiency indicators across the factory floor.
        </p>
      </div>

      <section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loadingKpis &&
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="animate-pulse bg-muted/40">
                <CardHeader className="pb-2">
                  <CardDescription className="h-4 w-24 rounded bg-muted" />
                  <CardTitle className="h-8 w-20 rounded bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-32 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}

          {!loadingKpis && (processError || batchError) && (
            <Card className="md:col-span-2 xl:col-span-4 border-dashed">
              <CardHeader>
                <CardTitle>Unable to load KPIs</CardTitle>
                <CardDescription>
                  {processError?.message ?? batchError?.message ?? "Unexpected error"}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {!loadingKpis && !processError && !batchError &&
            kpis.map((item) => (
              <Card key={item.label}>
                <CardHeader className="pb-2">
                  <CardDescription>{item.label}</CardDescription>
                  <CardTitle className="text-3xl font-semibold">
                    {item.value}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.meta}</p>
                </CardContent>
              </Card>
            ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Process status</h2>
            <p className="text-sm text-muted-foreground">
              Monitor active batches and upcoming actions for each process.
            </p>
          </div>
          <Button variant="outline">View shift plan</Button>
        </div>
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Process</TableHead>
                  <TableHead>Active batches</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Efficiency</TableHead>
                  <TableHead>Next action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingProcesses && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      Loading process data…
                    </TableCell>
                  </TableRow>
                )}

                {!loadingProcesses && (processError || batchError) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-rose-600">
                      Unable to load process overview. Please retry shortly.
                    </TableCell>
                  </TableRow>
                )}

                {!loadingProcesses && !processError && !batchError && processRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      No processes configured yet.
                    </TableCell>
                  </TableRow>
                )}

                {processRows.map((row) => (
                  <TableRow key={row.process}>
                    <TableCell className="font-medium">{row.process}</TableCell>
                    <TableCell>{row.batches}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs font-semibold",
                          statusStyles[row.status] ?? "bg-slate-100 text-slate-700"
                        )}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.efficiency}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.nextAction}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card className="h-full">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Latest batch movements</CardTitle>
              <CardDescription>
                Track inter-process transfers captured in the last updates.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View full log
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingMovements && (
              <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                Loading movements…
              </div>
            )}

            {!loadingMovements && movementError && (
              <div className="rounded-lg border border-dashed bg-rose-100 px-4 py-3 text-sm text-rose-700">
                Failed to load movements. Please retry shortly.
              </div>
            )}

            {!loadingMovements && !movementError && movementRows.length === 0 && (
              <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                No movements logged yet.
              </div>
            )}

            {movementRows.map((movement) => (
              <div
                key={movement.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-background px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{movement.batch}</p>
                  <p className="text-xs text-muted-foreground">
                    {movement.date} · {movement.timestamp}
                  </p>
                </div>
                <div className="flex flex-col items-end text-sm text-muted-foreground">
                  <span>
                    {movement.from} → {movement.to}
                  </span>
                  <span>{movement.quantity}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Operational alerts</CardTitle>
            <CardDescription>Automated flags derived from live activity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <Card key={alert.title} className="border border-dashed">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{alert.title}</CardTitle>
                    <Badge
                      variant={alert.tone === "destructive" ? "destructive" : "secondary"}
                      className={cn(
                        "text-xs font-semibold",
                        alert.tone === "warning" && "bg-amber-100 text-amber-700",
                        alert.tone === "default" && "bg-slate-100 text-slate-700"
                      )}
                    >
                      {alert.tag}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
