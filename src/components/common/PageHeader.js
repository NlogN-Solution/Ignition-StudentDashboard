import React from "react";

/**
 * Header band used by the feature screens. Mirrors the existing header card on
 * the Documents page so the pages read as one product.
 */
const PageHeader = ({ icon: Icon, title, description, actions }) => (
  <div className="relative overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-slate-200">
    {/* Faint brand glow, echoing the sign-in panel's ignite/navy accents */}
    <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-ignite-500/5 blur-3xl" />
    <div className="pointer-events-none absolute -left-10 -bottom-24 h-40 w-40 rounded-full bg-navy-500/5 blur-3xl" />

    <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="p-3 bg-gradient-to-br from-navy-800 to-navy-950 rounded-2xl shadow-sm shadow-navy-900/20">
            <Icon className="w-7 h-7 text-ignite-400" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-navy-900 leading-tight">{title}</h1>
          {description && <p className="mt-2 text-sm text-slate-600">{description}</p>}
        </div>
      </div>

      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  </div>
);

export default PageHeader;
