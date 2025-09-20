"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MoreHorizontal } from "lucide-react";

const stageOptions = ["Blowroom & Carding", "Indigo Dyeing", "Weaving & Looming", "Packing", "Quality"];
const processFilters = ["All", ...stageOptions] as const;
const jobCardStatuses = ["Received", "In Production", "Quality", "Completed"] as const;
type JobCardStatus = typeof jobCardStatuses[number];

type JobCardTransaction = {
  timestamp: string;
  type: "status" | "reroute" | "production";
  fromStatus: JobCardStatus;
  toStatus: JobCardStatus;
  fromProcess: string;
  toProcess: string;
  weightIn?: string;
  weightOut?: string;
  notes?: string;
};

const initialJobCards = [
  {
    id: "JC-2024-041",
    outputItem: "Cotton Yarn 30s",
    quantity: "850",
    currentStage: "Indigo Dyeing",
    nextAction: "Route to weaving",
    instructions: "Shade 4.5 · keep spool humidity under 55%.",
    requirements: ["Urgent replenishment", "Track humidity"],
    status: "In Production" as JobCardStatus,
    transactions: [
      {
        timestamp: "2024-09-01T09:05:00",
        type: "status" as const,
        fromStatus: "Received" as JobCardStatus,
        toStatus: "In Production" as JobCardStatus,
        fromProcess: "Blowroom & Carding",
        toProcess: "Indigo Dyeing",
        weightIn: "860",
        weightOut: "850",
        notes: "Batch split across two dye vats",
      },
    ] as JobCardTransaction[],
    createdOn: "02 Sep 2024",
  },
  {
    id: "JC-2024-042",
    outputItem: "Indigo dye (powder)",
    quantity: "120",
    currentStage: "Quality",
    nextAction: "Release to finished goods",
    instructions: "QA hold until delta E < 0.5.",
    requirements: ["QC samples ready", "Prep finished goods bin"],
    status: "Quality" as JobCardStatus,
    transactions: [
      {
        timestamp: "2024-09-03T17:15:00",
        type: "status" as const,
        fromStatus: "In Production" as JobCardStatus,
        toStatus: "Quality" as JobCardStatus,
        fromProcess: "Indigo Dyeing",
        toProcess: "Indigo Dyeing",
        weightIn: "125",
        weightOut: "120",
        notes: "Hold for shade verification",
      },
    ] as JobCardTransaction[],
    createdOn: "04 Sep 2024",
  },
];

type JobCard = (typeof initialJobCards)[number];

const groupByStatus = (cards: JobCard[]) =>
  jobCardStatuses.map((status) => ({
    status,
    cards: cards.filter((card) => card.status === status),
  }));

type MovementMode = "status-change" | "reroute" | "production-entry";

type MovementDialogState = {
  mode: MovementMode;
  cardId: string;
  fromStatus: JobCardStatus;
  toStatus: JobCardStatus;
  fromProcess: string;
  toProcess: string;
};

const transactionTypeLabels: Record<JobCardTransaction["type"], string> = {
  status: "Status move",
  reroute: "Process reroute",
  production: "Production entry",
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

type JobCardFormValues = {
  id: string;
  outputItem: string;
  quantity: string;
  currentStage: string;
  nextAction: string;
  instructions: string;
  requirements: string[];
  status: JobCardStatus;
  transactions: JobCardTransaction[];
};

type RecordActionsProps = {
  onEdit: () => void;
  onDelete: () => void;
};

function RecordActions({ onEdit, onDelete }: RecordActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Open actions</span>
      </Button>
      {open ? (
        <div
          className="absolute right-0 top-9 z-30 w-36 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          role="menu"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              onEdit();
              setOpen(false);
            }}
          >
            Edit
          </Button>
          <div className="my-1 h-px bg-muted" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start text-destructive hover:bg-destructive/10"
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
          >
            Delete
          </Button>
        </div>
      ) : null}
    </div>
  );
}

const emptyForm: JobCardFormValues = {
  id: "",
  outputItem: "",
  quantity: "",
  currentStage: stageOptions[0],
  nextAction: "",
  instructions: "",
  requirements: [],
  status: "Received",
  transactions: [],
};

