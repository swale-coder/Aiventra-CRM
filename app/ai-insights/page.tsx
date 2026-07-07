"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useCrmData } from "@/lib/data/CrmDataProvider";
import { computeLeadScore, getFollowUpAlerts } from "@/lib/ai/lead-scoring";
import { recommendUnits, generateCustomerSummary } from "@/lib/ai/recommend-unit";
import { formatINR } from "@/lib/utils";
import { Flame, Clock3, Sparkles, Home, Loader2, Send, AlertTriangle } from "lucide-react";

export default function AiInsightsPage() {
  const { leads, customers, projects, units: allUnits, loading } = useCrmData();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const selectedLead = leads.find((l) => l.id === selectedLeadId) ?? leads[0] ?? null;
  const project = projects.find((p) => p.name === selectedLead?.interestedProject) ?? projects[0] ?? null;

  const scoring = useMemo(
    () => (selectedLead && project ? computeLeadScore({ ...selectedLead, projectAvgTicket: project.avgTicketSize }) : null),
    [selectedLead, project]
  );

  const units = useMemo(() => (project ? allUnits.filter((u) => u.projectId === project.id) : []), [allUnits, project]);
  const matches = useMemo(() => (selectedLead ? recommendUnits(selectedLead, units) : []), [selectedLead, units]);

  const alerts = useMemo(() => getFollowUpAlerts(leads), [leads]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? customers[0] ?? null;
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summarySource, setSummarySource] = useState<"deterministic" | "openai">("deterministic");

  useEffect(() => {
    if (selectedCustomer) setSummary(generateCustomerSummary(selectedCustomer));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomer?.id]);

  async function regenerateSummary() {
    if (!selectedCustomer) return;
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/ai/customer-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedCustomer),
      });
      const data = await res.json();
      setSummary(data.summary);
      setSummarySource(data.source?.startsWith("openai") ? "openai" : "deterministic");
    } catch {
      setSummary(generateCustomerSummary(selectedCustomer));
    } finally {
      setSummaryLoading(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center text-black/30">
          <Loader2 className="animate-spin" size={22} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-aiventra-ink">AI Insights</h1>
        <p className="text-sm text-black/45">Phase 2 — Sales Intelligence Layer</p>
      </div>

      {/* Hot Lead Scoring */}
      <Card className="mb-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame size={15} className="text-aiventra-orange" /> AI Hot Lead Scoring
          </CardTitle>
          {selectedLead && (
            <select
              value={selectedLead.id}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs font-medium text-aiventra-ink outline-none"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}
        </CardHeader>
        <CardContent>
          {!selectedLead || !scoring ? (
            <p className="py-8 text-center text-sm text-black/30">No leads yet — add a lead to see AI scoring.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-aiventra-orange/[0.06] to-transparent p-5 text-center">
                <p className="font-display text-4xl font-bold text-aiventra-ink">{scoring.score}</p>
                <p className="text-xs text-black/40">Hot lead score</p>
                <Badge tone={scoring.tier === "Hot" ? "orange" : scoring.tier === "Warm" ? "amber" : "ink"} className="mt-2">
                  {scoring.tier}
                </Badge>
                <p className="mt-3 font-display text-2xl font-bold text-emerald-600">{scoring.closingProbability}%</p>
                <p className="text-xs text-black/40">Closing probability</p>
              </div>

              <div className="lg:col-span-2">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-black/35">Signal breakdown</p>
                <div className="space-y-3">
                  {scoring.factors.map((f) => (
                    <div key={f.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-aiventra-ink">{f.label}</span>
                        <span className="text-xs text-black/40">{f.description}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-black/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-aiventra-orange to-[#FF9152]"
                          style={{ width: `${f.normalized}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Smart Follow-up Engine */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 size={15} className="text-aiventra-orange" /> Smart Follow-up Engine
            </CardTitle>
            <Badge tone="red">{alerts.length} going cold</Badge>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {alerts.slice(0, 5).map((a) => (
              <FollowUpAlertRow key={a.lead.id} alert={a} />
            ))}
            {alerts.length === 0 && <p className="text-sm text-black/40">No leads going cold right now.</p>}
          </CardContent>
        </Card>

        {/* AI Sales Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home size={15} className="text-aiventra-orange" /> AI Sales Recommendations
            </CardTitle>
            <span className="text-xs text-black/40">{selectedLead ? `for ${selectedLead.name}` : ""}</span>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {!selectedLead ? (
              <p className="text-sm text-black/40">Add a lead to see unit recommendations.</p>
            ) : (
              <>
                {matches.map((m) => (
              <div key={m.unit.id} className="rounded-xl border border-black/[0.06] p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-aiventra-ink">Unit {m.unit.unitNo}</p>
                  <Badge tone="orange">{m.matchScore}% match</Badge>
                </div>
                <p className="mt-0.5 text-xs text-black/45">
                  {m.unit.config} · {m.unit.areaSqft} sqft · {m.unit.facing} · {formatINR(m.unit.price)}
                </p>
                {m.reasons.length > 0 && (
                  <p className="mt-1.5 flex items-start gap-1 text-[11px] text-[#B85C00]">
                    <Sparkles size={11} className="mt-0.5 shrink-0" /> {m.reasons.join(", ")}
                  </p>
                )}
              </div>
            ))}
            {matches.length === 0 && <p className="text-sm text-black/40">No strong matches in available inventory right now.</p>}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Summary Generator */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles size={15} className="text-aiventra-orange" /> Customer Summary Generator
          </CardTitle>
          {selectedCustomer && (
            <select
              value={selectedCustomer.id}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                const c = customers.find((x) => x.id === e.target.value);
                if (c) {
                  setSummary(generateCustomerSummary(c));
                  setSummarySource("deterministic");
                }
              }}
              className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs font-medium text-aiventra-ink outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </CardHeader>
        <CardContent>
          {!selectedCustomer ? (
            <p className="py-8 text-center text-sm text-black/30">No customers yet.</p>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <Avatar name={selectedCustomer.name} color={selectedCustomer.avatarColor} size={40} />
                <div className="flex-1 rounded-2xl bg-black/[0.03] p-4 text-sm leading-relaxed text-aiventra-ink">{summary}</div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Button size="sm" variant="outline" onClick={regenerateSummary} disabled={summaryLoading}>
                  {summaryLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  Regenerate
                </Button>
                <span className="text-[11px] text-black/35">
                  Source: {summarySource === "openai" ? "OpenAI (live)" : "On-device engine — add OPENAI_API_KEY for live generation"}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function FollowUpAlertRow({ alert }: { alert: ReturnType<typeof getFollowUpAlerts>[number] }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generateDraft() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: alert.lead.name,
          project: alert.lead.interestedProject,
          daysSinceContact: alert.daysSinceContact,
          stage: alert.lead.stage,
        }),
      });
      const data = await res.json();
      setDraft(data.message);
    } catch {
      setDraft(`Hi ${alert.lead.name.split(" ")[0]}, just checking in on ${alert.lead.interestedProject} — happy to help with any questions.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-black/[0.06] p-3">
      <div className="flex items-start gap-2.5">
        <div
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            alert.severity === "urgent" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
          }`}
        >
          <AlertTriangle size={12} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-aiventra-ink">{alert.message}</p>
          <p className="text-xs text-black/40">{alert.lead.interestedProject} · score {alert.lead.score}</p>
        </div>
      </div>
      {draft ? (
        <p className="mt-2.5 rounded-lg bg-aiventra-orange/[0.06] p-2.5 text-xs leading-relaxed text-[#8a4600]">{draft}</p>
      ) : (
        <button
          onClick={generateDraft}
          disabled={loading}
          className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-aiventra-orange hover:underline"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          Draft follow-up message
        </button>
      )}
    </div>
  );
}
