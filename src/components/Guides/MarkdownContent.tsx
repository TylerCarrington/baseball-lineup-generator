import React from 'react';
import Markdown from 'react-markdown';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  return (
    <div className={`text-slate-800 dark:text-slate-200 ${className}`}>
      <Markdown
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-8 mb-4 tracking-tight border-b border-slate-200 dark:border-slate-800 pb-2 first:mt-0"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-7 mb-3 tracking-tight border-b border-slate-200/60 dark:border-slate-800/60 pb-1.5 first:mt-0"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-6 mb-2.5 tracking-tight flex items-center gap-2 first:mt-0"
              {...props}
            />
          ),
          h4: ({ node, ...props }) => (
            <h4
              className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2 first:mt-0"
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p
              className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed mb-4 font-normal"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul
              className="list-disc list-outside ml-5 space-y-2 mb-5 text-sm sm:text-base text-slate-700 dark:text-slate-200"
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className="list-decimal list-outside ml-5 space-y-2 mb-5 text-sm sm:text-base text-slate-700 dark:text-slate-200"
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li
              className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed pl-1"
              {...props}
            />
          ),
          strong: ({ node, ...props }) => (
            <strong
              className="font-bold text-slate-900 dark:text-white"
              {...props}
            />
          ),
          em: ({ node, ...props }) => (
            <em
              className="italic text-slate-800 dark:text-slate-300"
              {...props}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-emerald-500 pl-4 py-2 my-4 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-r-2xl text-sm sm:text-base italic text-slate-700 dark:text-slate-200"
              {...props}
            />
          ),
          hr: ({ node, ...props }) => (
            <hr
              className="my-6 border-slate-200 dark:border-slate-800"
              {...props}
            />
          ),
          code: ({ node, ...props }) => (
            <code
              className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-mono text-xs rounded-md"
              {...props}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-emerald-600 dark:text-emerald-400 font-bold underline hover:text-emerald-500 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};
