export default function DashboardLoading() {
  return (
    <div className="flex animate-pulse">
      <main className="flex-1 px-4 sm:px-8 lg:px-12 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 w-40 bg-vellum-high/40 rounded" />
          <div className="h-8 w-36 bg-vellum-high/40 rounded" />
        </div>
        <div className="h-10 bg-vellum-low rounded mb-6" />
        <div className="hidden md:flex gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-1 min-h-[50vh] bg-vellum-low rounded-lg p-3 space-y-3">
              <div className="h-3 w-16 bg-vellum-high/50 rounded" />
              {[...Array(i % 3)].map((_, j) => (
                <div key={j} className="h-24 bg-vellum-lowest rounded" />
              ))}
            </div>
          ))}
        </div>
        <div className="md:hidden h-[45vh] bg-vellum-low rounded-lg" />
      </main>
      <aside className="hidden lg:block w-80 xl:w-96 bg-vellum-low p-8 space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 bg-vellum-high/50 rounded" />
            <div className="h-14 bg-vellum-lowest rounded" />
          </div>
        ))}
      </aside>
    </div>
  );
}
