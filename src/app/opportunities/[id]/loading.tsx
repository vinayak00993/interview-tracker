export default function OpportunityLoading() {
  return (
    <div className="min-h-screen bg-vellum-low animate-pulse">
      <header className="border-b border-transparent px-6 py-3 flex items-center gap-4 bg-warm-50/80 backdrop-blur-sm">
        <div className="h-7 w-24 bg-vellum-high/30 rounded-lg" />
        <div className="h-4 w-px bg-vellum-high" />
        <div className="h-3 w-20 bg-vellum-high/30 rounded" />
      </header>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header skeleton */}
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-2">
            <div className="h-7 w-40 bg-vellum-high/30 rounded" />
            <div className="h-4 w-56 bg-vellum-high/20 rounded" />
            <div className="h-3 w-72 bg-vellum-high/15 rounded mt-3" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 bg-vellum-high/30 rounded-lg" />
            <div className="h-8 w-14 bg-vellum-high/20 rounded-lg" />
          </div>
        </div>
        {/* Tabs skeleton */}
        <div className="flex gap-4 border-b border-transparent mb-6 pb-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 w-20 bg-vellum-high/25 rounded" />
          ))}
        </div>
        {/* Content skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/60 border border-transparent rounded-xl p-4 space-y-2">
              <div className="h-3 w-16 bg-vellum-high/30 rounded" />
              <div className="h-5 w-28 bg-vellum-high/25 rounded" />
              <div className="h-3 w-20 bg-vellum-high/15 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
