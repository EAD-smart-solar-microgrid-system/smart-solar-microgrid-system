export const PageHeader = ({ title, subtitle, badgeText, children }) => {
  if (!title) return null;
  return (
    <header className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
      <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-bold text-slate-950">{title}</h1>{badgeText && <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">{badgeText}</span>}</div>{subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}</div>
      {children && <div>{children}</div>}
    </header>
  );
};

export default PageHeader;
