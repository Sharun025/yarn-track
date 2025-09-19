"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { MoreHorizontal, X } from "lucide-react";

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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { itemMaster } from "@/lib/mock-item-master";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const itemMetrics = [
  { title: "Active SKUs", value: 128, meta: "12 awaiting approval" },
  { title: "Avg. unit cost", value: "₹42.70", meta: "Weighted across all items" },
  { title: "Low stock items", value: 9, meta: "Below reorder threshold" },
  { title: "Featured vendors", value: 6, meta: "Preferred supply partners" },
];

const items = itemMaster;

const processes = [
  {
    name: "Soaking",
    summary: "Condition silk cocoons in controlled vats to set moisture evenly before winding.",
    workers: ["EMP-DYE-01", "EMP-DYE-02"],
    hasTransactions: true,
  },
  {
    name: "Hank Winding",
    summary: "Wind soaked filament onto hanks while monitoring denier and strand tension.",
    workers: ["EMP-SPN-01", "EMP-SPN-02"],
    hasTransactions: true,
  },
  {
    name: "Assembly Winding",
    summary: "Combine individual ends into balanced packages ready for twisting operations.",
    workers: ["EMP-WVG-02", "EMP-QC-02"],
    hasTransactions: false,
  },
  {
    name: "Primary Twisting",
    summary: "Apply first level twist to build ply strength and set twist direction.",
    workers: ["EMP-SPN-01", "EMP-WVG-01"],
    hasTransactions: true,
  },
  {
    name: "Secondary Twisting",
    summary: "Equalize and lock primary twist with counter rotations for stability.",
    workers: ["EMP-WVG-01", "EMP-QC-01"],
    hasTransactions: true,
  },
  {
    name: "Vacuum Heat Setting",
    summary: "Stabilize twisted yarn under vacuum and heat to fix the final twist profile.",
    workers: ["EMP-DYE-01", "EMP-QC-02"],
    hasTransactions: true,
  },
  {
    name: "Re Winding",
    summary: "Rewind treated yarn to remove tension spikes and prepare for downstream winding.",
    workers: ["EMP-SPN-02", "EMP-WVG-02"],
    hasTransactions: false,
  },
  {
    name: "Pirn Winding",
    summary: "Transfer yarn onto pirns with consistent build for shuttle insertion.",
    workers: ["EMP-WVG-01", "EMP-WVG-02"],
    hasTransactions: true,
  },
  {
    name: "Silk Warping",
    summary: "Arrange pirned yarn into warp beams with precise tension and end distribution.",
    workers: ["EMP-WVG-01", "EMP-QC-02"],
    hasTransactions: true,
  }
];

const bomTemplates = [
  {
    id: "BOM-SLK-NTW-001",
    outputItem: "SFG-SLK-NTW-30D-HNK",
    process: "Hank Winding",
    outputQuantity: "500",
    components: [
      { item: "SFG-SLK-NTW-30D-SOK", quantity: "480" },
      { item: "SFG-SLK-STW-30D-2PLY-ASW", quantity: "20" },
    ],
    sop:
      "1. Soak reeled silk hanks in pre-heated vats.\n2. Wind onto assembly frames with uniform tension.\n3. Air dry and QA for denier consistency before release.",
    hasTransactions: true,
    lastUpdated: "18 Sep 2024",
    updatedBy: "Harita Bose",
  },
  {
    id: "BOM-SLK-STW-001",
    outputItem: "SFG-SLK-STW-30D-2PLY-TPI55-VHS",
    process: "Vacuum Heat Setting",
    outputQuantity: "320",
    components: [
      { item: "SFG-SLK-STW-30D-2PLY-TPI55-PW", quantity: "300" },
      { item: "SFG-SLK-STW-30D-2PLY-TPI55-RW", quantity: "20" },
    ],
    sop:
      "1. Load primary pirns and set twist direction.\n2. Run vacuum heat setting cycle for 18 minutes.\n3. Inspect twist stability and log variance before storage.",
    hasTransactions: false,
    lastUpdated: "22 Sep 2024",
    updatedBy: "Nikhil Sharma",
  },
  {
    id: "BOM-SLK-ZTW-001",
    outputItem: "SFG-SLK-ZTW-30D-2PLY-TPI55-VHS",
    process: "Silk Warping",
    outputQuantity: "300",
    components: [
      { item: "SFG-SLK-ZTW-30D-2PLY-TPI55-TFOS", quantity: "280" },
      { item: "SFG-SLK-ZTW-30D-2PLY-ASW", quantity: "20" },
    ],
    sop:
      "1. Condition Z-twist spindles and balance creel load.\n2. Execute secondary twist pass and vacuum heat set.\n3. Cool under controlled humidity before QA release.",
    hasTransactions: true,
    lastUpdated: "24 Sep 2024",
    updatedBy: "Pranitha Rao",
  },
];

