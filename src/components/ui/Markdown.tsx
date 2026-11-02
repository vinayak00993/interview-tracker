import ReactMarkdown from "react-markdown";

/** Markdown rendered in the manuscript style, for AI output and notes. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-ink-800 leading-relaxed">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="font-serif text-xl font-semibold text-ink-900 mt-6 mb-3 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="font-serif text-lg font-semibold text-ink-900 mt-6 mb-2 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="font-serif text-base font-semibold text-ink-900 mt-4 mb-1.5">{children}</h3>,
          p: ({ children }) => <p className="text-sm my-2.5">{children}</p>,
          ul: ({ children }) => <ul className="my-2.5 space-y-1.5 pl-5 list-disc marker:text-ink-400">{children}</ul>,
          ol: ({ children }) => <ol className="my-2.5 space-y-1.5 pl-5 list-decimal marker:text-ink-400">{children}</ol>,
          li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-ink-900">{children}</strong>,
          em: ({ children }) => <em className="italic text-ink-700">{children}</em>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-terracotta/40 pl-3 my-3 text-sm text-ink-700 italic">{children}</blockquote>,
          hr: () => <hr className="my-4 border-vellum-high" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="text-left p-2 text-[10px] uppercase tracking-label text-ink-600 font-semibold border-b border-vellum-high">{children}</th>,
          td: ({ children }) => <td className="p-2 align-top border-b border-vellum-mid/50">{children}</td>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-terracotta underline underline-offset-2">
              {children}
            </a>
          ),
          code: ({ children }) => <code className="text-xs bg-vellum-low px-1 py-0.5 rounded">{children}</code>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
