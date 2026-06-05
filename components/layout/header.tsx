import type { ReactNode } from "react";

interface HeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function Header({ title, description, action }: HeaderProps) {
  return (
    <div className="hidden flex-col gap-4 border-b border-border px-4 py-5 sm:flex-row sm:items-start sm:justify-between md:flex md:px-6 md:py-6">
      <div className="min-w-0 flex-1">
        <h1 className="break-words text-2xl font-bold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 break-words text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
