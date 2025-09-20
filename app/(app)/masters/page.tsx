"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { MoreHorizontal, Plus, X } from "lucide-react";

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/lib/hooks/useApi";

const itemStatusOptions = ["Active", "Reorder", "Watch", "Inactive"] as const;
const itemCategoryOptions = ["Raw material", "Chemicals", "Packing", "Consumable"];
const uomTypeOptions = ["Weight", "Length", "Count", "Volume", "Area"];
const workerStatusOptions = ["Active", "On leave", "Inactive"] as const;

const statusBadge: Record<string, string> = {
  Active: "border-transparent bg-emerald-100 text-emerald-700",
  Reorder: "border-transparent bg-amber-100 text-amber-700",
  Watch: "border-transparent bg-rose-100 text-rose-700",
  Inactive: "border-dashed bg-muted text-muted-foreground",
  "On leave": "border-transparent bg-amber-100 text-amber-700",
};

const jsonHeaders = {
  "Content-Type": "application/json",
};

async function request<T>(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...jsonHeaders,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      if (payload?.error) {
        message = payload.error;
      }
    } catch (error) {
      if (error instanceof Error) {
        message = error.message;
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  const payload = (await response.json()) as { data?: T };
  return (payload?.data ?? null) as T;
}

type ApiState<T> = {
  records: T[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

type ItemRecord = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  unit: string;
  unit_cost: number | null;
  reorder_level: number | null;
  status: string | null;
  vendor: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type UomRecord = {
  id: string;
  code: string;
  name: string;
  type: string | null;
  precision: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type WorkerRecord = {
  id: string;
  code: string;
  display_name: string;
  role: string | null;
  department: string | null;
  shift: string | null;
  status: string | null;
  contact: string | null;
  skills: string | null;
  created_at: string;
  updated_at: string;
};

type ProcessRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sequence: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type BomComponentRecord = {
  id: string;
  expected_quantity: number | null;
  unit: string;
  item: {
    id: string;
    sku: string;
    name: string;
  } | null;
};

type BomTemplateRecord = {
  id: string;
  code: string;
  name: string;
  process_id: string | null;
  process: {
    id: string;
    name: string;
    slug: string;
  } | null;
  output_item_id: string | null;
  output_quantity: number | null;
  instructions: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  components: BomComponentRecord[];
};

type MastersContextValue = {
  items: ApiState<ItemRecord>;
  uoms: ApiState<UomRecord>;
  workers: ApiState<WorkerRecord>;
  processes: ApiState<ProcessRecord>;
  bomTemplates: ApiState<BomTemplateRecord>;
};

const MastersDataContext = createContext<MastersContextValue | null>(null);

const useMastersData = () => {
  const context = useContext(MastersDataContext);
  if (!context) {
    throw new Error("Masters data context is unavailable");
  }
  return context;
};

type FormEntity = "item" | "uom" | "worker" | "process" | "bom";
type FormMode = "create" | "edit";

type DialogState = {
  open: boolean;
  entity: FormEntity;
  mode: FormMode;
  record: unknown | null;
};

type ActionState = {
  open: boolean;
  entity: FormEntity;
  record: unknown | null;
};

export default function MastersPage() {
  const itemsState = useApi<ItemRecord[]>("/api/items");
  const uomsState = useApi<UomRecord[]>("/api/uoms");
  const workersState = useApi<WorkerRecord[]>("/api/workers");
  const processesState = useApi<ProcessRecord[]>("/api/processes");
  const bomTemplatesState = useApi<BomTemplateRecord[]>("/api/bom/templates");

  const contextValue = useMemo<MastersContextValue>(
    () => ({
      items: {
        records: itemsState.data ?? [],
        isLoading: itemsState.isLoading,
        error: itemsState.error,
        refresh: itemsState.refresh,
      },
      uoms: {
        records: uomsState.data ?? [],
        isLoading: uomsState.isLoading,
        error: uomsState.error,
        refresh: uomsState.refresh,
      },
      workers: {
        records: workersState.data ?? [],
        isLoading: workersState.isLoading,
        error: workersState.error,
        refresh: workersState.refresh,
      },
      processes: {
        records: processesState.data ?? [],
        isLoading: processesState.isLoading,
        error: processesState.error,
        refresh: processesState.refresh,
      },
      bomTemplates: {
        records: bomTemplatesState.data ?? [],
        isLoading: bomTemplatesState.isLoading,
        error: bomTemplatesState.error,
        refresh: bomTemplatesState.refresh,
      },
    }),
    [
      itemsState.data,
      itemsState.error,
      itemsState.isLoading,
      itemsState.refresh,
      uomsState.data,
      uomsState.error,
      uomsState.isLoading,
      uomsState.refresh,
      workersState.data,
      workersState.error,
      workersState.isLoading,
      workersState.refresh,
      processesState.data,
      processesState.error,
      processesState.isLoading,
      processesState.refresh,
      bomTemplatesState.data,
      bomTemplatesState.error,
      bomTemplatesState.isLoading,
      bomTemplatesState.refresh,
    ]
  );

  const metrics = useMemo(() => {
    const items = contextValue.items.records;
    const processes = contextValue.processes.records;
    const workers = contextValue.workers.records;
    const bomTemplates = contextValue.bomTemplates.records;

    const activeItems = items.filter((item) => (item.status ?? "").toLowerCase() === "active").length;
    const activeProcesses = processes.filter((process) => process.is_active).length;
    const activeWorkers = workers.filter((worker) => (worker.status ?? "").toLowerCase() === "active").length;

    return [
      { title: "Total SKUs", value: items.length, meta: `${activeItems} active` },
      { title: "Processes", value: processes.length, meta: `${activeProcesses} available` },
      { title: "Workers", value: workers.length, meta: `${activeWorkers} active` },
      { title: "BOM templates", value: bomTemplates.length, meta: "Configured outputs" },
    ];
  }, [contextValue]);

  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    entity: "item",
    mode: "create",
    record: null,
  });

  const [actionState, setActionState] = useState<ActionState>({
    open: false,
    entity: "item",
    record: null,
  });

  const openDialog = useCallback((entity: FormEntity, mode: FormMode, record: unknown | null = null) => {
    setDialogState({ open: true, entity, mode, record });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, open: false }));
  }, []);

  const openDelete = useCallback((entity: FormEntity, record: unknown) => {
    setActionState({ open: true, entity, record });
  }, []);

  const closeDelete = useCallback(() => {
    setActionState((prev) => ({ ...prev, open: false }));
  }, []);

  const refreshEntity = useCallback(
    async (entity: FormEntity) => {
      if (entity === "item") await contextValue.items.refresh();
      if (entity === "uom") await contextValue.uoms.refresh();
      if (entity === "worker") await contextValue.workers.refresh();
      if (entity === "process") await contextValue.processes.refresh();
      if (entity === "bom") await contextValue.bomTemplates.refresh();
    },
    [contextValue]
  );

  const handleDelete = useCallback(async () => {
    const { entity, record } = actionState;
    if (!record) return;

    try {
      if (entity === "item") {
        const { id } = record as ItemRecord;
        await request(`/api/items/${id}`, { method: "DELETE" });
      } else if (entity === "uom") {
        const { id } = record as UomRecord;
        await request(`/api/uoms/${id}`, { method: "DELETE" });
      } else if (entity === "worker") {
        const { id } = record as WorkerRecord;
        await request(`/api/workers/${id}`, { method: "DELETE" });
      } else if (entity === "process") {
        const { id } = record as ProcessRecord;
        await request(`/api/processes/${id}`, { method: "DELETE" });
      } else if (entity === "bom") {
        const { id } = record as BomTemplateRecord;
        await request(`/api/bom/templates/${id}`, { method: "DELETE" });
      }
      await refreshEntity(entity);
    } catch (error) {
      console.error(`Failed to delete ${entity}`, error);
    } finally {
      closeDelete();
    }
  }, [actionState, closeDelete, refreshEntity]);

  return (
    <MastersDataContext.Provider value={contextValue}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Masters</h1>
          <p className="text-sm text-muted-foreground">
            Maintain master data for items, processes, workers, units, and Bill of Materials.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Overview</CardTitle>
            <CardDescription>Key counts across master records.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.title} className="rounded-lg border bg-card/60 px-4 py-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">{metric.title}</p>
                <p className="text-2xl font-semibold">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.meta}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-xl bg-muted p-1">
            <TabsTrigger value="items">Item Master</TabsTrigger>
            <TabsTrigger value="uom">UOM Master</TabsTrigger>
            <TabsTrigger value="workers">Worker Master</TabsTrigger>
            <TabsTrigger value="processes">Process Master</TabsTrigger>
            <TabsTrigger value="bom">BOM Master</TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <ItemsSection onCreate={() => openDialog("item", "create")} onEdit={(record) => openDialog("item", "edit", record)} onDelete={(record) => openDelete("item", record)} />
          </TabsContent>

          <TabsContent value="uom">
            <UomsSection onCreate={() => openDialog("uom", "create")} onEdit={(record) => openDialog("uom", "edit", record)} onDelete={(record) => openDelete("uom", record)} />
          </TabsContent>

          <TabsContent value="workers">
            <WorkersSection onCreate={() => openDialog("worker", "create")} onEdit={(record) => openDialog("worker", "edit", record)} onDelete={(record) => openDelete("worker", record)} />
          </TabsContent>

          <TabsContent value="processes">
            <ProcessesSection onCreate={() => openDialog("process", "create")} onEdit={(record) => openDialog("process", "edit", record)} onDelete={(record) => openDelete("process", record)} />
          </TabsContent>

          <TabsContent value="bom">
            <BomSection
              onCreate={() => openDialog("bom", "create")}
              onEdit={(record) => openDialog("bom", "edit", record)}
              onDelete={(record) => openDelete("bom", record)}
            />
          </TabsContent>
        </Tabs>

        <MasterFormDialog state={dialogState} onClose={closeDialog} onSuccess={async (entity) => {
          await refreshEntity(entity);
          closeDialog();
        }} />

        <MasterActionDialog state={actionState} onCancel={closeDelete} onConfirm={handleDelete} />
      </div>
    </MastersDataContext.Provider>
  );
}

