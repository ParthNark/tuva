"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { CameraInterface } from "@/frontend/components/CameraInterface";
import { PageTransition } from "./components/PageTransition";
import { MessageSquare } from "lucide-react";
import { ProtectedRoute } from "./components/ProtectedRoute";

type InsightsResponse = {
  status?: "ok" | "insufficient";
  strengths?: string[];
  improvements?: string[];
  message?: string;
};

function formatSessionTime() {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const { user } = useAuth0();
  const userId = user?.sub ?? "";
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const loadInsights = async () => {
      setInsightsLoading(true);
      try {
        const res = await fetch(`/api/insights?userId=${encodeURIComponent(userId)}`);
        const data = (await res.json()) as InsightsResponse;
        setInsights(data);
      } catch {
        setInsights({ status: "insufficient", message: "Teach a few more sessions to unlock insights." });
      } finally {
        setInsightsLoading(false);
      }
    };
    void loadInsights();
  }, [userId]);

  return (
    <ProtectedRoute>
      <PageTransition>
        <div className="flex h-full min-h-screen gap-6 p-6">
          <div className="flex flex-1 flex-col">
            <div className="mb-4 rounded-xl border border-card bg-card p-4 backdrop-blur-md">
              <h2 className="text-sm font-medium text-muted">Current Session</h2>
              <p className="mt-1 text-lg font-semibold text-theme">
                {formatSessionTime()}
              </p>
            </div>

            <div className="flex-1 overflow-auto rounded-2xl border border-card bg-card-soft backdrop-blur-md">
              <div className="p-6">
                <CameraInterface embedded userId={userId} />
              </div>
            </div>
          </div>

          <aside className="hidden w-80 shrink-0 lg:block">
            <div className="sticky top-6 rounded-xl border border-card bg-card p-4 backdrop-blur-md">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-soft">
                <MessageSquare className="h-4 w-4 text-accent" />
                Teaching Insights
              </h3>
              {insightsLoading ? (
                <div className="text-sm text-subtle">Generating insights...</div>
              ) : insights?.status === "ok" ? (
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-subtle">Strengths</div>
                    <ul className="mt-2 list-disc space-y-2 pl-5 text-soft">
                      {(insights.strengths ?? []).map((item, index) => (
                        <li key={`strength-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-subtle">Opportunities to Improve</div>
                    <ul className="mt-2 list-disc space-y-2 pl-5 text-soft">
                      {(insights.improvements ?? []).map((item, index) => (
                        <li key={`improve-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-card-subtle bg-card-muted p-3 text-sm text-soft">
                  {insights?.message ?? "Teach a few more sessions to unlock insights."}
                </div>
              )}
            </div>
          </aside>
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
}
