import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  return (
    <div
      role="status"
      className="sticky top-0 z-[55] flex items-center justify-center gap-2 bg-ink px-4 py-2 text-center text-[12px] text-white"
    >
      <WifiOff className="size-3.5 shrink-0" />
      You’re offline — showing saved tasks. Changes need a connection.
    </div>
  );
}
