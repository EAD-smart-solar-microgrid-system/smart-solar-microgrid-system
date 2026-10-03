import React from 'react';

export const EmptyState = ({
  title = 'No data available',
  message = 'There are no items to display.',
  children,
}) => (
  <div className="rounded-2xl border border-dashed border-white/10 bg-[#111715] px-6 py-12 text-center shadow-md">
    <h2 className="text-base sm:text-lg font-bold text-[#f4f7f6]">{title}</h2>
    <p className="mx-auto mt-1.5 max-w-md text-xs sm:text-sm text-[#738079]">{message}</p>
    {children && <div className="mt-4">{children}</div>}
  </div>
);

export default EmptyState;
