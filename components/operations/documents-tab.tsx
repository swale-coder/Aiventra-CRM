"use client";

import { useCrmData } from "@/lib/data/CrmDataProvider";
import { UploadDocumentDialog } from "@/components/shared/dialogs/upload-document-dialog";
import { DocumentStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, XCircle, Upload } from "lucide-react";

const statusTone: Record<DocumentStatus, "green" | "amber" | "red"> = {
  Verified: "green",
  Pending: "amber",
  Rejected: "red",
};

export function DocumentsTab() {
  const { documents, updateDocumentStatus } = useCrmData();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-black/45">
          {documents.length} documents · {documents.filter((d) => d.status === "Pending").length} pending review
        </p>
        <UploadDocumentDialog
          trigger={
            <Button size="sm">
              <Upload size={14} /> Upload Document
            </Button>
          }
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-soft">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/[0.06] bg-black/[0.02] text-xs text-black/40">
            <tr>
              <th className="px-5 py-3 font-medium">Document</th>
              <th className="px-5 py-3 font-medium">Project</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Uploaded</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-black/30">
                  No documents yet.
                </td>
              </tr>
            )}
            {documents.map((d) => (
              <tr key={d.id} className="border-b border-black/[0.04] last:border-0">
                <td className="flex items-center gap-2 px-5 py-3 font-medium text-aiventra-ink">
                  <FileText size={14} className="shrink-0 text-black/30" /> {d.name}
                </td>
                <td className="px-5 py-3 text-black/60">{d.project}</td>
                <td className="px-5 py-3 text-black/60">{d.docType}</td>
                <td className="px-5 py-3 text-black/60">
                  {new Date(d.uploadedDateISO).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-5 py-3">
                  <Badge tone={statusTone[d.status]}>{d.status}</Badge>
                  {d.verifiedBy && d.status === "Verified" && <p className="mt-0.5 text-[10px] text-black/35">by {d.verifiedBy}</p>}
                </td>
                <td className="px-5 py-3">
                  {d.status === "Pending" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateDocumentStatus(d.id, "Verified")}
                        className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
                      >
                        <CheckCircle2 size={12} /> Verify
                      </button>
                      <button
                        onClick={() => updateDocumentStatus(d.id, "Rejected")}
                        className="flex items-center gap-1 text-xs font-medium text-red-500 hover:underline"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
