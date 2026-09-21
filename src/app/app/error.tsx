"use client";

import { WorkspaceErrorState } from "@/features/workspace/components/workspace-error-state";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <WorkspaceErrorState onRetry={reset} />;
}
