export default function OpportunityLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 py-10 animate-pulse">
      <div className="h-3 w-24 bg-vellum-high/40 rounded mb-3" />
      <div className="h-10 w-2/3 bg-vellum-high/40 rounded mb-3" />
      <div className="h-5 w-1/3 bg-vellum-high/30 rounded mb-8" />
      <div className="flex gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-4 w-16 bg-vellum-high/30 rounded" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-vellum-low rounded-lg" />
        ))}
      </div>
    </div>
  );
}
