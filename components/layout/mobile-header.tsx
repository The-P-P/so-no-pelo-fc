interface MobileHeaderProps {
  teamName?: string;
  pageTitle?: string;
}

export function MobileHeader({ teamName, pageTitle }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md md:hidden">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">
          ⚽
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight">
            {pageTitle ?? teamName ?? "Só no Pelo FC"}
          </p>
          {pageTitle && teamName && (
            <p className="truncate text-xs text-muted-foreground">{teamName}</p>
          )}
          {!pageTitle && (
            <p className="truncate text-xs text-muted-foreground">
              Stats de várzea
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