export default function JobCardsPage() {
  const [jobCards, setJobCards] = useState(initialJobCards);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [requirementDraft, setRequirementDraft] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [movementDialog, setMovementDialog] = useState<MovementDialogState | null>(null);
  const [movementDetails, setMovementDetails] = useState({ weightIn: "", weightOut: "", notes: "" });
  const [sheetTab, setSheetTab] = useState<"details" | "transactions">("details");

  const form = useForm<JobCardFormValues>({ defaultValues: emptyForm });
  const requirements = form.watch("requirements") || [];
  const metrics = useMemo(() => {
    const total = jobCards.length;
    const inProduction = jobCards.filter((card) => card.status === "In Production").length;
    const waiting = jobCards.filter((card) => card.status === "Received").length;
    return { total, inProduction, waiting };
  }, [jobCards]);
  const activeCard = editingId ? jobCards.find((entry) => entry.id === editingId) : null;

  const handleSubmit = form.handleSubmit((values) => {
    if (editingId) {
      setJobCards((prev) => prev.map((card) => (card.id === editingId ? { ...card, ...values } : card)));
      setEditingId(null);
    } else {
      const newCard = {
        ...values,
        id: values.id || `JC-${Date.now()}`,
        createdOn: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        transactions: [],
      };
      setJobCards((prev) => [newCard, ...prev]);
    }
    form.reset(emptyForm);
    setRequirementDraft("");
    setSheetOpen(false);
  });

  const handleEdit = (id: string) => {
    const card = jobCards.find((entry) => entry.id === id);
    if (!card) return;
    form.reset({
      id: card.id,
      outputItem: card.outputItem,
      quantity: card.quantity,
      currentStage: card.currentStage,
      nextAction: card.nextAction,
      instructions: card.instructions,
      requirements: card.requirements,
      status: card.status,
      transactions: card.transactions ?? [],
    });
    setEditingId(id);
    setSheetTab("details");
    setSheetOpen(true);
  };

  const handleDelete = (id: string) => {
    setJobCards((prev) => prev.filter((card) => card.id !== id));
    if (editingId === id) {
      setEditingId(null);
      form.reset(emptyForm);
      setRequirementDraft("");
      setSheetOpen(false);
    }
  };

  const advanceStatus = (id: string, direction: 1 | -1) => {
    const card = jobCards.find((entry) => entry.id === id);
    if (!card) return;
    const currentIndex = jobCardStatuses.indexOf(card.status);
    const nextIndex = Math.min(Math.max(currentIndex + direction, 0), jobCardStatuses.length - 1);
    if (nextIndex === currentIndex) return;
    const nextStatus = jobCardStatuses[nextIndex];
    setMovementDialog({
      mode: "status-change",
      cardId: id,
      fromStatus: card.status,
      toStatus: nextStatus,
      fromProcess: card.currentStage,
      toProcess: card.currentStage,
    });
    setMovementDetails({ weightIn: "", weightOut: "", notes: "" });
  };

  const openReroute = (card: JobCard) => {
    setMovementDialog({
      mode: "reroute",
      cardId: card.id,
      fromStatus: card.status,
      toStatus: "Received",
      fromProcess: card.currentStage,
      toProcess: card.currentStage,
    });
    setMovementDetails({ weightIn: "", weightOut: "", notes: "" });
  };

  const openManualTransaction = (card: JobCard) => {
    setMovementDialog({
      mode: "production-entry",
      cardId: card.id,
      fromStatus: card.status,
      toStatus: card.status,
      fromProcess: card.currentStage,
      toProcess: card.currentStage,
    });
    setMovementDetails({ weightIn: "", weightOut: "", notes: "" });
  };

  const closeMovementDialog = () => {
    setMovementDialog(null);
    setMovementDetails({ weightIn: "", weightOut: "", notes: "" });
  };

  const handleMovementSubmit = () => {
    if (!movementDialog) return;
    const card = jobCards.find((entry) => entry.id === movementDialog.cardId);
    if (!card) {
      closeMovementDialog();
      return;
    }

    const transaction: JobCardTransaction = {
      timestamp: new Date().toISOString(),
      type: movementDialog.mode === "reroute" ? "reroute" : movementDialog.mode === "production-entry" ? "production" : "status",
      fromStatus: movementDialog.fromStatus,
      toStatus: movementDialog.toStatus,
      fromProcess: movementDialog.fromProcess,
      toProcess: movementDialog.toProcess,
      weightIn: movementDetails.weightIn.trim() ? movementDetails.weightIn.trim() : undefined,
      weightOut: movementDetails.weightOut.trim() ? movementDetails.weightOut.trim() : undefined,
      notes: movementDetails.notes.trim() ? movementDetails.notes.trim() : undefined,
    };

    const nextTransactions = [transaction, ...(card.transactions ?? [])];
    const shouldUpdatePrimaryState = movementDialog.mode !== "production-entry";

    setJobCards((prev) =>
      prev.map((entry) => {
        if (entry.id !== movementDialog.cardId) return entry;
        if (shouldUpdatePrimaryState) {
          return {
            ...entry,
            status: movementDialog.toStatus,
            currentStage: movementDialog.toProcess,
            transactions: nextTransactions,
          };
        }
        return { ...entry, transactions: nextTransactions };
      })
    );

    if (editingId === movementDialog.cardId) {
      form.setValue("transactions", nextTransactions, { shouldDirty: true });
      if (shouldUpdatePrimaryState) {
        form.setValue("status", movementDialog.toStatus, { shouldDirty: true });
        form.setValue("currentStage", movementDialog.toProcess, { shouldDirty: true });
      }
    }

    closeMovementDialog();
  };

  const addRequirement = () => {
    const trimmed = requirementDraft.trim();
    if (!trimmed) return;
    form.setValue("requirements", [...requirements, trimmed], { shouldDirty: true });
    setRequirementDraft("");
  };

  const removeRequirement = (index: number) => {
    const next = [...requirements];
    next.splice(index, 1);
    form.setValue("requirements", next, { shouldDirty: true });
  };

  const openCreateSheet = () => {
    setEditingId(null);
    form.reset(emptyForm);
    setRequirementDraft("");
    setSheetTab("details");
    setSheetOpen(true);
  };


  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto">
            <Card className="border-dashed">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total cards</p>
                <p className="mt-1 text-2xl font-semibold">{metrics.total}</p>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">In production</p>
                <p className="mt-1 text-2xl font-semibold text-primary">{metrics.inProduction}</p>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Waiting intake</p>
                <p className="mt-1 text-2xl font-semibold text-amber-600">{metrics.waiting}</p>
              </CardContent>
            </Card>
          </div>
          <Button size="sm" className="lg:self-end" onClick={openCreateSheet}>
            New job card
          </Button>
        </div>

        <Tabs defaultValue="All" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            {processFilters.map((filter) => (
              <TabsTrigger key={filter} value={filter} className="whitespace-nowrap">
                {filter === "All" ? "All processes" : filter}
              </TabsTrigger>
            ))}
          </TabsList>

          {processFilters.map((filter) => {
            const filteredCards =
              filter === "All" ? jobCards : jobCards.filter((card) => card.currentStage === filter);
            const groupedCards = groupByStatus(filteredCards);
            const completedCards = jobCards.filter(
              (card) => card.status === "Completed" && (filter === "All" || card.currentStage === filter)
            );

            return (
              <TabsContent key={filter} value={filter} className="mt-0">
                <div className="grid gap-4 lg:grid-cols-4">
                  {groupedCards.map(({ status, cards }) => {
                    const isCompletedColumn = status === "Completed";

                    return (
                      <Card key={`${filter}-${status}`} className="flex flex-col">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{status}</CardTitle>
                          <CardDescription>
                            {cards.length} card{cards.length === 1 ? "" : "s"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-3">
                          {cards.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No cards in this lane yet.</p>
                          ) : (
                            cards.map((card) => {
                              const allowReroute = isCompletedColumn;

                              return (
                                <div
                                  key={card.id}
                                  className="space-y-4 rounded-xl border border-border/60 bg-background/80 p-4 text-sm shadow-sm ring-1 ring-inset ring-transparent transition hover:shadow-md hover:ring-primary/10"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-semibold tracking-tight">{card.id}</p>
                                      <p className="text-xs text-muted-foreground">{card.createdOn}</p>
                                    </div>
                                    <RecordActions onEdit={() => handleEdit(card.id)} onDelete={() => handleDelete(card.id)} />
                                  </div>
                                  <div className="space-y-1">
                                    <p className="font-medium leading-tight text-foreground">{card.outputItem}</p>
                                    <p className="text-xs text-muted-foreground">Planned qty: {card.quantity}</p>
                                  </div>
                                  <div className="flex flex-wrap items-start gap-3 text-xs">
                                    <Badge
                                      variant="secondary"
                                      className="rounded-full border-none bg-primary/10 px-3 py-1 font-semibold text-primary"
                                    >
                                      {card.currentStage}
                                    </Badge>
                                    <div className="flex-1 min-w-[140px]">
                                      <p className="font-semibold uppercase tracking-wide text-muted-foreground">Next</p>
                                      <p className="text-xs text-muted-foreground/80 break-words">
                                        {card.nextAction || "Waiting for routing"}
                                      </p>
                                    </div>
                                  </div>
                                  {card.requirements?.length ? (
                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Requirements</p>
                                      <div className="flex flex-wrap gap-2">
                                        {card.requirements.map((req, index) => (
                                          <span
                                            key={`${card.id}-req-${index}`}
                                            className="rounded-full border border-dashed border-primary/30 bg-primary/5 px-3 py-1 text-xs text-primary"
                                          >
                                            {req}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                  <div className="space-y-2">
                                    <div
                                      className={
                                        allowReroute
                                          ? "grid gap-2"
                                          : "grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2"
                                      }
                                    >
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-center whitespace-normal"
                                        size="sm"
                                        disabled={card.status === jobCardStatuses[0]}
                                        onClick={() => advanceStatus(card.id, -1)}
                                      >
                                        Back
                                      </Button>
                                      {!allowReroute ? (
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          className="w-full justify-center whitespace-normal"
                                          size="sm"
                                          disabled={card.status === jobCardStatuses[jobCardStatuses.length - 1]}
                                          onClick={() => advanceStatus(card.id, 1)}
                                        >
                                          Move forward
                                        </Button>
                                      ) : null}
                                    </div>
                                    {allowReroute ? (
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        className="w-full justify-center whitespace-normal"
                                        size="sm"
                                        onClick={() => openReroute(card)}
                                      >
                                        Send to another process
                                      </Button>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <Card className="mt-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Completed job cards</CardTitle>
                    <CardDescription>
                      Historical log of cards closed{filter === "All" ? " across all processes" : ` in ${filter}`}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {completedCards.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No cards have been marked completed yet.</p>
                    ) : (
                      <ScrollArea>
                        <div className="min-w-[720px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[140px]">Job card</TableHead>
                                <TableHead>Output item</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Completed on</TableHead>
                                <TableHead>Last notes</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {completedCards.map((card) => {
                                const completionTransaction = card.transactions?.find(
                                  (txn) => txn.type === "status" && txn.toStatus === "Completed"
                                );
                                return (
                                  <TableRow key={`completed-${filter}-${card.id}`}>
                                    <TableCell className="font-medium">{card.id}</TableCell>
                                    <TableCell>{card.outputItem}</TableCell>
                                    <TableCell>{card.quantity}</TableCell>
                                    <TableCell>
                                      {completionTransaction ? formatDateTime(completionTransaction.timestamp) : "—"}
                                    </TableCell>
                                    <TableCell className="max-w-[220px] truncate">
                                      {completionTransaction?.notes || "—"}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Transaction checkpoints</CardTitle>
            <CardDescription>The job card acts as a master reference for every production transaction recorded.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm font-semibold">Material issue</p>
              <p className="mt-1 text-sm text-muted-foreground">Each issue slip references the job card, logging batch numbers and bin locations.</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm font-semibold">Production confirmation</p>
              <p className="mt-1 text-sm text-muted-foreground">Operators confirm output by stage, capturing rejects and machine downtime.</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm font-semibold">Quality release</p>
              <p className="mt-1 text-sm text-muted-foreground">QA teams release the lot by closing the job card, updating finished goods stock automatically.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (open) {
            setSheetTab("details");
          }
          if (!open) {
            setRequirementDraft("");
            if (!editingId) {
              form.reset(emptyForm);
            }
          }
        }}
      >
        <SheetContent className="space-y-6 sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit job card" : "Create job card"}</SheetTitle>
            <SheetDescription>Capture requirements and routing before material moves to the next process.</SheetDescription>
          </SheetHeader>
          <Tabs
            value={sheetTab}
            onValueChange={(value) => setSheetTab(value as "details" | "transactions")}
            className="space-y-6"
          >
            <TabsList className="w-full justify-start">
              <TabsTrigger value="details" className="whitespace-nowrap">
                Job details
              </TabsTrigger>
              {editingId ? (
                <TabsTrigger value="transactions" className="whitespace-nowrap">
                  Transactions
                </TabsTrigger>
              ) : null}
            </TabsList>
            <TabsContent value="details" className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="jobId">
                        Job card ID
                      </label>
                      <Input id="jobId" {...form.register("id")} placeholder="Auto generates if left blank" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output item</label>
                      <Select value={form.watch("outputItem") || ""} onValueChange={(value) => form.setValue("outputItem", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cotton Yarn 30s">Cotton Yarn 30s</SelectItem>
                          <SelectItem value="Indigo dye (powder)">Indigo dye (powder)</SelectItem>
                          <SelectItem value="Corrugated box – 20kg">Corrugated box – 20kg</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="quantity">
                        Planned quantity
                      </label>
                      <Input id="quantity" type="number" min="1" {...form.register("quantity")} />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current stage</label>
                      <Select value={form.watch("currentStage") || stageOptions[0]} onValueChange={(value) => form.setValue("currentStage", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {stageOptions.map((stage) => (
                            <SelectItem key={stage} value={stage}>
                              {stage}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="nextAction">
                        Next action
                      </label>
                      <Input id="nextAction" {...form.register("nextAction")} placeholder="e.g. Queue for weaving" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Job status</label>
                      <Select value={form.watch("status") || "Received"} onValueChange={(value: JobCardStatus) => form.setValue("status", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobCardStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Instructions</p>
                    <Textarea
                      rows={8}
                      placeholder="Outline routing notes, quality gates, tooling, or shift remarks"
                      {...form.register("instructions")}
                    />
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Requirements</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add requirement"
                          value={requirementDraft}
                          onChange={(event) => setRequirementDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addRequirement();
                            }
                          }}
                        />
                        <Button type="button" onClick={addRequirement} disabled={!requirementDraft.trim()}>
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {requirements.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No requirements captured yet.</p>
                        ) : (
                          requirements.map((requirement, index) => (
                            <Badge key={`${requirement}-${index}`} variant="outline" className="gap-1">
                              <span>{requirement}</span>
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => removeRequirement(index)}
                                aria-label="Remove requirement"
                              >
                                ×
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                      <p>
                        Job cards drive the material hand-off sequence. Every goods issue, production confirmation, and QA release must reference the job card ID to keep traceability intact.
                      </p>
                      <p className="font-medium text-foreground">Tip: Save as draft while aligning stages, then publish when routing is final.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset(emptyForm);
                      setRequirementDraft("");
                    }}
                  >
                    Reset form
                  </Button>
                  <Button type="submit">{editingId ? "Save changes" : "Create job card"}</Button>
                </div>
              </form>
            </TabsContent>
            {editingId ? (
              <TabsContent value="transactions" className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Production transactions</h3>
                    <p className="text-sm text-muted-foreground">Tie every move to weights and remarks for a clean audit trail.</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (activeCard) {
                        openManualTransaction(activeCard);
                      }
                    }}
                    disabled={!activeCard}
                  >
                    Log production entry
                  </Button>
                </div>
                {activeCard && activeCard.transactions?.length ? (
                  <ScrollArea>
                    <div className="min-w-[760px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[160px]">Timestamp</TableHead>
                            <TableHead>Activity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Process</TableHead>
                            <TableHead>Weight in</TableHead>
                            <TableHead>Weight out</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeCard.transactions.map((txn, index) => (
                            <TableRow key={`${activeCard.id}-txn-${index}`}>
                              <TableCell>{formatDateTime(txn.timestamp)}</TableCell>
                              <TableCell>{transactionTypeLabels[txn.type]}</TableCell>
                              <TableCell>
                                {txn.fromStatus === txn.toStatus
                                  ? txn.toStatus
                                  : `${txn.fromStatus} → ${txn.toStatus}`}
                              </TableCell>
                              <TableCell>
                                {txn.fromProcess === txn.toProcess
                                  ? txn.toProcess
                                  : `${txn.fromProcess} → ${txn.toProcess}`}
                              </TableCell>
                              <TableCell>{txn.weightIn ?? "—"}</TableCell>
                              <TableCell>{txn.weightOut ?? "—"}</TableCell>
                              <TableCell className="max-w-[200px] whitespace-normal">{txn.notes ?? "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground">No transactions captured yet. Log the first one to start the audit trail.</p>
                )}
              </TabsContent>
            ) : null}
          </Tabs>
        </SheetContent>
      </Sheet>
      <Dialog open={Boolean(movementDialog)} onOpenChange={(open) => (!open ? closeMovementDialog() : undefined)}>
        <DialogContent className="sm:max-w-lg">
          {movementDialog ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {movementDialog.mode === "status-change"
                    ? "Confirm status move"
                    : movementDialog.mode === "reroute"
                    ? "Send job card to another process"
                    : "Record production entry"}
                </DialogTitle>
                <DialogDescription>
                  {movementDialog.mode === "status-change"
                    ? "Capture the material movement before updating the board."
                    : movementDialog.mode === "reroute"
                    ? "Select the destination process and log the hand-off details."
                    : "Log production data against the job card without moving its stage."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
                      <p className="font-medium">
                        {movementDialog.fromStatus === movementDialog.toStatus
                          ? movementDialog.toStatus
                          : `${movementDialog.fromStatus} → ${movementDialog.toStatus}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Process</p>
                      <p className="font-medium">
                        {movementDialog.mode === "reroute"
                          ? `${movementDialog.fromProcess} → ${movementDialog.toProcess}`
                          : movementDialog.fromProcess}
                      </p>
                    </div>
                  </div>
                </div>
                {movementDialog.mode !== "status-change" ? (
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {movementDialog.mode === "reroute" ? "Destination process" : "Process"}
                    </label>
                    <Select
                      value={movementDialog.toProcess}
                      onValueChange={(value) =>
                        setMovementDialog((prev) =>
                          prev
                            ? {
                                ...prev,
                                toProcess: value,
                                fromProcess: prev.mode === "production-entry" ? value : prev.fromProcess,
                              }
                            : prev
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select process" />
                      </SelectTrigger>
                      <SelectContent>
                        {stageOptions.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="weightIn">
                    Weight in (kg)
                  </label>
                  <Input
                    id="weightIn"
                    type="number"
                    inputMode="decimal"
                    value={movementDetails.weightIn}
                    onChange={(event) => setMovementDetails((prev) => ({ ...prev, weightIn: event.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="weightOut">
                    Weight out (kg)
                  </label>
                  <Input
                    id="weightOut"
                    type="number"
                    inputMode="decimal"
                    value={movementDetails.weightOut}
                    onChange={(event) => setMovementDetails((prev) => ({ ...prev, weightOut: event.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="movementNotes">
                    Notes or exceptions
                  </label>
                  <Textarea
                    id="movementNotes"
                    rows={3}
                    value={movementDetails.notes}
                    onChange={(event) => setMovementDetails((prev) => ({ ...prev, notes: event.target.value }))}
                    placeholder="Capture batch splits, downtime, variances, etc."
                  />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={closeMovementDialog}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleMovementSubmit}
                  disabled={movementDialog.mode === "reroute" && movementDialog.toProcess === movementDialog.fromProcess}
                >
                  {movementDialog.mode === "status-change"
                    ? "Confirm move"
                    : movementDialog.mode === "reroute"
                    ? "Send to process"
                    : "Save entry"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