const workers = [
  {
    code: "EMP-SPN-01",
    name: "Anita Rao",
    role: "Senior Spinning Operator",
    department: "Spinning",
    shift: "Shift A",
    status: "Active",
    contact: "+91 98765 43210",
    skills: "Autoconer, Blowroom setup",
    hasTransactions: true,
  },
  {
    code: "EMP-SPN-02",
    name: "Vikram Iyer",
    role: "Carding Technician",
    department: "Spinning",
    shift: "Shift B",
    status: "Active",
    contact: "+91 91234 56780",
    skills: "Carding maintenance, Drawing frame",
    hasTransactions: false,
  },
  {
    code: "EMP-QC-01",
    name: "Sahana Gupta",
    role: "Quality Inspector",
    department: "Quality",
    shift: "Shift A",
    status: "On leave",
    contact: "+91 93450 12876",
    skills: "Inline testing, Cotton fibre QA",
    hasTransactions: false,
  },
  {
    code: "EMP-DYE-01",
    name: "Karthik Menon",
    role: "Dye House Specialist",
    department: "Dyeing",
    shift: "Shift B",
    status: "Active",
    contact: "+91 98231 44567",
    skills: "Vat dyeing, Colour matching",
    hasTransactions: true,
  },
  {
    code: "EMP-DYE-02",
    name: "Leena Das",
    role: "Lab Technician",
    department: "Dyeing",
    shift: "Shift A",
    status: "Active",
    contact: "+91 90011 22445",
    skills: "Shade cards, Lab dips",
    hasTransactions: false,
  },
  {
    code: "EMP-WVG-01",
    name: "Raghav Kapoor",
    role: "Weaving Supervisor",
    department: "Weaving",
    shift: "Shift A",
    status: "Active",
    contact: "+91 90123 45678",
    skills: "Loom setup, Warp alignment",
    hasTransactions: true,
  },
  {
    code: "EMP-WVG-02",
    name: "Fariha Khan",
    role: "Loom Operator",
    department: "Weaving",
    shift: "Shift C",
    status: "Active",
    contact: "+91 99800 11223",
    skills: "Projectile looms, Preventive upkeep",
    hasTransactions: false,
  },
  {
    code: "EMP-QC-02",
    name: "Manoj Patel",
    role: "Quality Analyst",
    department: "Quality",
    shift: "Shift B",
    status: "Active",
    contact: "+91 91567 89012",
    skills: "Fabric inspection, Shade evaluation",
    hasTransactions: true,
  }
];

const uoms = [
  {
    code: "kg",
    name: "Kilogram",
    type: "Weight",
    precision: "3",
    status: "Active",
    description: "Standard for yarn weight",
    hasTransactions: true,
  },
  {
    code: "cone",
    name: "Cone",
    type: "Count",
    precision: "0",
    status: "Active",
    description: "Individual yarn cone",
    hasTransactions: false,
  },
  {
    code: "bobbin",
    name: "Bobbin",
    type: "Count",
    precision: "0",
    status: "Inactive",
    description: "Legacy winding bobbin",
    hasTransactions: false,
  },
  {
    code: "litre",
    name: "Litre",
    type: "Volume",
    precision: "2",
    status: "Active",
    description: "Liquids and chemical solutions",
    hasTransactions: true,
  }
];

const itemCategories = ["Raw material", "Chemicals", "Packing", "Consumable"];
const itemStatuses = ["Active", "Reorder", "Watch", "Inactive"];
const processOptions = processes.map((process) => process.name);
const uomTypes = ["Weight", "Length", "Count", "Volume", "Area"];
const uomStatuses = ["Active", "Inactive"];
const uomOptions = uoms.map((unit) => ({ code: unit.code, name: unit.name, status: unit.status }));
const workerStatuses = ["Active", "On leave", "Inactive"];
const workerOptions = workers.map((worker) => ({
  code: worker.code,
  name: worker.name,
  role: worker.role,
  status: worker.status,
  department: worker.department,
}));
const workerDirectory = workers.reduce<Record<string, typeof workers[number]>>((acc, worker) => {
  acc[worker.code] = worker;
  return acc;
}, {});
const workerDepartments = Array.from(
  new Set(workers.map((worker) => worker.department).filter((dept): dept is string => Boolean(dept)))
).sort();
const itemOptions = items.map((item) => ({
  sku: item.sku,
  name: item.name,
  uom: item.uom,
}));
const itemDirectory = items.reduce<Record<string, typeof items[number]>>((acc, item) => {
  acc[item.sku] = item;
  return acc;
}, {});

const statusBadge: Record<string, string> = {
  Active: "border-transparent bg-emerald-100 text-emerald-700",
  Reorder: "border-transparent bg-amber-100 text-amber-700",
  Watch: "border-transparent bg-rose-100 text-rose-700",
  Inactive: "border-dashed bg-muted text-muted-foreground",
  "On leave": "border-transparent bg-amber-100 text-amber-700",
  Approved: "border-transparent bg-emerald-100 text-emerald-700",
  "Under review": "border-transparent bg-amber-100 text-amber-700",
  Draft: "border-dashed bg-muted text-muted-foreground",
};

type ItemFormValues = {
  sku: string;
  name: string;
  category: string;
  uom: string;
  reorder: string;
  status: string;
  notes: string;
};

type ProcessFormValues = {
  name: string;
  summary: string;
  workers: string[];
};

type BomComponentFormValues = {
  item: string;
  quantity: string;
};

type BomFormValues = {
  outputItem: string;
  process: string;
  outputQuantity: string;
  components: BomComponentFormValues[];
  sop: string;
};

type UomFormValues = {
  code: string;
  name: string;
  type: string;
  precision: string;
  status: string;
  description: string;
};

type WorkerFormValues = {
  code: string;
  name: string;
  role: string;
  department: string;
  shift: string;
  status: string;
  skills: string;
  contact: string;
};

type FormEntity = "item" | "process" | "bom" | "uom" | "worker";
type FormMode = "create" | "edit";

type DialogState = {
  open: boolean;
  entity: FormEntity;
  mode: FormMode;
  data?: Record<string, unknown> | null;
};

type ActionType = "delete" | "deactivate";

type ActionState = {
  open: boolean;
  entity: FormEntity;
  action: ActionType;
  record: Record<string, unknown> | null;
};

