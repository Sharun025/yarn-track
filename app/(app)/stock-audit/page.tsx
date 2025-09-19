"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { itemMaster } from "@/lib/mock-item-master";

const mockSnapshots = [
  { code: "SFG-SLK-NTW-30D-HNK", system: 320, physical: 318, location: "Reeling" },
  { code: "SFG-SLK-STW-30D-2PLY-TPI55-PW", system: 140, physical: 138, location: "Twisting" },
  { code: "SFG-SLK-ZTW-30D-2PLY-TPI55-VHS", system: 300, physical: 300, location: "Finishing" },
];

export default function StockAuditPage() {
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState("");
  const [location, setLocation] = useState("Reeling");
  const [notes, setNotes] = useState("");

  const selectedItem = useMemo(() => itemMaster.find((record) => record.sku === sku) ?? null, [sku]);

  const varianceSummary = useMemo(() => {
    const difference = mockSnapshots.reduce((acc, item) => acc + (item.physical - item.system), 0);
    const mismatched = mockSnapshots.filter((item) => item.physical !== item.system).length;
    return { difference, mismatched };
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stock audit capture</CardTitle>
          <CardDescription>
            Log physical counts and reconcile variances before publishing the adjustment report.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <div className="space-y-3">
            <div className="grid gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground" htmlFor="sku">
                Item code
              </label>
              <Select value={sku} onValueChange={setSku}>
                <SelectTrigger id="sku">
                  <SelectValue placeholder="Select item from master" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {itemMaster.map((item) => (
                    <SelectItem key={item.sku} value={item.sku}>
                      {item.sku} — {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedItem ? (
                <div className="rounded-md border border-dashed bg-muted/30 p-3 text-xs">
                  <p className="font-semibold text-foreground">{selectedItem.name}</p>
                  <p className="text-muted-foreground">UOM: {selectedItem.uom} • Category: {selectedItem.category}</p>
                </div>
              ) : null}
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground" htmlFor="qty">
                Physical quantity
              </label>
              <Input
                id="qty"
                type="number"
                placeholder="Enter counted quantity"
                value={qty}
                onChange={(event) => setQty(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Process location</label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reeling">Reeling</SelectItem>
                  <SelectItem value="Twisting">Twisting</SelectItem>
                  <SelectItem value="Heat Setting">Heat Setting</SelectItem>
                  <SelectItem value="Finishing">Finishing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Variance summary</p>
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending approvals</span>
                <Badge variant="outline">2</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lines with variance</span>
                <Badge variant="secondary">{varianceSummary.mismatched}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Net quantity delta</span>
                <span className={varianceSummary.difference === 0 ? "text-sm" : varianceSummary.difference > 0 ? "text-sm text-emerald-600" : "text-sm text-rose-600"}>
                  {varianceSummary.difference > 0 ? "+" : ""}
                  {varianceSummary.difference}
                </span>
              </div>
            </div>
            <Textarea
              placeholder="Observations, seal numbers, or sampling notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
            />
            <Button>Queue for variance report</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Draft variance report</CardTitle>
          <CardDescription>Review the captured lines before requesting approval.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-center">System qty</TableHead>
                <TableHead className="text-center">Physical qty</TableHead>
                <TableHead>Difference</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSnapshots.map((line) => {
                const masterRecord = itemMaster.find((record) => record.sku === line.code);
                const diff = line.physical - line.system;
                return (
                  <TableRow key={line.code}>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <p>{line.code}</p>
                        {masterRecord ? (
                          <>
                            <p className="text-xs text-muted-foreground">{masterRecord.name}</p>
                            <p className="text-xs text-muted-foreground">UOM: {masterRecord.uom}</p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">Unmapped in master</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{line.system}</TableCell>
                    <TableCell className="text-center">{line.physical}</TableCell>
                    <TableCell className={diff === 0 ? "text-sm" : diff > 0 ? "text-sm text-emerald-600" : "text-sm text-rose-600"}>
                      {diff > 0 ? "+" : ""}
                      {diff}
                    </TableCell>
                    <TableCell>{line.location}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="outline">Export draft</Button>
          <Button>Submit for approval</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approval & posting workflow</CardTitle>
          <CardDescription>Once approved, stock balances are adjusted in the respective process locations.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-semibold">1. Capture & review</p>
            <p className="mt-1 text-sm text-muted-foreground">Team inputs SKU and physical quantity, resolves immediate mismatches, and attaches notes.</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-semibold">2. Approve variance</p>
            <p className="mt-1 text-sm text-muted-foreground">Supervisors check the variance report, tag root causes, and sign off for posting.</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-semibold">3. Update stock actuals</p>
            <p className="mt-1 text-sm text-muted-foreground">Upon approval, the ERP automatically adjusts inventory in each process location.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
