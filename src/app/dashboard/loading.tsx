export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-warm-100 animate-pulse">
      <header className="border-b border-warm-300/60 px-6 py-4 flex items-center justify-between bg-warm-50/80 backdrop-blur-sm">
        <div>
          <div className="h-5 w-36 bg-warm-300/40 rounded" />
          <div className="h-3 w-52 bg-warm-300/30 rounded mt-2" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-7 w-24 bg-warm-300/30 rounded-lg" />
          <div className="h-7 w-16 bg-warm-300/30 rounded-lg" />
          <div className="h-4 w-24 bg-warm-300/30 rounded" />
        </div>
      </header>
      <div className="flex">
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-20 bg-warm-300/30 rounded" />
            <div className="h-7 w-32 bg-warm-300/30 rounded-lg" />
          </div>
          <div className="flex gap-4 mt-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-1 min-w-[180px] space-y-3">
                <div className="h-4 w-20 bg-warm-300/30 rounded mx-3" />
                {i === 0 && [...Array(3)].map((_, j) => (
                  <div key={j} className="mx-2 bg-white/60 border border-warm-300/40 rounded-xl p-3 space-y-2">
                    <div className="h-4 w-24 bg-warm-300/30 rounded" />
                    <div className="h-3 w-36 bg-warm-300/20 rounded" />
                    <div className="h-3 w-20 bg-warm-300/20 rounded" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </main>
        <aside className="w-80 border-l border-warm-300/40 p-5 space-y-6 bg-warm-50/60">
          <div className="h-4 w-32 bg-warm-300/30 rounded" />
          <div className="h-3 w-44 bg-warm-300/20 rounded" />
        </aside>
      </div>
    </div>
  );
}
