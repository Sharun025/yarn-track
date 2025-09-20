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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/lib/hooks/useApi";

const formGuide = [
  {
    step: "1. Select process",
    detail: "Choose the operation you are logging data for.",
  },
  {
    step: "2. Attach batch & BOM",
    detail: "Validate required materials and quantities before starting.",
  },
  {
    step: "3. Record input & output",
    detail: "Capture timings, production quantity, quality notes, and wastage.",
  },
];


type BatchRecord = {
  id: string;
  code: string;
  status: string;
  started_at: string | null;
  process?: {
    id: string;
    name: string;
  } | null;
  supervisor?: {
    id: string;
    display_name: string;
  } | null;
};

type BatchMovementRecord = {
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

type ProcessRecord = {
  id: string;
  name: string;
  slug: string;
};

const formatStatus = (value: string) => {
  switch (value) {
    case "in_progress":
      return "In progress";
    case "awaiting_qc":
      return "Awaiting QA";
    case "paused":
      return "Paused";
    case "scheduled":
      return "Scheduled";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return value ? value.replace(/_/g, " ") : "Unknown";
  }
};

export default function TransactionsPage() {
  const {
    data: processData,
    isLoading: processesLoading,
    error: processError,
  } = useApi<ProcessRecord[]>("/api/processes?active=true");

  const {
    data: batchData,
    isLoading: batchesLoading,
    error: batchError,
    refresh: refreshBatches,
  } = useApi<BatchRecord[]>("/api/batches?status=in_progress,awaiting_qc,paused,scheduled");

  const {
    data: movementData,
    isLoading: movementLoading,
    error: movementError,
    refresh: refreshMovements,
  } = useApi<BatchMovementRecord[]>("/api/batch-movements?limit=8");

  const processOptions = useMemo(() => {
    return (processData ?? []).map((process) => ({
      value: process.id,
      label: process.name,
    }));
  }, [processData]);

  const openBatches = useMemo(() => {
    return (batchData ?? []).map((batch) => ({
      id: batch.code,
      rawId: batch.id,
      process: batch.process?.name ?? "Unassigned",
      started: batch.started_at
        ? new Date(batch.started_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Not started",
      supervisor: batch.supervisor?.display_name ?? "Unassigned",
      status: formatStatus(batch.status),
    }));
  }, [batchData]);

  const movementLog = useMemo(() => {
    return (movementData ?? []).map((movement) => {
      const occurred = new Date(movement.occurred_at);
      const origin = movement.from_process?.name ?? "Unassigned";
      const destination = movement.to_process?.name ?? "Unassigned";
      const quantity = movement.quantity ? `${movement.quantity}` : "--";
      const batchLabel = movement.batch?.code ?? "Unknown batch";

      return {
        id: movement.id,
        time: occurred.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        date: occurred.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        detail: `${batchLabel} moved from ${origin} to ${destination} (${quantity})`,
      };
    });
  }, [movementData]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Capture production activity, material consumption, and inter-process
          movements in real time.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>Log production entry</CardTitle>
            <CardDescription>
              Record batch metrics, wastage, and quality feedback for this shift.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => void refreshBatches()}>
            Refresh batches
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Process</label>
              <Select defaultValue={processOptions[0]?.value ?? ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select process" />
                </SelectTrigger>
                <SelectContent>
                  {processesLoading && <SelectItem value="loading">Loading…</SelectItem>}
                  {processError && <SelectItem value="error">Failed to load processes</SelectItem>}
                  {processOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Batch ID</label>
              <Input placeholder="Scan or enter batch" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Shift</label>
              <Select defaultValue="shift-a">
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shift-a">Shift A</SelectItem>
                  <SelectItem value="shift-b">Shift B</SelectItem>
                  <SelectItem value="shift-c">Shift C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Material input (kg)</label>
              <Input type="number" placeholder="0" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Output (kg)</label>
              <Input type="number" placeholder="0" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Wastage (%)</label>
              <Input type="number" placeholder="0" />
            </div>
            <div className="space-y-1 xl:col-span-1 xl:col-start-4">
              <label className="text-sm font-medium">Supervisor</label>
              <Select defaultValue="sharun">
                <SelectTrigger>
                  <SelectValue placeholder="Assign supervisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sharun">Sharun Supervisor</SelectItem>
                  <SelectItem value="anita">Anita Rao</SelectItem>
                  <SelectItem value="raghav">Raghav Kapoor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Quality notes</label>
            <Textarea rows={4} placeholder="Tag defects or rework" />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm">
              Save draft
            </Button>
            <Button size="sm">Submit log</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Open batches</CardTitle>
            <CardDescription>
              Track batches currently in progress across processes.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refreshBatches()}>
            Assign supervisor
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Process</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batchesLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    Loading batches…
                  </TableCell>
                </TableRow>
              )}
              {batchError && !batchesLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-rose-600">
                    Failed to load batches. Please try again.
                  </TableCell>
                </TableRow>
              )}
              {!batchesLoading && !batchError && openBatches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No active batches yet. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
              {openBatches.map((batch) => (
                <TableRow key={batch.rawId}>
                  <TableCell className="font-medium">{batch.id}</TableCell>
                  <TableCell>{batch.process}</TableCell>
                  <TableCell>{batch.started}</TableCell>
                  <TableCell>{batch.supervisor}</TableCell>
                  <TableCell>
                    <Badge
                      variant={batch.status === "Paused" ? "destructive" : "secondary"}
                      className="font-medium"
                    >
                      {batch.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Time-stamped movements for today.</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View full log
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {movementLoading && (
              <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                Loading recent movements…
              </div>
            )}
            {movementError && !movementLoading && (
              <div className="rounded-lg border border-dashed bg-rose-100 px-4 py-3 text-sm text-rose-700">
                Failed to load movements.
                <Button
                  variant="link"
                  size="sm"
                  className="ml-1 h-auto p-0 font-semibold"
                  onClick={() => void refreshMovements()}
                >
                  Retry
                </Button>
              </div>
            )}
            {!movementLoading && !movementError && movementLog.length === 0 && (
              <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                No movements recorded yet.
              </div>
            )}
            {movementLog.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border bg-background px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{item.time}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logging guide</CardTitle>
            <CardDescription>
              Quick reminders to keep production entries consistent.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {formGuide.map((step) => (
              <Card key={step.step} className="border border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{step.step}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{step.detail}</p>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
