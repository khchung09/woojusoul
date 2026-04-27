export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div
        className="h-9 w-9 animate-spin rounded-full border-[3px] border-stone-100"
        style={{ borderTopColor: "#6B7C3A" }}
      />
    </div>
  );
}
