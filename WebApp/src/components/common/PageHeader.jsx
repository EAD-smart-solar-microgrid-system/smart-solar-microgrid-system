export const PageHeader = ({ title, subtitle, badgeText, children }) => {
  if (!title) return null;
  return (
    <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>{badgeText && <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">{badgeText}</span>}</div>{subtitle && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{subtitle}</p>}</div>
      {children && <div className="flex shrink-0 flex-wrap gap-2">{children}</div>}
    </header>
  );
};

export default PageHeader;
