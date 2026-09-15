import React from "react";

/**
 * Header band used by the feature screens. Mirrors the existing header card on
 * the Documents page so the pages read as one product.
 */
const PageHeader = ({ icon: Icon, title, description, actions }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl shadow-sm">
            <Icon className="w-7 h-7 text-blue-700" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">{title}</h1>
          {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
        </div>
      </div>

      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  </div>
);

export default PageHeader;
