import React from 'react';
import type { EmailCategory } from '../../context/AIContext';

interface CategoryBadgeProps {
  category: EmailCategory;
  size?: 'sm' | 'md';
}

const CATEGORY_STYLES: Record<EmailCategory, { bg: string; text: string; icon: string }> = {
  Primary: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: '📥' },
  Updates: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', icon: '🔔' },
  Social: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: '👥' },
  Promotions: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: '🏷️' },
  Forums: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700', icon: '💬' },
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'sm',
}) => {
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.Primary;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium shadow-2xs ${style.bg} ${style.text} ${sizeClasses}`}
    >
      <span className="text-[11px]">{style.icon}</span>
      <span>{category}</span>
    </span>
  );
};
