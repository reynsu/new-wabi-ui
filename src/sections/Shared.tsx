import type { ReactNode } from "react";

export function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[15px] font-medium tracking-tight">{title}</h2>
        {hint && <p className="text-[13px] text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-4">{children}</div>;
}
