"use client";

import { useCrmData } from "@/lib/data/CrmDataProvider";
import { NewTaskDialog } from "@/components/shared/dialogs/new-task-dialog";
import { Task, TaskStatus } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const columns: { key: TaskStatus; label: string }[] = [
  { key: "To Do", label: "To Do" },
  { key: "In Progress", label: "In Progress" },
  { key: "Done", label: "Done" },
];

const priorityTone: Record<Task["priority"], "red" | "amber" | "ink"> = {
  High: "red",
  Medium: "amber",
  Low: "ink",
};

export function TasksTab() {
  const { tasks, orgUsers, updateTaskStatus } = useCrmData();

  function advance(task: Task) {
    const order: TaskStatus[] = ["To Do", "In Progress", "Done"];
    const idx = order.indexOf(task.status);
    if (idx === order.length - 1) return;
    updateTaskStatus(task.id, order[idx + 1]);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-black/45">{tasks.length} tasks across all projects · tap a card to advance its status</p>
        <NewTaskDialog
          trigger={
            <Button size="sm">
              <Plus size={14} /> New Task
            </Button>
          }
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key}>
              <div className="mb-3 flex items-center gap-2 px-1">
                <h3 className="text-sm font-semibold text-aiventra-ink">{col.label}</h3>
                <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[11px] font-medium text-black/45">{colTasks.length}</span>
              </div>
              <div className="space-y-2.5">
                {colTasks.map((t) => {
                  const assignee = orgUsers.find((u) => u.id === t.assignedTo);
                  return (
                    <button
                      key={t.id}
                      onClick={() => advance(t)}
                      className="w-full rounded-2xl border border-black/[0.06] bg-white p-3.5 text-left shadow-soft transition-shadow hover:shadow-lift"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug text-aiventra-ink">{t.title}</p>
                        <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                      </div>
                      <p className="mt-1.5 text-xs text-black/40">{t.project}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {assignee && <Avatar name={assignee.name} color={assignee.avatarColor} size={22} />}
                          <span className="text-[11px] text-black/45">{assignee?.name.split(" ")[0]}</span>
                        </div>
                        <span
                          className={cn(
                            "text-[11px]",
                            t.dueDateISO && new Date(t.dueDateISO) < new Date() && t.status !== "Done" ? "font-medium text-red-500" : "text-black/35"
                          )}
                        >
                          {t.dueDateISO ? new Date(t.dueDateISO).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {colTasks.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-xs text-black/30">No tasks</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
