import React from 'react';
import { PackageOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmptyState = ({
  icon: Icon = PackageOpen,
  title = "No Products Found",
  message = "Products coming soon. Please check back later.",
  actionText,
  actionLink,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm my-6">
      <div className="w-16 h-16 bg-emerald-50 text-forest rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-emerald-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md text-sm mb-6 leading-relaxed">{message}</p>
      
      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest hover:bg-forest-light text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
        >
          {actionText}
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}

      {actionText && onAction && !actionLink && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest hover:bg-forest-light text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
