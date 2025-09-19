"use client";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const availableReports = [
  {
    title: "Daily production summary",
    description: "Input vs output by process, shift, and supervisor.",
    format: "CSV, PDF",
    duration: "24 hours",
  },
  {
    title: "BOM consumption vs actual",
    description: "Variance analysis with wastage and exceptions logged.",
    format: "CSV",
    duration: "Custom range",
  },
  {
    title: "Efficiency benchmarking",
    description: "Process efficiency trend with machine utilization and downtime.",
    format: "PDF",
    duration: "Weekly",
  },
];

const reportFilters = [
  {
    label: "Date range",
    options: ["Today", "Last 7 days", "Custom"],
    defaultValue: "Today",
  },
  {
    label: "Process",
    options: ["All", "Spinning", "Twisting", "Dyeing", "Weaving", "Packing"],
    defaultValue: "All",
  },
  {
    label: "Shift",
    options: ["All", "Shift A", "Shift B", "Shift C"],
    defaultValue: "All",
  },
  {
    label: "Supervisor",
    options: ["All", "Anita Rao", "Raghav Kapoor", "Ganesh V"],
    defaultValue: "All",
  },
];

const schedule = [
  {
    name: "Weekly efficiency roll-up",
    timing: "Mondays · 06:00 AM",
    recipients: "Managers, Admins",
  },
  {
    name: "Daily shift summary",
    timing: "Everyday · 10:00 PM",
    recipients: "Supervisors",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate insight-packed reports for production, BOM usage, and
          efficiency. Export data or schedule automated delivery.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Generate report</CardTitle>
            <CardDescription>
              Apply filters and export a dataset for deeper analysis.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              Save template
            </Button>
            <Button size="sm">Run report</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {reportFilters.map((filter) => (
              <div key={filter.label} className="space-y-1">
                <label className="text-sm font-medium">{filter.label}</label>
                <Select defaultValue={filter.defaultValue.toLowerCase()}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${filter.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((option) => (
                      <SelectItem
                        key={option}
                        value={option.toLowerCase().replace(/\s+/g, "-")}
                      >
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              rows={4}
              placeholder="Add context or special instructions"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>Available reports</CardTitle>
            <CardDescription>
              Pre-built report templates aligned with production workflows.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Manage catalogue
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {availableReports.map((report) => (
            <Card key={report.title} className="border border-dashed">
              <CardHeader className="space-y-2">
                <CardTitle className="text-base">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">Output: {report.format}</p>
                <Badge variant="secondary" className="w-fit">
                  Window: {report.duration}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Scheduled delivery</CardTitle>
            <CardDescription>
              Automate distribution to keep teams in the loop.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Create schedule
          </Button>
        </CardHeader>
        <CardContent>
          {schedule.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No scheduled reports yet.
            </div>
          ) : (
            <div className="space-y-3">
              {schedule.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col gap-3 rounded-lg border bg-background p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Recipients: {item.recipients}
                    </p>
                  </div>
                  <Badge variant="secondary" className="w-fit">
                    {item.timing}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