export default function MastersPage() {
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    entity: "item",
    mode: "create",
    data: null,
  });
  const [actionState, setActionState] = useState<ActionState>({
    open: false,
    entity: "item",
    action: "delete",
    record: null,
  });

  const openDialog = (
    entity: FormEntity,
    mode: FormMode,
    data?: Record<string, unknown>
  ) => {
    setDialogState({ open: true, entity, mode, data: data ?? null });
  };

  const closeDialog = () => setDialogState((prev) => ({ ...prev, open: false }));

  const openActionDialog = (entity: FormEntity, record: Record<string, unknown>) => {
    const hasTransactions = Boolean((record as { hasTransactions?: boolean }).hasTransactions);
    const action: ActionType = hasTransactions ? "deactivate" : "delete";
    setActionState({ open: true, entity, action, record });
  };

  const closeActionDialog = () => setActionState((prev) => ({ ...prev, open: false }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Masters</h1>
        <p className="text-sm text-muted-foreground">
          Maintain authoritative masters for items, production processes, and
          Bill of Materials to keep the factory floor in sync.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Master data overview</CardTitle>
          <CardDescription>Snapshot of coverage and pending actions.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {itemMetrics.map((metric) => (
            <div key={metric.title} className="rounded-lg border bg-card/60 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                {metric.title}
              </p>
              <p className="text-2xl font-semibold">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.meta}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Tabs defaultValue="items" className="space-y-6">
        <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-xl bg-muted p-1">
          <TabsTrigger value="items" className="px-4 py-2">
            Item Master
          </TabsTrigger>
          <TabsTrigger value="uom" className="px-4 py-2">
            UOM Master
          </TabsTrigger>
          <TabsTrigger value="workers" className="px-4 py-2">
            Worker Master
          </TabsTrigger>
          <TabsTrigger value="processes" className="px-4 py-2">
            Process Master
          </TabsTrigger>
          <TabsTrigger value="bom" className="px-4 py-2">
            BOM Master
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <ItemCatalogue
            onCreate={() => openDialog("item", "create")}
            onEdit={(record) => openDialog("item", "edit", record)}
            onAction={(record) => openActionDialog("item", record)}
          />
        </TabsContent>

        <TabsContent value="uom" className="space-y-4">
          <UomCatalogue
            onCreate={() => openDialog("uom", "create")}
            onEdit={(record) => openDialog("uom", "edit", record)}
            onAction={(record) => openActionDialog("uom", record)}
          />
        </TabsContent>

        <TabsContent value="workers" className="space-y-4">
          <WorkerCatalogue
            onCreate={() => openDialog("worker", "create")}
            onEdit={(record) => openDialog("worker", "edit", record)}
            onAction={(record) => openActionDialog("worker", record)}
          />
        </TabsContent>

        <TabsContent value="processes" className="space-y-4">
          <ProcessBlueprint
            onCreate={() => openDialog("process", "create")}
            onEdit={(record) => openDialog("process", "edit", record)}
            onAction={(record) => openActionDialog("process", record)}
          />
        </TabsContent>

        <TabsContent value="bom" className="space-y-4">
          <BomTemplates
            onCreate={() => openDialog("bom", "create")}
            onEdit={(record) => openDialog("bom", "edit", record)}
            onAction={(record) => openActionDialog("bom", record)}
          />
        </TabsContent>
      </Tabs>

      <MasterFormDialog state={dialogState} onClose={closeDialog} />
      <MasterActionDialog state={actionState} onClose={closeActionDialog} />
    </div>
  );
}

type ItemCatalogueProps = {
  onCreate: () => void;
  onEdit: (record: typeof items[number]) => void;
  onAction: (record: typeof items[number]) => void;
};

type RecordActionsProps = {
  onEdit: () => void;
  onAction: () => void;
  actionLabel: string;
  tone?: "default" | "destructive";
  actionDisabled?: boolean;
};

function RecordActions({ onEdit, onAction, actionLabel, tone = "default", actionDisabled }: RecordActionsProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleAction = (handler: () => void, disabled?: boolean) => () => {
    if (disabled) return;
    handler();
    setOpen(false);
  };

  const actionClasses = tone === "destructive" ? "text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10" : "";

  return (
    <div className="relative inline-flex">
      <Button
        ref={triggerRef}
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
          ref={menuRef}
          className="absolute right-0 top-9 z-30 w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          role="menu"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleAction(onEdit)}
          >
            Edit
          </Button>
          <div className="my-1 h-px bg-muted" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("w-full justify-start", actionClasses, actionDisabled && "pointer-events-none opacity-50")}
            onClick={handleAction(onAction, actionDisabled)}
          >
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ItemCatalogue({ onCreate, onEdit, onAction }: ItemCatalogueProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredItems = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !normalized ||
        item.sku.toLowerCase().includes(normalized) ||
        item.name.toLowerCase().includes(normalized) ||
        item.vendor.toLowerCase().includes(normalized);

      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [categoryFilter, searchTerm, statusFilter]);

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle>Item catalogue</CardTitle>
          <CardDescription>
            Central registry of materials, consumables, and packaging with reorder visibility.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onCreate}>
            Add item
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              Showing: {filteredItems.length}
            </Badge>
            {(searchTerm || categoryFilter !== "all" || statusFilter !== "all") && (
              <Button size="sm" variant="ghost" onClick={resetFilters}>
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Filter category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {itemCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-[160px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {itemStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-center">Reorder</TableHead>
              <TableHead>Unit cost</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.sku}>
                <TableCell className="font-medium">{item.sku}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p>{item.name}</p>
                    <p className="text-xs text-muted-foreground">UOM: {item.uom}</p>
                  </div>
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell className="text-center">{item.stock}</TableCell>
                <TableCell className="text-center">{item.reorder}</TableCell>
                <TableCell>{item.unitCost}</TableCell>
                <TableCell>{item.vendor}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusBadge[item.status]}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <RecordActions
                    onEdit={() => onEdit(item)}
                    onAction={() => onAction(item)}
                    actionLabel={item.hasTransactions ? "Deactivate" : "Delete"}
                    tone={item.hasTransactions ? "default" : "destructive"}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
          Reminder: Items flagged as <span className="font-medium text-amber-700">Reorder</span> appear on the procurement dashboard and trigger supply chain notifications.
        </div>
      </CardContent>
    </Card>
  );
}

type UomCatalogueProps = {
  onCreate: () => void;
  onEdit: (record: typeof uoms[number]) => void;
  onAction: (record: typeof uoms[number]) => void;
};

function UomCatalogue({ onCreate, onEdit, onAction }: UomCatalogueProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredUoms = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return uoms.filter((unit) => {
      const matchesSearch =
        !normalized ||
        unit.code.toLowerCase().includes(normalized) ||
        unit.name.toLowerCase().includes(normalized) ||
        unit.description.toLowerCase().includes(normalized);
      const matchesType = typeFilter === "all" || unit.type === typeFilter;
      const matchesStatus = statusFilter === "all" || unit.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchTerm, statusFilter, typeFilter]);

  const resetFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle>Unit of measure catalogue</CardTitle>
          <CardDescription>Standardize how inventory and processes record quantities.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onCreate}>
            Add unit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              Showing: {filteredUoms.length}
            </Badge>
            {(searchTerm || typeFilter !== "all" || statusFilter !== "all") && (
              <Button size="sm" variant="ghost" onClick={resetFilters}>
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
                {uomTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-[160px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {uomStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Precision</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUoms.map((unit) => (
              <TableRow key={unit.code}>
                <TableCell className="font-medium uppercase">{unit.code}</TableCell>
                <TableCell>{unit.name}</TableCell>
                <TableCell>{unit.type}</TableCell>
                <TableCell className="text-center">{unit.precision}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusBadge[unit.status]}>
                    {unit.status}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[280px] text-sm text-muted-foreground">
                  {unit.description}
                </TableCell>
                <TableCell className="text-right">
                  <RecordActions
                    onEdit={() => onEdit(unit)}
                    onAction={() => onAction(unit)}
                    actionLabel={unit.hasTransactions ? "Deactivate" : "Delete"}
                    tone={unit.hasTransactions ? "default" : "destructive"}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
          Tip: Keep only active units available for item selection. Deactivate legacy units instead of deleting them to preserve historical transactions.
        </div>
      </CardContent>
    </Card>
  );
}

type WorkerCatalogueProps = {
  onCreate: () => void;
  onEdit: (record: typeof workers[number]) => void;
  onAction: (record: typeof workers[number]) => void;
};

function WorkerCatalogue({ onCreate, onEdit, onAction }: WorkerCatalogueProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredWorkers = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return workers.filter((worker) => {
      const matchesSearch =
        !normalized ||
        worker.code.toLowerCase().includes(normalized) ||
        worker.name.toLowerCase().includes(normalized) ||
        worker.role.toLowerCase().includes(normalized) ||
        worker.department.toLowerCase().includes(normalized) ||
        worker.skills.toLowerCase().includes(normalized);
      const matchesDepartment =
        departmentFilter === "all" || worker.department === departmentFilter;
      const matchesStatus = statusFilter === "all" || worker.status === statusFilter;
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [departmentFilter, searchTerm, statusFilter]);

  const resetFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("all");
    setStatusFilter("all");
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle>Worker directory</CardTitle>
          <CardDescription>Maintain the roster of operators and inspectors available for allocation.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onCreate}>
            Add worker
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              Showing: {filteredWorkers.length}
            </Badge>
            {(searchTerm || departmentFilter !== "all" || statusFilter !== "all") && (
              <Button size="sm" variant="ghost" onClick={resetFilters}>
                Reset filters
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, role, or code"
              className="w-full sm:w-[240px]"
            />
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Filter department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {workerDepartments.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-[160px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {workerStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWorkers.map((worker) => (
              <TableRow key={worker.code}>
                <TableCell className="font-medium uppercase">{worker.code}</TableCell>
                <TableCell>{worker.name}</TableCell>
                <TableCell>{worker.role}</TableCell>
                <TableCell>{worker.department}</TableCell>
                <TableCell>{worker.shift}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusBadge[worker.status]}>
                    {worker.status}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[280px] text-sm text-muted-foreground">
                  {worker.skills}
                </TableCell>
                <TableCell className="text-right">
                  <RecordActions
                    onEdit={() => onEdit(worker)}
                    onAction={() => onAction(worker)}
                    actionLabel={worker.hasTransactions ? "Deactivate" : "Delete"}
                    tone={worker.hasTransactions ? "default" : "destructive"}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
          Keep profiles updated so process owners can confidently assign the right operators and inspectors per shift.
        </div>
      </CardContent>
    </Card>
  );
}

type ProcessBlueprintProps = {
  onCreate: () => void;
  onEdit: (record: typeof processes[number]) => void;
  onAction: (record: typeof processes[number]) => void;
};

function ProcessBlueprint({ onCreate, onEdit, onAction }: ProcessBlueprintProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [workerFilter, setWorkerFilter] = useState("all");

  const filteredProcesses = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return processes.filter((process) => {
      const matchesSearch =
        !normalized ||
        process.name.toLowerCase().includes(normalized) ||
        process.summary.toLowerCase().includes(normalized);
      const matchesWorker =
        workerFilter === "all" || process.workers.includes(workerFilter);
      return matchesSearch && matchesWorker;
    });
  }, [searchTerm, workerFilter]);

  const resetFilters = () => {
    setSearchTerm("");
    setWorkerFilter("all");
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle>Process blueprint</CardTitle>
          <CardDescription>
            Capture process context and assign the right shop-floor teams.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onCreate}>
            Add process
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              Showing: {filteredProcesses.length}
            </Badge>
            {(searchTerm || workerFilter !== "all") && (
              <Button size="sm" variant="ghost" onClick={resetFilters}>
                Reset filters
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search process or summary"
              className="w-full sm:w-[240px]"
            />
            <Select value={workerFilter} onValueChange={setWorkerFilter}>
              <SelectTrigger className="sm:w-[220px]">
                <SelectValue placeholder="Filter by worker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All workers</SelectItem>
                {workerOptions.map((worker) => (
                  <SelectItem key={worker.code} value={worker.code}>
                    {worker.name} ({worker.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredProcesses.map((process) => {
          const assigned = process.workers
            .map((code) => workerDirectory[code])
            .filter((worker): worker is typeof workers[number] => Boolean(worker));

          return (
            <Card key={process.name} className="border border-dashed bg-card/60">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{process.name}</CardTitle>
                  <CardDescription>{process.summary}</CardDescription>
                </div>
                <div className="flex items-start">
                  <RecordActions
                    onEdit={() => onEdit(process)}
                    onAction={() => onAction(process)}
                    actionLabel={process.hasTransactions ? "Deactivate" : "Delete"}
                    tone={process.hasTransactions ? "default" : "destructive"}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {assigned.length > 0 ? (
                    assigned.map((worker) => (
                      <Badge key={worker.code} variant="outline" className="gap-1">
                        <span className="font-medium uppercase">{worker.code}</span>
                        <span>·</span>
                        <span>{worker.name}</span>
                        <span className="text-xs text-muted-foreground">({worker.role})</span>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No workers allocated yet.</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}

type BomTemplatesProps = {
  onCreate: () => void;
  onEdit: (record: typeof bomTemplates[number]) => void;
  onAction: (record: typeof bomTemplates[number]) => void;
};

function BomTemplates({ onCreate, onEdit, onAction }: BomTemplatesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [processFilter, setProcessFilter] = useState("all");

  const filteredTemplates = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    return bomTemplates.filter((template) => {
      const outputItem = itemDirectory[template.outputItem];
      const matchesProcess = processFilter === "all" || template.process === processFilter;

      const matchesSearch =
        !normalized ||
        template.process.toLowerCase().includes(normalized) ||
        template.sop.toLowerCase().includes(normalized) ||
        template.components.some((component) => component.item.toLowerCase().includes(normalized)) ||
        (outputItem &&
          (outputItem.name.toLowerCase().includes(normalized) ||
            outputItem.sku.toLowerCase().includes(normalized)));

      return matchesProcess && matchesSearch;
    });
  }, [processFilter, searchTerm]);

  const resetFilters = () => {
    setSearchTerm("");
    setProcessFilter("all");
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle>BOM templates</CardTitle>
          <CardDescription>
            Standardize component requirements and SOPs for every output item.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onCreate}>
            Create template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              Showing: {filteredTemplates.length} / {bomTemplates.length}
            </Badge>
            {(searchTerm || processFilter !== "all") && (
              <Button size="sm" variant="ghost" onClick={resetFilters}>
                Reset filters
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search item, process, or component"
              className="w-full sm:w-[260px]"
            />
            <Select value={processFilter} onValueChange={setProcessFilter}>
              <SelectTrigger className="sm:w-[200px]">
                <SelectValue placeholder="Filter process" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All processes</SelectItem>
                {processOptions.map((process) => (
                  <SelectItem key={process} value={process}>
                    {process}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredTemplates.map((template) => {
            const outputItem = itemDirectory[template.outputItem];
            const humanReadableSop =
              template.sop.length > 220
                ? `${template.sop.slice(0, 217)}…`
                : template.sop;

            return (
              <Card key={template.id} className="border border-dashed bg-card/60">
                <CardContent className="grid gap-6 py-6 sm:grid-cols-[minmax(0,2.4fr)_minmax(0,1.2fr)]">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-primary">Item to be created</p>
                        <h3 className="text-lg font-semibold leading-tight">
                          {outputItem?.name ?? template.outputItem}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          SKU: {outputItem?.sku ?? template.outputItem}
                          {outputItem?.uom ? ` · UOM: ${outputItem.uom}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">Owner: {template.updatedBy}</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-sm font-semibold text-primary">Process</p>
                        <p className="font-medium">{template.process}</p>
                        <p className="text-xs text-muted-foreground">Last updated · {template.lastUpdated}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-lg border bg-muted/40 px-4 py-2 text-center">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Output qty</p>
                        <p className="text-lg font-semibold">
                          {template.outputQuantity}
                          {outputItem?.uom ? (
                            <span className="ml-1 text-xs uppercase text-muted-foreground">
                              {outputItem.uom}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-primary">Items required</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {template.components.map((component) => {
                          const componentItem = itemDirectory[component.item];
                          return (
                            <div
                              key={`${template.id}-${component.item}`}
                              className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 shadow-sm"
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-medium leading-tight">
                                  {componentItem?.name ?? component.item}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  SKU: {componentItem?.sku ?? component.item}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wide">
                                {component.quantity}
                                {componentItem?.uom ? ` ${componentItem.uom}` : ""}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-primary">SOP overview</p>
                      <p className="whitespace-pre-line rounded-lg border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
                        {humanReadableSop}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <RecordActions
                        onEdit={() => onEdit(template)}
                        onAction={() => onAction(template)}
                        actionLabel={template.hasTransactions ? "Deactivate" : "Delete"}
                        tone={template.hasTransactions ? "default" : "destructive"}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
          Keep SOP instructions concise so operators can reference critical checks without leaving the workstation.
        </div>
      </CardContent>
    </Card>
  );
}

function MasterFormDialog({ state, onClose }: MasterFormDialogProps) {
  const { open, entity, mode, data } = state;

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {entity === "item" ? (
          <ItemFormDialog mode={mode} data={data} onClose={onClose} />
        ) : entity === "uom" ? (
          <UomFormDialog mode={mode} data={data} onClose={onClose} />
        ) : entity === "worker" ? (
          <WorkerFormDialog mode={mode} data={data} onClose={onClose} />
        ) : entity === "process" ? (
          <ProcessFormDialog mode={mode} data={data} onClose={onClose} />
        ) : (
          <BomFormDialog mode={mode} data={data} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

type MasterFormDialogProps = {
  state: DialogState;
  onClose: () => void;
};

type ItemFormDialogProps = {
  mode: FormMode;
  data?: Record<string, unknown> | null;
  onClose: () => void;
};

type ProcessFormDialogProps = ItemFormDialogProps;
type BomFormDialogProps = ItemFormDialogProps;
type UomFormDialogProps = ItemFormDialogProps;
type WorkerFormDialogProps = ItemFormDialogProps;

type FieldProps<T extends Record<string, unknown>> = {
  form: UseFormReturn<T>;
  disableSku?: boolean;
  disableName?: boolean;
  disableCode?: boolean;
  disableOutputItem?: boolean;
};

function buildItemDefaults(record?: Partial<typeof items[number]>): ItemFormValues {
  return {
    sku: record?.sku ?? "",
    name: record?.name ?? "",
    category: record?.category ?? "",
    uom: record?.uom ?? "",
    reorder: record?.reorder ?? "",
    status: record?.status ?? "Active",
    notes: "",
  };
}

function buildProcessDefaults(record?: Partial<typeof processes[number]>): ProcessFormValues {
  return {
    name: record?.name ?? "",
    summary: record?.summary ?? "",
    workers: record?.workers ?? [],
  };
}

function buildBomDefaults(record?: Partial<typeof bomTemplates[number]>): BomFormValues {
  const components =
    record?.components?.map((component) => ({
      item: component.item ?? "",
      quantity: component.quantity ?? "",
    })) ?? [];

  return {
    outputItem: record?.outputItem ?? "",
    process: record?.process ?? "",
    outputQuantity: record?.outputQuantity ?? "",
    components: components.length > 0 ? components : [{ item: "", quantity: "" }],
    sop: record?.sop ?? "",
  };
}

function buildUomDefaults(record?: Partial<typeof uoms[number]>): UomFormValues {
  return {
    code: record?.code ?? "",
    name: record?.name ?? "",
    type: record?.type ?? "",
    precision: record?.precision ?? "",
    status: record?.status ?? "Active",
    description: record?.description ?? "",
  };
}

function buildWorkerDefaults(record?: Partial<typeof workers[number]>): WorkerFormValues {
  return {
    code: record?.code ?? "",
    name: record?.name ?? "",
    role: record?.role ?? "",
    department: record?.department ?? "",
    shift: record?.shift ?? "",
    status: record?.status ?? "Active",
    skills: record?.skills ?? "",
    contact: record?.contact ?? "",
  };
}

function ItemFormDialog({ mode, data, onClose }: ItemFormDialogProps) {
  const defaults = useMemo(() => buildItemDefaults(data as typeof items[number] | undefined), [data]);
  const form = useForm<ItemFormValues>({ defaultValues: defaults });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const handleSubmit = form.handleSubmit((values) => {
    console.info(`item:${mode}`, values);
    onClose();
  });

  return (
    <>
      <DialogHeader className="space-y-2">
        <DialogTitle>{mode === "create" ? "Create item" : "Edit item"}</DialogTitle>
        <DialogDescription>Define catalogue, costing, and supplier details.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <ItemFields form={form} disableSku={mode === "edit"} />
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{mode === "create" ? "Create item" : "Save changes"}</Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}

function UomFormDialog({ mode, data, onClose }: UomFormDialogProps) {
  const defaults = useMemo(() => buildUomDefaults(data as typeof uoms[number] | undefined), [data]);
  const form = useForm<UomFormValues>({ defaultValues: defaults });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const handleSubmit = form.handleSubmit((values) => {
    console.info(`uom:${mode}`, values);
    onClose();
  });

  return (
    <>
      <DialogHeader className="space-y-2">
        <DialogTitle>{mode === "create" ? "Create unit of measure" : "Edit unit of measure"}</DialogTitle>
        <DialogDescription>Maintain standardized measurement units for catalogues.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <UomFields form={form} disableCode={mode === "edit"} />
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{mode === "create" ? "Create unit" : "Save changes"}</Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}

function WorkerFormDialog({ mode, data, onClose }: WorkerFormDialogProps) {
  const defaults = useMemo(
    () => buildWorkerDefaults(data as typeof workers[number] | undefined),
    [data]
  );
  const form = useForm<WorkerFormValues>({ defaultValues: defaults });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const handleSubmit = form.handleSubmit((values) => {
    console.info(`worker:${mode}`, values);
    onClose();
  });

  return (
    <>
      <DialogHeader className="space-y-2">
        <DialogTitle>{mode === "create" ? "Create worker" : "Edit worker"}</DialogTitle>
        <DialogDescription>Capture operator details for process allocation.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <WorkerFields form={form} disableCode={mode === "edit"} />
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{mode === "create" ? "Create worker" : "Save changes"}</Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}

function ProcessFormDialog({ mode, data, onClose }: ProcessFormDialogProps) {
  const defaults = useMemo(
    () => buildProcessDefaults(data as typeof processes[number] | undefined),
    [data]
  );
  const form = useForm<ProcessFormValues>({ defaultValues: defaults });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const handleSubmit = form.handleSubmit((values) => {
    console.info(`process:${mode}`, values);
    onClose();
  });

  return (
    <>
      <DialogHeader className="space-y-2">
        <DialogTitle>{mode === "create" ? "Create process" : "Edit process"}</DialogTitle>
        <DialogDescription>Document the process summary and assign responsible workers.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <ProcessFields form={form} disableName={mode === "edit"} />
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{mode === "create" ? "Create process" : "Save changes"}</Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}

function BomFormDialog({ mode, data, onClose }: BomFormDialogProps) {
  const defaults = useMemo(() => buildBomDefaults(data as typeof bomTemplates[number] | undefined), [data]);
  const form = useForm<BomFormValues>({ defaultValues: defaults });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const handleSubmit = form.handleSubmit((values) => {
    console.info(`bom:${mode}`, values);
    onClose();
  });

  return (
    <>
      <DialogHeader className="space-y-2">
        <DialogTitle>{mode === "create" ? "Create BOM template" : "Edit BOM template"}</DialogTitle>
        <DialogDescription>Configure material requirements and baseline costs.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <BomFields form={form} disableOutputItem={mode === "edit"} />
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{mode === "create" ? "Create template" : "Save changes"}</Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}


function MasterActionDialog({ state, onClose }: { state: ActionState; onClose: () => void }) {
  const { open, entity, action, record } = state;
  const label = useMemo(() => {
    if (!record) return "this record";
    if (entity === "item") {
      const { sku, name } = record as typeof items[number];
      return `${sku ?? ""}${name ? ` – ${name}` : ""}`.trim();
    }
    if (entity === "uom") {
      const { code, name } = record as typeof uoms[number];
      const formatted = `${code ?? ""}${name ? ` – ${name}` : ""}`.trim();
      return formatted.length > 0 ? formatted : "this unit";
    }
    if (entity === "worker") {
      const { code, name } = record as typeof workers[number];
      const formatted = `${code ?? ""}${name ? ` – ${name}` : ""}`.trim();
      return formatted.length > 0 ? formatted : "this worker";
    }
    if (entity === "process") {
      return (record as typeof processes[number])?.name ?? "this process";
    }
    if (entity === "bom") {
      const template = record as typeof bomTemplates[number];
      if (!template) return "this template";
      const output = itemDirectory[template.outputItem];
      if (output) {
        return `${output.sku} – ${output.name}`;
      }
      return template.outputItem ?? "this template";
    }
    return "this record";
  }, [entity, record]);

  const actionLabel = action === "delete" ? "Delete" : "Deactivate";
  const entityLabel =
    entity === "item"
      ? "item"
      : entity === "uom"
      ? "unit of measure"
      : entity === "worker"
      ? "worker"
      : entity === "process"
      ? "process"
      : "BOM template";

  const handleConfirm = () => {
    console.info(`[masters:${entity}] ${action}`, record);
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => (!next ? onClose() : null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {actionLabel} {entityLabel}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {action === "delete"
              ? `Are you sure you want to permanently delete ${label}? This cannot be undone.`
              : `Deactivate ${label} so it can no longer be selected in new transactions. Existing records remain untouched.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={action === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ItemFields({ form, disableSku }: FieldProps<ItemFormValues>) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item code</FormLabel>
              <FormControl>
                <Input placeholder="SFG-SLK-NTW-30D-HNK" {...field} disabled={disableSku} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item name</FormLabel>
              <FormControl>
                <Input placeholder="Cotton Yarn 30s" {...field} />
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
              <FormLabel>Select category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {itemCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
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
          name="uom"
          rules={{ required: "Unit of measure is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit of measure</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit of measure" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {uomOptions.map((unit) => (
                    <SelectItem key={unit.code} value={unit.code}>
                      {unit.code} – {unit.name}
                      {unit.status !== "Active" ? " (Inactive)" : ""}
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
          name="reorder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reorder point</FormLabel>
              <FormControl>
                <Input placeholder="Enter reorder threshold" {...field} />
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {itemStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Textarea rows={3} placeholder="Add handling instructions or sourcing notes" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function UomFields({ form, disableCode }: FieldProps<UomFormValues>) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="code"
          rules={{ required: "Code is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input placeholder="kg" {...field} disabled={disableCode} className="uppercase" />
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
          rules={{ required: "Type is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {uomTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
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
                <Input placeholder="e.g. 3" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          rules={{ required: "Status is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {uomStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
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
              <Textarea rows={3} placeholder="Add guidance on when to use this unit" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function WorkerFields({ form, disableCode }: FieldProps<WorkerFormValues>) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="code"
          rules={{ required: "Worker code is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Worker code</FormLabel>
              <FormControl>
                <Input placeholder="EMP-OPS-01" {...field} disabled={disableCode} className="uppercase" />
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
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input placeholder="Operator name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          rules={{ required: "Role is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <Input placeholder="Loom operator" {...field} />
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
                <Input placeholder="Weaving" {...field} />
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
                <Input placeholder="Shift A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          rules={{ required: "Status is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {workerStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <FormLabel>Skills & certifications</FormLabel>
            <FormControl>
              <Textarea rows={3} placeholder="List key skills or certifications" {...field} />
            </FormControl>
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
  );
}

function ProcessFields({ form, disableName }: FieldProps<ProcessFormValues>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  const filteredWorkers = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    return workerOptions.filter((worker) => {
      const matchesDepartment =
        departmentFilter === "all" || worker.department === departmentFilter;
      const matchesSearch =
        !normalized ||
        worker.name.toLowerCase().includes(normalized) ||
        worker.role.toLowerCase().includes(normalized) ||
        worker.code.toLowerCase().includes(normalized);

      return matchesDepartment && matchesSearch;
    });
  }, [departmentFilter, searchTerm]);

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="name"
        rules={{ required: "Process name is required" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Process name</FormLabel>
            <FormControl>
              <Input placeholder="Indigo Dyeing" {...field} disabled={disableName} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="summary"
        rules={{ required: "Process summary is required" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Process summary</FormLabel>
            <FormControl>
              <Textarea
                rows={4}
                placeholder="Describe the scope, checkpoints, and quality notes for this process."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="workers"
        rules={{
          validate: (value) => (value && value.length > 0 ? true : "Select at least one worker"),
        }}
        render={({ field }) => {
          const selectedSet = new Set(field.value ?? []);
          const selectedWorkers = Array.from(selectedSet)
            .map((code) => workerDirectory[code])
            .filter((worker): worker is typeof workers[number] => Boolean(worker));

          const toggleWorker = (code: string) => {
            const next = new Set(field.value ?? []);
            if (next.has(code)) {
              next.delete(code);
            } else {
              next.add(code);
            }
            field.onChange(Array.from(next));
          };

          const removeWorker = (code: string) => {
            const next = new Set(field.value ?? []);
            next.delete(code);
            field.onChange(Array.from(next));
          };

          const resetFilters = () => {
            setSearchTerm("");
            setDepartmentFilter("all");
          };

          return (
            <FormItem>
              <div className="space-y-4">
                <div className="space-y-1">
                  <FormLabel>Allocated workers</FormLabel>
                  <FormDescription>
                    Search and filter the worker directory, then click to assign operators to this process.
                  </FormDescription>
                </div>

                {selectedWorkers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkers.map((worker) => (
                      <Badge
                        key={worker.code}
                        variant="secondary"
                        className="flex items-center gap-2 rounded-full px-3 py-1 text-xs"
                      >
                        <span className="font-semibold uppercase tracking-wide">{worker.code}</span>
                        <span className="text-sm font-medium">{worker.name}</span>
                        <span className="text-xs text-muted-foreground">({worker.role})</span>
                        <button
                          type="button"
                          onClick={() => removeWorker(worker.code)}
                          aria-label={`Remove ${worker.name}`}
                          className="ml-1 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by name, role, or code"
                    className="w-full sm:w-[260px]"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="sm:w-[200px]">
                        <SelectValue placeholder="Filter department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All departments</SelectItem>
                        {workerDepartments.map((department) => (
                          <SelectItem key={department} value={department}>
                            {department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(searchTerm || departmentFilter !== "all") && (
                      <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
                        Reset
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredWorkers.length > 0 ? (
                    filteredWorkers.map((worker) => {
                      const isSelected = selectedSet.has(worker.code);
                      const isInactive = worker.status !== "Active";

                      return (
                        <button
                          key={worker.code}
                          type="button"
                          className={cn(
                            "flex w-full flex-col gap-3 rounded-lg border p-3 text-left shadow-sm transition",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50 hover:bg-accent/40"
                          )}
                          aria-pressed={isSelected}
                          onClick={() => toggleWorker(worker.code)}
                        >
                          <div className="flex w-full items-start justify-between gap-3">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-sm leading-none">
                                {worker.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {worker.role} · {worker.code}
                                {isInactive ? ` · ${worker.status}` : ""}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-[0.65rem] uppercase tracking-wide">
                              {worker.department ?? "—"}
                            </Badge>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-full rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      No workers match the current filters.
                    </div>
                  )}
                </div>

                <FormMessage />
              </div>
            </FormItem>
          );
        }}
      />
    </div>
  );
}

function BomFields({ form, disableOutputItem }: FieldProps<BomFormValues>) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "components",
  });

  const addComponent = () => append({ item: "", quantity: "" });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="outputItem"
          rules={{ required: "Select the item to be produced" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item to be created</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={disableOutputItem}>
                <FormControl>
                  <SelectTrigger disabled={disableOutputItem}>
                    <SelectValue placeholder="Choose parent item" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {itemOptions.map((item) => (
                    <SelectItem key={item.sku} value={item.sku}>
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
          name="process"
          rules={{ required: "Select the production process" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Process</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose process" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {processOptions.map((process) => (
                    <SelectItem key={process} value={process}>
                      {process}
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
          rules={{ required: "Specify the output quantity" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Output quantity</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 500" {...field} />
              </FormControl>
              <FormDescription>Enter the quantity produced per batch.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="components"
        rules={{
          validate: (value) => (value && value.length > 0 ? true : "Add at least one required item"),
        }}
        render={({ field: _field }) => (
          <FormItem>
            {void _field}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <FormLabel>Items required</FormLabel>
                <FormDescription>List each component and the quantity needed for this BOM.</FormDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addComponent}>
                Add component
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((component, index) => (
                <div
                  key={component.id}
                  className="grid gap-3 sm:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_auto] sm:items-center"
                >
                  <FormField
                    control={form.control}
                    name={`components.${index}.item` as const}
                    rules={{ required: "Select an item" }}
                    render={({ field }) => (
                      <FormItem>
                        {index === 0 && <FormLabel className="sm:hidden">Component item</FormLabel>}
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {itemOptions.map((item) => (
                              <SelectItem key={item.sku} value={item.sku}>
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
                    name={`components.${index}.quantity` as const}
                    rules={{ required: "Enter quantity" }}
                    render={({ field }) => (
                      <FormItem>
                        {index === 0 && <FormLabel className="sm:hidden">Quantity</FormLabel>}
                        <FormControl>
                          <Input placeholder="e.g. 25" {...field} />
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
        name="sop"
        rules={{ required: "Document the SOP" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>SOP / production notes</FormLabel>
            <FormControl>
              <Textarea rows={4} placeholder="Outline key steps, checkpoints, and sign-offs" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
