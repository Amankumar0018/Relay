import React from "react";
import { WorkspaceLayout } from "@/components/shell/WorkspaceLayout";

export default function AppRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkspaceLayout>{children}</WorkspaceLayout>;
}

