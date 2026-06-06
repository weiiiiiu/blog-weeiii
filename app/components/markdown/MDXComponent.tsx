import { runSync } from "@mdx-js/mdx";
import { useMemo, type ComponentType } from "react";
import * as runtime from "react/jsx-runtime";

interface MDXProps {
  code: string;
  components?: Record<string, ComponentType<any>>;
}

type MDXModule = {
  default: ComponentType<{
    components?: Record<string, ComponentType<any>>;
  }>;
};

// parse the Velite generated MDX code into a React component function
export const MDXContent = ({ code, components }: MDXProps) => {
  const MDXModule = useMemo(() => runSync(code, runtime) as MDXModule, [code]);
  const mdxComponents = useMemo(() => ({ ...components }), [components]);

  return <MDXModule.default components={mdxComponents} />;
};
