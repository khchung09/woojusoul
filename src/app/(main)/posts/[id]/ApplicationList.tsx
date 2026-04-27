"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { updateApplicationStatus } from "@/lib/actions";
import { formatDistanceToNow } from "@/lib/dateUtils";
import type { ApplicationWithApplicant } from "@/types/models";

type AppData = {
  housingType?: string;
  petExperience?: boolean;
  period?: string;
  intro?: string;
};

function ApplicationMessage({ raw }: { raw: string }) {
  let data: AppData | null = null;
  try {
    data = JSON.parse(raw) as AppData;
  } catch {
    // 구버전 plain text
  }

  if (!data) {
    return <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{raw}</p>;
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-stone-500">
        {data.housingType && (
          <span>🏠 {data.housingType}</span>
        )}
        {data.petExperience !== undefined && (
          <span>🐾 양육 경험 {data.petExperience ? "있음" : "없음"}</span>
        )}
        {data.period && (
          <span>📅 {data.period}</span>
        )}
      </div>
      {data.intro && (
        <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{data.intro}</p>
      )}
    </div>
  );
}

const STATUS_BADGE = {
  pending:  { label: "대기 중",  className: "bg-stone-100 text-stone-600" },
  accepted: { label: "수락됨",   className: "bg-green-100 text-green-700" },
  rejected: { label: "거절됨",   className: "bg-red-100   text-red-600"   },
};

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-sm shadow-sm">
      {name[0]}
    </div>
  );
}

interface Props {
  applications: ApplicationWithApplicant[];
}

export default function ApplicationList({ applications }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleStatus(id: string, status: "accepted" | "rejected") {
    startTransition(async () => {
      await updateApplicationStatus(id, status);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-bold text-stone-700">
        신청자 목록 <span className="text-stone-400 font-normal">({applications.length}명)</span>
      </h2>

      {applications.length === 0 ? (
        <div className="rounded-2xl bg-white py-8 text-center shadow-sm border border-stone-100">
          <p className="text-sm text-stone-400">아직 신청자가 없어요</p>
        </div>
      ) : (
        applications.map((app) => {
          const name = app.applicant?.username ?? "알 수 없음";
          const badge = STATUS_BADGE[app.status];

          return (
            <div
              key={app.id}
              className="rounded-2xl bg-white p-4 shadow-sm border border-stone-100"
            >
              <div className="flex items-start gap-3">
                <Avatar name={name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">@{name}</p>
                      <p className="text-xs text-stone-400">{formatDistanceToNow(app.created_at)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>

                  <ApplicationMessage raw={app.message} />

                  {app.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatus(app.id, "accepted")}
                        className="flex items-center gap-1.5 rounded-xl bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <CheckCircle size={13} />
                        수락
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatus(app.id, "rejected")}
                        className="flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <XCircle size={13} />
                        거절
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
