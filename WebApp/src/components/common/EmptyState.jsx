export const EmptyState = ({ title = 'No data available', message = 'There are no items to display.', children }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
    <h2 className="text-xl font-bold text-slate-950">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{message}</p>{children && <div className="mt-4">{children}</div>}
  </div>
);

export default EmptyState;
