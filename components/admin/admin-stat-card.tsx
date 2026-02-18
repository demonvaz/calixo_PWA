interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon?: string;
}

export function AdminStatCard({ label, value, icon }: AdminStatCardProps) {
  return (
    <div className="p-4 rounded-xl border border-neutral/10 bg-white">
      <p className="text-xs text-neutral">{label}</p>
      <div className="flex items-center justify-between mt-1">
        <span className="text-2xl font-bold text-text-dark font-serif">{value}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
    </div>
  );
}
