export function PublicShell({
  children,
  contentClassName = "mx-auto max-w-6xl px-6 py-12 lg:px-8",
  pageClassName = "",
}: {
  children: React.ReactNode;
  contentClassName?: string;
  pageClassName?: string;
}) {
  return (
    <div className={`min-h-dvh bg-paper font-sans text-ink-900 antialiased ${pageClassName}`}>
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(6,183,126,0.12),transparent_40%)]" />
        <div className="absolute inset-0 bg-grid opacity-20" />
      </div>
      <main className={`relative z-10 ${contentClassName}`}>{children}</main>
    </div>
  );
}
