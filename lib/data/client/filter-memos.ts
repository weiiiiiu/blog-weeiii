import type {
  MemoInfo,
  MemoTag,
  MemoLoaderData,
  MemoPostJsx,
} from "../memos.common";
import { MEMO_SEARCH_INDEX_FILE, type MemoSearchObj } from "../search.common";
import { toMdxCode } from "lib/md-compile/compile";
import { remarkTag } from "lib/remark/remark-tag";
import { createNaive, type Match, type Result } from "lib/search";
import { parseSearchQuery } from "~/hooks/use-search";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

const MEMO_CSR_API = "/data/memos";

/** Loaded only for search/tag filtering; the default feed needs no compiler. */
export async function filterMemos(
  q: string | null,
  tag: string | null,
): Promise<MemoLoaderData | null> {
  // Fetch common data for CSR operations
  const fetchCommonData = async () => {
    const [info, tags] = await Promise.all([
      fetch(`${MEMO_CSR_API}/status.json`).then((r) =>
        r.json(),
      ) as Promise<MemoInfo>,
      fetch(`${MEMO_CSR_API}/tags.json`).then((r) => r.json()) as Promise<
        MemoTag[]
      >,
    ]);
    return { info, tags };
  };

  // Search result type
  interface MemoSearchResult extends Result {
    id: string;
    content: string;
    tags: string[];
    imgs_md: string[];
    matches: Match[];
    word_count: number;
  }

  const { info, tags } = await fetchCommonData();

  // Fetch search index
  const searchIndex = (await fetch(`/data/${MEMO_SEARCH_INDEX_FILE}`).then(
    (r) => r.json(),
  )) as MemoSearchObj[];

  // Determine search patterns and config based on query type
  let patterns: string[];
  let searchConfig: { fields?: Array<keyof MemoSearchObj> } | undefined;

  if (q) {
    // Parse search query with field syntax support
    const parsed = parseSearchQuery<MemoSearchObj>(q);
    patterns = parsed.patterns;
    searchConfig = parsed.config;
  } else {
    // Tag filter: search tags field with exact tag name
    patterns = [tag!];
    searchConfig = { fields: ["tags"] };
  }

  if (patterns.length === 0) {
    return null;
  }

  // Create search engine and collect results
  const results: MemoSearchResult[] = [];
  const engine = createNaive<MemoSearchObj, MemoSearchResult>({
    data: searchIndex,
    field: ["tags", "content"],
    notifier: (res) => {
      results.length = 0;
      results.push(...res);
    },
    disableStreamNotify: true,
    buildResult: (obj, matches) => ({
      id: obj.id,
      content: obj.content,
      tags: obj.tags,
      imgs_md: obj.imgs_md,
      matches,
      word_count: obj.word_count,
    }),
  });

  await engine.search(patterns, searchConfig);

  // Convert search results to MemoPostJsx (compile markdown to jsx)
  const memos: MemoPostJsx[] = await Promise.all(
    results.map(async (r) => {
      const { code } = await toMdxCode(r.content, {
        remarkPlugins: [remarkGfm, remarkTag],
        rehypePlugins: [rehypeHighlight],
      });
      return {
        id: r.id,
        content_jsx: code,
        tags: r.tags,
        imgs_md: r.imgs_md,
        sourceFile: "",
        csrIndex: [0, 0] as [number, number],
        word_count: r.word_count,
      };
    }),
  );

  return {
    memos,
    info,
    tags,
    source: "CSR",
    filterTag: tag ?? undefined,
    searchQuery: q ?? undefined,
  };
}