type SectionProps<T> = {
  onCreate: () => void;
  onEdit: (record: T) => void;
  onDelete: (record: T) => void;
};

type ItemsSectionProps = SectionProps<ItemRecord>;

const ItemsSection = ({ onCreate, onEdit, onDelete }: ItemsSectionProps) => {
  const { items } = useMastersData();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return items.records.filter((item) => {
      const matchesSearch =
        !normalized ||
        item.sku.toLowerCase().includes(normalized) ||
        item.name.toLowerCase().includes(normalized) ||
        (item.vendor ?? "").toLowerCase().includes(normalized);
      const matchesCategory = category === "all" || item.category === category;
      const matchesStatus = status === "all" || item.status === status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [category, items.records, searchTerm, status]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle>Item catalogue</CardTitle>
          <CardDescription>Materials, consumables, and finished goods tracked in operations.</CardDescription>
        </div>
        <Button size="sm" onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add item
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary">Showing: {filtered.length}</Badge>
            {(searchTerm || category !== "all" || status !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => {
                setSearchTerm("");
                setCategory("all");
                setStatus("all");
              }}>
                Reset filters
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search SKU, item, or vendor"
              className="w-full sm:w-[240px]"
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="sm:w-[200px]">
                <SelectValue placeholder="Filter category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {itemCategoryOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {itemStatusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea>
          <div className="min-w-[760px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      Loading items…
                    </TableCell>
                  </TableRow>
                ) : items.error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-rose-600">
                      {items.error.message}
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      No items match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.sku}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p>{item.name}</p>
                          <p className="text-xs text-muted-foreground">UOM: {item.unit}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.category ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusBadge[item.status ?? ""] ?? "border bg-muted text-muted-foreground"}>
                          {item.status ?? "Unspecified"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(item.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <RowActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

type UomsSectionProps = SectionProps<UomRecord>;

const UomsSection = ({ onCreate, onEdit, onDelete }: UomsSectionProps) => {
  const { uoms } = useMastersData();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return uoms.records.filter((uom) => {
      const matchesSearch =
        !normalized ||
        uom.code.toLowerCase().includes(normalized) ||
        uom.name.toLowerCase().includes(normalized) ||
        (uom.description ?? "").toLowerCase().includes(normalized);
      const matchesType = typeFilter === "all" || uom.type === typeFilter;
      const matchesStatus = statusFilter === "all" || (uom.is_active ? "Active" : "Inactive") === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchTerm, statusFilter, typeFilter, uoms.records]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle>Units of measure</CardTitle>
          <CardDescription>Standardised measurement references used across the system.</CardDescription>
        </div>
        <Button size="sm" onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add unit
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary">Showing: {filtered.length}</Badge>
            {(searchTerm || typeFilter !== "all" || statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
              >
                Reset filters
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search code or name"
              className="w-full sm:w-[220px]"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {uomTypeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea>
          <div className="min-w-[880px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Precision</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uoms.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                      Loading units…
                    </TableCell>
                  </TableRow>
                ) : uoms.error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-rose-600">
                      {uoms.error.message}
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                      No units found for the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium uppercase">{unit.code}</TableCell>
                      <TableCell>{unit.name}</TableCell>
                      <TableCell>{unit.type ?? "—"}</TableCell>
                      <TableCell className="text-center">{unit.precision ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={unit.is_active ? statusBadge.Active : statusBadge.Inactive}>
                          {unit.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{unit.description ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <RowActions onEdit={() => onEdit(unit)} onDelete={() => onDelete(unit)} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

type WorkersSectionProps = SectionProps<WorkerRecord>;

const WorkersSection = ({ onCreate, onEdit, onDelete }: WorkersSectionProps) => {
  const { workers } = useMastersData();
  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");

  const departments = useMemo(() => {
    const values = new Set<string>();
    workers.records.forEach((worker) => {
      if (worker.department) values.add(worker.department);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [workers.records]);

  const filtered = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return workers.records.filter((worker) => {
      const matchesSearch =
        !normalized ||
        worker.code.toLowerCase().includes(normalized) ||
        worker.display_name.toLowerCase().includes(normalized) ||
        (worker.role ?? "").toLowerCase().includes(normalized) ||
        (worker.department ?? "").toLowerCase().includes(normalized);
      const matchesDepartment = department === "all" || worker.department === department;
      const matchesStatus = status === "all" || worker.status === status;
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [department, searchTerm, status, workers.records]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle>Worker directory</CardTitle>
          <CardDescription>Operators, technicians, and supervisors available for allocation.</CardDescription>
        </div>
        <Button size="sm" onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add worker
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary">Showing: {filtered.length}</Badge>
            {(searchTerm || department !== "all" || status !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setDepartment("all");
                  setStatus("all");
                }}
              >
                Reset filters
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, code, or role"
              className="w-full sm:w-[240px]"
            />
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="sm:w-[200px]">
                <SelectValue placeholder="Filter department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {workerStatusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea>
          <div className="min-w-[760px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      Loading workers…
                    </TableCell>
                  </TableRow>
                ) : workers.error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-rose-600">
                      {workers.error.message}
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      No workers match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((worker) => (
                    <TableRow key={worker.id}>
                      <TableCell className="font-medium uppercase">{worker.code}</TableCell>
                      <TableCell>{worker.display_name}</TableCell>
                      <TableCell>{worker.role ?? "—"}</TableCell>
                      <TableCell>{worker.department ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusBadge[worker.status ?? ""] ?? "border bg-muted text-muted-foreground"}>
                          {worker.status ?? "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <RowActions onEdit={() => onEdit(worker)} onDelete={() => onDelete(worker)} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

type ProcessesSectionProps = SectionProps<ProcessRecord>;

const ProcessesSection = ({ onCreate, onEdit, onDelete }: ProcessesSectionProps) => {
  const { processes } = useMastersData();

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle>Manufacturing processes</CardTitle>
          <CardDescription>Ordered stages and supporting documentation.</CardDescription>
        </div>
        <Button size="sm" onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add process
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea>
          <div className="min-w-[720px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sequence</TableHead>
                  <TableHead>Process</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processes.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      Loading processes…
                    </TableCell>
                  </TableRow>
                ) : processes.error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-rose-600">
                      {processes.error.message}
                    </TableCell>
                  </TableRow>
                ) : processes.records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      No processes captured yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  processes.records
                    .slice()
                    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
                    .map((process) => (
                      <TableRow key={process.id}>
                        <TableCell className="text-sm text-muted-foreground">{process.sequence ?? "—"}</TableCell>
                        <TableCell className="font-medium">{process.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{process.description ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={process.is_active ? statusBadge.Active : statusBadge.Inactive}>
                            {process.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <RowActions onEdit={() => onEdit(process)} onDelete={() => onDelete(process)} />
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

type BomSectionProps = SectionProps<BomTemplateRecord>;

const BomSection = ({ onCreate, onEdit, onDelete }: BomSectionProps) => {
  const { bomTemplates, items, processes } = useMastersData();
  const [searchTerm, setSearchTerm] = useState("");
  const [processFilter, setProcessFilter] = useState("all");

  const processDirectory = useMemo(() => {
    return processes.records.reduce<Record<string, ProcessRecord>>((acc, process) => {
      acc[process.id] = process;
      return acc;
    }, {});
  }, [processes.records]);

  const itemDirectory = useMemo(() => {
    return items.records.reduce<Record<string, ItemRecord>>((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [items.records]);

  const filtered = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return bomTemplates.records.filter((template) => {
      const processName = template.process?.name ?? processDirectory[template.process_id ?? ""]?.name ?? "";
      const outputItem = template.output_item_id ? itemDirectory[template.output_item_id] : null;
      const matchesProcess = processFilter === "all" || processName === processFilter;
      const matchesSearch =
        !normalized ||
        template.code.toLowerCase().includes(normalized) ||
        template.name.toLowerCase().includes(normalized) ||
        processName.toLowerCase().includes(normalized) ||
        template.components.some((component) => component.item?.name?.toLowerCase().includes(normalized) ?? false) ||
        (outputItem?.name ?? "").toLowerCase().includes(normalized);
      return matchesProcess && matchesSearch;
    });
  }, [bomTemplates.records, itemDirectory, processDirectory, processFilter, searchTerm]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle>BOM templates</CardTitle>
          <CardDescription>Define component breakdowns for finished goods.</CardDescription>
        </div>
        <Button size="sm" onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" /> New template
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary">Showing: {filtered.length}</Badge>
            {(searchTerm || processFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setProcessFilter("all");
                }}
              >
                Reset filters
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search template, item, or process"
              className="w-full sm:w-[260px]"
            />
            <Select value={processFilter} onValueChange={setProcessFilter}>
              <SelectTrigger className="sm:w-[220px]">
                <SelectValue placeholder="Filter process" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All processes</SelectItem>
                {processes.records.map((process) => (
                  <SelectItem key={process.id} value={process.name}>
                    {process.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4">
          {bomTemplates.isLoading ? (
            <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              Loading templates…
            </div>
          ) : bomTemplates.error ? (
            <div className="rounded-lg border border-dashed bg-rose-100/60 p-6 text-center text-sm text-rose-700">
              {bomTemplates.error.message}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              No BOM templates captured yet.
            </div>
          ) : (
            filtered.map((template) => {
              const outputItem = template.output_item_id ? itemDirectory[template.output_item_id] : null;
              const processName = template.process?.name ?? processDirectory[template.process_id ?? ""]?.name ?? "—";

              return (
                <Card key={template.id} className="border border-dashed bg-card/60">
                  <CardContent className="space-y-4 py-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Code</p>
                        <h3 className="text-lg font-semibold leading-tight">{template.code}</h3>
                        <p className="text-sm text-muted-foreground">{template.name}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className={template.is_active ? statusBadge.Active : statusBadge.Inactive}>
                          {template.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Output item</p>
                        <div className="rounded-lg border bg-muted/30 px-3 py-2">
                          <p className="font-medium">{outputItem?.name ?? "Unmapped"}</p>
                          <p className="text-xs text-muted-foreground">{outputItem?.sku ?? "No SKU mapped"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Process</p>
                        <div className="rounded-lg border bg-muted/30 px-3 py-2">
                          <p className="font-medium">{processName}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Components</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {template.components.length === 0 ? (
                          <div className="rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                            No components listed.
                          </div>
                        ) : (
                          template.components.map((component) => (
                            <div key={component.id} className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm">
                              <span>{component.item?.name ?? "Unknown item"}</span>
                              <span className="text-muted-foreground">
                                {component.expected_quantity ?? "—"} {component.unit}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Last updated: {new Date(template.updated_at).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onEdit(template)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(template)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

type RowActionsProps = {
  onEdit: () => void;
  onDelete: () => void;
};

const RowActions = ({ onEdit, onDelete }: RowActionsProps) => {
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
        <div className="absolute right-0 top-9 z-30 w-36 rounded-md border bg-popover p-1 shadow-md">
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
};

type MasterFormDialogProps = {
  state: DialogState;
  onClose: () => void;
  onSuccess: (entity: FormEntity) => Promise<void>;
};

const MasterFormDialog = ({ state, onClose, onSuccess }: MasterFormDialogProps) => {
  const { open, entity, mode, record } = state;

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {entity === "item" ? (
          <ItemForm mode={mode} record={record as ItemRecord | null} onSuccess={() => onSuccess("item")} onCancel={onClose} />
        ) : entity === "uom" ? (
          <UomForm mode={mode} record={record as UomRecord | null} onSuccess={() => onSuccess("uom")} onCancel={onClose} />
        ) : entity === "worker" ? (
          <WorkerForm mode={mode} record={record as WorkerRecord | null} onSuccess={() => onSuccess("worker")} onCancel={onClose} />
        ) : entity === "process" ? (
          <ProcessForm mode={mode} record={record as ProcessRecord | null} onSuccess={() => onSuccess("process")} onCancel={onClose} />
        ) : (
          <BomForm mode={mode} record={record as BomTemplateRecord | null} onSuccess={() => onSuccess("bom")} onCancel={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
};

type MasterActionDialogProps = {
  state: ActionState;
  onCancel: () => void;
  onConfirm: () => void;
};

const MasterActionDialog = ({ state, onCancel, onConfirm }: MasterActionDialogProps) => {
  const { open, entity } = state;
  const label =
    entity === "item"
      ? "item"
      : entity === "uom"
      ? "unit of measure"
      : entity === "worker"
      ? "worker"
      : entity === "process"
      ? "process"
      : "BOM template";

  return (
    <AlertDialog open={open} onOpenChange={(next) => (!next ? onCancel() : null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {label}</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. All references to the {label} will no longer be available for new transactions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

type ItemFormValues = {
  sku: string;
  name: string;
  category: string;
  unit: string;
  unitCost: string;
  reorderLevel: string;
  status: string;
  vendor: string;
  notes: string;
};

type ItemFormProps = {
  mode: FormMode;
  record: ItemRecord | null;
  onSuccess: () => Promise<void>;
  onCancel: () => void;
};

const ItemForm = ({ mode, record, onSuccess, onCancel }: ItemFormProps) => {
  const defaults: ItemFormValues = {
    sku: record?.sku ?? "",
    name: record?.name ?? "",
    category: record?.category ?? "",
    unit: record?.unit ?? "",
    unitCost: record?.unit_cost != null ? String(record.unit_cost) : "",
    reorderLevel: record?.reorder_level != null ? String(record.reorder_level) : "",
    status: record?.status ?? "",
    vendor: record?.vendor ?? "",
    notes: record?.notes ?? "",
  };

  const form = useForm<ItemFormValues>({ defaultValues: defaults });
  const [error, setError] = useState<string | null>(null);
  const { uoms } = useMastersData();

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      if (mode === "create") {
        await request<ItemRecord>("/api/items", {
          method: "POST",
          body: JSON.stringify({
            sku: values.sku,
            name: values.name,
            category: values.category || undefined,
            unit: values.unit,
            unitCost: values.unitCost ? Number(values.unitCost) : undefined,
            reorderLevel: values.reorderLevel ? Number(values.reorderLevel) : undefined,
            status: values.status || undefined,
            vendor: values.vendor || undefined,
            notes: values.notes || undefined,
          }),
        });
      } else if (record) {
        await request<ItemRecord>(`/api/items/${record.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            sku: values.sku,
            name: values.name,
            category: values.category || null,
            unit: values.unit,
            unitCost: values.unitCost ? Number(values.unitCost) : null,
            reorderLevel: values.reorderLevel ? Number(values.reorderLevel) : null,
            status: values.status || null,
            vendor: values.vendor || null,
            notes: values.notes || null,
          }),
        });
      }
      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save item");
    }
  });

  return (
    <>
      <DialogHeader className="space-y-2">
        <DialogTitle>{mode === "create" ? "Create item" : "Edit item"}</DialogTitle>
        <DialogDescription>Define catalogue, costing, and sourcing information.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="sku"
              rules={{ required: "SKU is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. RM-COT-20D" {...field} disabled={mode === "edit"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Item name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Category" {...field} />
                  </FormControl>
                  <FormDescription>Use categories to group items in reports.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unit"
              rules={{ required: "Unit is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {uoms.records.map((uom) => (
                        <SelectItem key={uom.id} value={uom.code}>
                          {uom.code.toUpperCase()} – {uom.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unitCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit cost</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g. 45.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reorderLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reorder level</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g. 200" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {itemStatusOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <FormControl>
                    <Input placeholder="Supplier name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Additional handling or sourcing notes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{mode === "create" ? "Create item" : "Save changes"}</Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};

type UomFormValues = {
  code: string;
  name: string;
  type: string;
  precision: string;
  status: string;
  description: string;
};

type UomFormProps = {
  mode: FormMode;
  record: UomRecord | null;
  onSuccess: () => Promise<void>;
  onCancel: () => void;
};

const UomForm = ({ mode, record, onSuccess, onCancel }: UomFormProps) => {
  const defaults: UomFormValues = {
    code: record?.code ?? "",
    name: record?.name ?? "",
    type: record?.type ?? "",
    precision: record?.precision != null ? String(record.precision) : "",
    status: record ? (record.is_active ? "Active" : "Inactive") : "Active",
    description: record?.description ?? "",
  };

  const form = useForm<UomFormValues>({ defaultValues: defaults });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      if (mode === "create") {
        await request<UomRecord>("/api/uoms", {
          method: "POST",
          body: JSON.stringify({
            code: values.code,
            name: values.name,
            type: values.type || undefined,
            precision: values.precision ? Number(values.precision) : undefined,
            status: values.status || undefined,
            description: values.description || undefined,
          }),
        });
      } else if (record) {
        await request<UomRecord>(`/api/uoms/${record.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            code: values.code,
            name: values.name,
            type: values.type || null,
            precision: values.precision ? Number(values.precision) : null,
            status: values.status || null,
            description: values.description || null,
          }),
        });
      }
      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save unit");
    }
  });

  return (
    <>
      <DialogHeader className="space-y-2">
        <DialogTitle>{mode === "create" ? "Create unit of measure" : "Edit unit of measure"}</DialogTitle>
        <DialogDescription>Standardise measurement units across catalogue and transactions.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="code"
              rules={{ required: "Code is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="kg" {...field} disabled={mode === "edit"} className="uppercase" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Kilogram" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {uomTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="precision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precision</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Guidance on when to use this unit" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{mode === "create" ? "Create unit" : "Save changes"}</Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};

type WorkerFormValues = {
  code: string;
  name: string;
  role: string;
  department: string;
  shift: string;
  status: string;
  contact: string;
  skills: string;
};

type WorkerFormProps = {
  mode: FormMode;
  record: WorkerRecord | null;
  onSuccess: () => Promise<void>;
  onCancel: () => void;
};

const WorkerForm = ({ mode, record, onSuccess, onCancel }: WorkerFormProps) => {
  const defaults: WorkerFormValues = {
    code: record?.code ?? "",
    name: record?.display_name ?? "",
    role: record?.role ?? "",
    department: record?.department ?? "",
    shift: record?.shift ?? "",
    status: record?.status ?? "Active",
    contact: record?.contact ?? "",
    skills: record?.skills ?? "",
  };

  const form = useForm<WorkerFormValues>({ defaultValues: defaults });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      if (mode === "create") {
        await request<WorkerRecord>("/api/workers", {
          method: "POST",
          body: JSON.stringify({
            code: values.code,
            name: values.name,
            role: values.role || undefined,
            department: values.department || undefined,
            shift: values.shift || undefined,
            status: values.status || undefined,
            contact: values.contact || undefined,
            skills: values.skills || undefined,
          }),
        });
      } else if (record) {
        await request<WorkerRecord>(`/api/workers/${record.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            code: values.code,
            name: values.name,
            role: values.role || null,
            department: values.department || null,
            shift: values.shift || null,
            status: values.status || null,
            contact: values.contact || null,
            skills: values.skills || null,
          }),
        });
      }
      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save worker");
    }
  });

  return (
    <>
      <DialogHeader className="space-y-2">
        <DialogTitle>{mode === "create" ? "Create worker" : "Edit worker"}</DialogTitle>
        <DialogDescription>Record operator details for scheduling and compliance.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="code"
              rules={{ required: "Code is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="EMP-001" {...field} disabled={mode === "edit"} className="uppercase" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Input placeholder="Operator role" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input placeholder="Department" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shift"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shift</FormLabel>
                  <FormControl>
                    <Input placeholder="Shift" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workerStatusOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone or email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="skills"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Skills</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Comma separated skills" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{mode === "create" ? "Create worker" : "Save changes"}</Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};

type ProcessFormValues = {
  slug: string;
  name: string;
  description: string;
  sequence: string;
  isActive: boolean;
};

type ProcessFormProps = {
  mode: FormMode;
  record: ProcessRecord | null;
  onSuccess: () => Promise<void>;
  onCancel: () => void;
};

const ProcessForm = ({ mode, record, onSuccess, onCancel }: ProcessFormProps) => {
  const defaults: ProcessFormValues = {
    slug: record?.slug ?? "",
    name: record?.name ?? "",
    description: record?.description ?? "",
    sequence: record?.sequence != null ? String(record.sequence) : "",
    isActive: record?.is_active ?? true,
  };

  const form = useForm<ProcessFormValues>({ defaultValues: defaults });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      if (mode === "create") {
        await request<ProcessRecord>("/api/processes", {
          method: "POST",
          body: JSON.stringify({
            slug: values.slug,
            name: values.name,
            description: values.description || undefined,
            sequence: values.sequence ? Number(values.sequence) : undefined,
            isActive: values.isActive,
          }),
        });
      } else if (record) {
        await request<ProcessRecord>(`/api/processes/${record.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            slug: values.slug,
            name: values.name,
            description: values.description || null,
            sequence: values.sequence ? Number(values.sequence) : null,
            isActive: values.isActive,
          }),
        });
      }
      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save process");
    }
  });

  return (
    <>
      <DialogHeader className="space-y-2">
        <DialogTitle>{mode === "create" ? "Create process" : "Edit process"}</DialogTitle>
        <DialogDescription>Document manufacturing stages with sequencing and notes.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="slug"
              rules={{ required: "Slug is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="primary-twisting" {...field} disabled={mode === "edit"} />
                  </FormControl>
                  <FormDescription>Lowercase with hyphens. Used for URLs and references.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Process name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sequence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sequence</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Order index" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-col justify-end">
                  <FormLabel>Status</FormLabel>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={field.value ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => field.onChange(true)}
                    >
                      Active
                    </Button>
                    <Button
                      type="button"
                      variant={!field.value ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => field.onChange(false)}
                    >
                      Inactive
                    </Button>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea rows={4} placeholder="Process notes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{mode === "create" ? "Create process" : "Save changes"}</Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};

type BomComponentFormValues = {
  itemId: string;
  unit: string;
  expectedQuantity: string;
};

type BomFormValues = {
  code: string;
  name: string;
  processId: string;
  outputItemId: string;
  outputQuantity: string;
  instructions: string;
  isActive: boolean;
  components: BomComponentFormValues[];
};

type BomFormProps = {
  mode: FormMode;
  record: BomTemplateRecord | null;
  onSuccess: () => Promise<void>;
  onCancel: () => void;
};

const BomForm = ({ mode, record, onSuccess, onCancel }: BomFormProps) => {
  const { items, processes } = useMastersData();
  const defaults: BomFormValues = {
    code: record?.code ?? "",
    name: record?.name ?? "",
    processId: record?.process_id ?? record?.process?.id ?? "",
    outputItemId: record?.output_item_id ?? "",
    outputQuantity: record?.output_quantity != null ? String(record.output_quantity) : "",
    instructions: record?.instructions ?? "",
    isActive: record?.is_active ?? true,
    components:
      record?.components?.map((component) => ({
        itemId: component.item?.id ?? "",
        unit: component.unit,
        expectedQuantity: component.expected_quantity != null ? String(component.expected_quantity) : "",
      })) ?? [{ itemId: "", unit: "", expectedQuantity: "" }],
  };

  const form = useForm<BomFormValues>({ defaultValues: defaults });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "components" });
  const [error, setError] = useState<string | null>(null);

  const addComponent = useCallback(() => {
    append({ itemId: "", unit: "", expectedQuantity: "" });
  }, [append]);

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const payload = {
        code: values.code,
        name: values.name,
        processId: values.processId,
        outputItemId: values.outputItemId || undefined,
        outputQuantity: values.outputQuantity ? Number(values.outputQuantity) : undefined,
        instructions: values.instructions || undefined,
        isActive: values.isActive,
        components: values.components
          .filter((component) => component.itemId && component.unit)
          .map((component, index) => ({
            itemId: component.itemId,
            unit: component.unit,
            expectedQuantity: component.expectedQuantity ? Number(component.expectedQuantity) : undefined,
            position: index,
          })),
      };

      if (mode === "create") {
        await request<BomTemplateRecord>("/api/bom/templates", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else if (record) {
        await request<BomTemplateRecord>(`/api/bom/templates/${record.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }

      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save template");
    }
  });

  return (
    <>
      <DialogHeader className="space-y-2">
        <DialogTitle>{mode === "create" ? "Create BOM template" : "Edit BOM template"}</DialogTitle>
        <DialogDescription>Capture standard component breakdowns and SOP guidance.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="code"
              rules={{ required: "Code is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="BOM-001" {...field} disabled={mode === "edit"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Template name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="processId"
              rules={{ required: "Process is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Process</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select process" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {processes.records.map((process) => (
                        <SelectItem key={process.id} value={process.id}>
                          {process.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="outputItemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Output item</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {items.records.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="outputQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Output quantity</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g. 500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-col justify-end">
                  <FormLabel>Status</FormLabel>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={field.value ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => field.onChange(true)}
                    >
                      Active
                    </Button>
                    <Button
                      type="button"
                      variant={!field.value ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => field.onChange(false)}
                    >
                      Inactive
                    </Button>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="components"
            rules={{
              validate: (value) => value.some((component) => component.itemId && component.unit) || "Add at least one component",
            }}
            render={({ field }) => (
              <FormItem>
                {void field}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <FormLabel>Components</FormLabel>
                    <FormDescription>List items required for this template.</FormDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addComponent}>
                    Add component
                  </Button>
                </div>
                <div className="space-y-3">
                  {fields.map((component, index) => (
                    <div
                      key={component.id}
                      className="grid gap-3 sm:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"
                    >
                      <FormField
                        control={form.control}
                        name={`components.${index}.itemId` as const}
                        rules={{ required: "Select an item" }}
                        render={({ field: itemField }) => (
                          <FormItem>
                            {index === 0 && <FormLabel className="sm:hidden">Item</FormLabel>}
                            <Select value={itemField.value} onValueChange={itemField.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select item" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {items.records.map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.name} ({item.sku})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`components.${index}.expectedQuantity` as const}
                        rules={{ required: "Quantity" }}
                        render={({ field: qtyField }) => (
                          <FormItem>
                            {index === 0 && <FormLabel className="sm:hidden">Quantity</FormLabel>}
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="e.g. 25" {...qtyField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`components.${index}.unit` as const}
                        rules={{ required: "Unit" }}
                        render={({ field: unitField }) => (
                          <FormItem>
                            {index === 0 && <FormLabel className="sm:hidden">Unit</FormLabel>}
                            <FormControl>
                              <Input placeholder="kg" {...unitField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        aria-label="Remove component"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="instructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructions</FormLabel>
                <FormControl>
                  <Textarea rows={4} placeholder="SOP or production notes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{mode === "create" ? "Create template" : "Save changes"}</Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};
