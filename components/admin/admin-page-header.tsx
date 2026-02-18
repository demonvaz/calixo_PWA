import Link from 'next/link';

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
}

export function AdminPageHeader({ title, subtitle, action }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-dark font-serif">{title}</h1>
        {subtitle && <p className="text-sm text-neutral mt-0.5">{subtitle}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shrink-0"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
