interface AdminEmptyProps {
  message: string;
}

export function AdminEmpty({ message }: AdminEmptyProps) {
  return (
    <div className="text-center py-12 text-neutral text-sm">
      {message}
    </div>
  );
}
