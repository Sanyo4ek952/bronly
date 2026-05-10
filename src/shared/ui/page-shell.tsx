type PageShellProps = Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
}>;

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-3xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-6">{children}</div>
    </section>
  );
}
