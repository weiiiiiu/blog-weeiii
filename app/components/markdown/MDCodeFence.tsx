import { Check, Copy } from "lucide-react";
import type { DetailedHTMLProps, HTMLAttributes } from "react";
import { useState } from "react";

interface PreProps extends DetailedHTMLProps<
  HTMLAttributes<HTMLPreElement>,
  HTMLPreElement
> {
  children?: React.ReactNode;
}

export function MDCodeFence(props: PreProps) {
  const { children, ...rest } = props;
  const [copied, setCopied] = useState(false);

  // Extract code element and its props
  const codeElement = children as React.ReactElement<{
    className?: string;
    children?: string;
  }>;
  const className = codeElement?.props?.className || "";
  const code = codeElement?.props?.children || "";

  // Parse language from className (format: "language-xxx")
  const language = className.replace(/hljs language-/, "");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-ui-line-gray-2 my-4 overflow-hidden rounded-lg border">
      <div className="bg-code-block-bg text-text-gray border-ui-line-gray-2 flex items-center justify-between border-b px-2 py-1 text-sm">
        <span className="px-2 py-1 font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="hover:bg-hover-bg flex cursor-pointer items-center gap-1.5 rounded px-2 py-1"
        >
          {copied ? (
            <>
              <Check size={14} style={{ margin: 0 }} />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={14} style={{ margin: 0 }} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre {...rest} className="bg-code-block-bg m-0">
        <code className={{ className } + " max-h-70 overflow-y-auto"}>
          {code}
        </code>
      </pre>
    </div>
  );
}
