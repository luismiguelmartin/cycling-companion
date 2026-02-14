interface InfoBoxProps {
  children: React.ReactNode;
}

export function InfoBox({ children }: InfoBoxProps) {
  return (
    <div className="rounded-xl border border-blue-500/15 bg-blue-500/[0.06] p-4 text-[12px] leading-[1.6] text-[var(--text-secondary)]">
      {children}
    </div>
  );
}
