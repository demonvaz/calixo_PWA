interface AdminStatCardProps {
  label: string;
  value: string | number;
}

export function AdminStatCard({ label, value }: AdminStatCardProps) {
  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-neutral/10 bg-white shadow-sm transition-shadow hover:shadow-md">
      <p className="text-xs font-medium text-neutral uppercase tracking-wide">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold text-text-dark font-serif mt-2">{value}</p>
    </div>
  );
}
