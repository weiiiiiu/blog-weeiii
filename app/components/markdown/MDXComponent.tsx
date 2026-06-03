import { runSync } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";

interface MDXProps {
  code: string;
  components?: Record<string, React.ComponentType<any>>;
}

// parse the Velite generated MDX code into a React component function
export const MDXContent = ({ code, components }: MDXProps) => {
  const MDXModule = runSync(code, runtime);
  return <MDXModule.default components={{ ...components }} />;
};
