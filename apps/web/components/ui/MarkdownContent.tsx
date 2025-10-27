'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Markdown content renderer with beautiful typography
 * Supports GitHub Flavored Markdown (GFM) including tables, strikethrough, etc.
 */
export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-foreground mb-4 mt-6 pb-2 border-b border-border">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-foreground mb-3 mt-5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-foreground mb-2 mt-4">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-foreground mb-2 mt-3">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-semibold text-foreground mb-1 mt-2">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-sm font-medium text-muted-foreground mb-1 mt-2">
              {children}
            </h6>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="text-card-foreground mb-4 leading-relaxed">
              {children}
            </p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-2 text-card-foreground ml-4">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 text-card-foreground ml-4">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">
              {children}
            </li>
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-700 underline decoration-primary/30 hover:decoration-primary transition-colors"
            >
              {children}
            </a>
          ),

          // Emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground">
              {children}
            </em>
          ),

          // Code
          code: ({ className, children }) => {
            const isInline = !className;

            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 bg-muted border border-border rounded text-sm font-mono text-accent-600">
                  {children}
                </code>
              );
            }

            return (
              <code className="block p-4 bg-neutral-900 border border-neutral-800 rounded-lg text-sm font-mono text-neutral-100 overflow-x-auto mb-4">
                {children}
              </code>
            );
          },

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 bg-muted/30 italic text-muted-foreground">
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => (
            <hr className="my-6 border-t border-border" />
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-border border border-border rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border bg-card">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/30 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-card-foreground">
              {children}
            </td>
          ),

          // Strikethrough (GFM)
          del: ({ children }) => (
            <del className="line-through text-muted-foreground">
              {children}
            </del>
          ),

          // Task lists (GFM)
          input: ({ checked, disabled }) => (
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              className="mr-2 accent-primary"
              readOnly
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
