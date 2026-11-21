import type {
  MemoInfo,
  MemoPostJsx,
  MemoTag,
  MemoLoaderData as LoaderData,
} from "lib/data/memos.common";
import { MenuSquare } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation, useSearchParams } from "react-router";
import { siteInfo } from "site.config";
import { FloatButton } from "~/components/common/FloatButton";
import ImageBrowser from "~/components/memo/ImageBrowser";
import { MemoCard, MemoLoading, type TMemo } from "~/components/memo/MemoCard";
import { Sidebar } from "~/components/memo/Sidebar";
import VirtualList from "~/components/memo/VirtualList";
import type { Route } from "./+types/memos";

const MEMO_CSR_API = "/data/memos";

// --- 1. SSG Loader (Server/Build Time) ---
export async function loader(): Promise<LoaderData> {
  const path = await import("path");
  const { loadJson } = await import("lib/fs/fs");

  const dataDir = path.join(process.cwd(), "public", "data", "memos");

  const [memos, info, tags] = await Promise.all([
    loadJson(path.join(dataDir, "0.json")) as Promise<MemoPostJsx[]>,
    loadJson(path.join(dataDir, "status.json")) as Promise<MemoInfo>,
    loadJson(path.join(dataDir, "tags.json")) as Promise<MemoTag[]>,
  ]);

  return {
    memos: memos ?? [],
    info: info ?? {
      memos: 0,
      tags: 0,
      imgs: 0,
      pages: 0,
      fileMap: [],
      pageMap: [],
    },
    tags: tags ?? [],
    source: "SSG",
  };
}

// --- 2. Client Loader (Browser) ---
export async function clientLoader({
  request,
  serverLoader,
}: Route.ClientLoaderArgs): Promise<LoaderData> {
  const url = new URL(request.url);
  const tag = url.searchParams.get("tag");
  const q = url.searchParams.get("q");

  // No query params -> Reuse SSG data
  if (!q && !tag) {
    return (await serverLoader()) as LoaderData;
  }

  const { filterMemos } = await import("lib/data/client/filter-memos");
  return (await filterMemos(q, tag)) ?? ((await serverLoader()) as LoaderData);
}

// Reapply query filters on direct visits while retaining the prerendered feed.
clientLoader.hydrate = true as const;

// --- 5. Meta ---
export function meta({}: Route.MetaArgs) {
  return [
    { title: `${siteInfo.author} - Memos` },
    { name: "description", content: "Micro-blogging and short thoughts" },
  ];
}

// --- 6. Main Component ---
export default function MemosPage({ loaderData }: Route.ComponentProps) {
  const {
    memos: loaderMemos,
    info,
    tags,
    source,
    filterTag,
    searchQuery,
  } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileSider, setIsMobileSider] = useState(false);
  const { t } = useTranslation();

  const navigation = useNavigation();
  const isSearching =
    navigation.state === "loading" &&
    navigation.location.pathname.replace(/\/$/, "") === "/memos" &&
    navigation.location.search !== "";

  const selectedTag = searchParams.get("tag") || filterTag;
  const currentSearchQuery = searchParams.get("q") || searchQuery;
  const isFiltered = source === "CSR" && (!!filterTag || !!searchQuery);

  // Handle tag click - pure CSR navigation
  const handleTagClick = useCallback(
    (tagName: string) => {
      setSearchParams((prev) => {
        if (prev.get("tag") === tagName) {
          prev.delete("tag"); // Toggle off
        } else {
          prev.set("tag", tagName);
        }
        prev.delete("q"); // Clear search when selecting tag
        return prev;
      });
    },
    [setSearchParams],
  );

  // Handle search - sets ?q= param which triggers clientLoader
  const handleSearch = useCallback(
    (query: string) => {
      setSearchParams((prev) => {
        if (query.trim()) {
          prev.set("q", query.trim());
          prev.delete("tag"); // Clear tag when searching
        } else {
          prev.delete("q");
        }
        return prev;
      });
    },
    [setSearchParams],
  );

  // Fetch more memos for infinite scroll (currently only when not filtered)
  const loadMore = useCallback(
    async (
      start: number,
      mode: "next" | "prev",
    ): Promise<TMemo[] | undefined> => {
      if (isFiltered) return undefined; // Don't fetch more when filtered

      const batchsize = 10;
      if (mode === "prev") {
        start = start - batchsize;
      }
      console.debug("%% loadMore at:", start, "mode:", mode);
      const pageStart = Math.floor(start / 10);
      const pageEnd = Math.floor((start + batchsize - 1) / 10);
      const indexStart = start % 10;
      const indexEnd = (start + batchsize - 1) % 10;

      // Check bounds
      if (pageStart < 0 || pageStart >= info.pages) return undefined;

      const urls: string[] = [];
      for (let i = pageStart; i <= Math.min(pageEnd, info.pages - 1); i++) {
        urls.push(`${MEMO_CSR_API}/${i}.json`);
      }

      console.debug("%% Fetching memos from:", urls);
      if (urls.length === 0) return undefined;
      const promises = urls.map(async (url) => {
        const res = await fetch(url);
        return res.json() as Promise<MemoPostJsx[]>;
      });

      const pages = await Promise.all(promises);
      let result = pages.flat();

      // Slice to get exact range
      if (pages.length === 1) {
        result = result.slice(indexStart, indexEnd + 1);
      } else {
        // First page: from indexStart to end
        // Last page: from 0 to indexEnd
        const firstPage = pages[0].slice(indexStart);
        const lastPage = pages[pages.length - 1].slice(0, indexEnd + 1);
        const middlePages = pages.slice(1, -1).flat();
        result = [...firstPage, ...middlePages, ...lastPage];
      }

      return result.length > 0 ? result : undefined;
    },
    [info.pages, isFiltered],
  );

  return (
    <>
      <div className="bg-bg-2 min-h-screen">
        {/* OneColLayout: max-width 1080px, centered, mobile and tablet full width */}
        <div className="mx-auto max-w-270 max-[780px]:max-w-full">
          {/* Float button - hidden on desktop or tablet (>=780px), shown on mobile */}
          <FloatButton
            Icon={MenuSquare}
            onClick={() => setIsMobileSider((v) => !v)}
            className="hidden max-[780px]:flex"
          />

          {/* TwoColLayout: flex row on desktop, column on mobile */}
          <div className="flex flex-col justify-center min-[780px]:flex-row">
            {/* Main column (Col) - flex: 3 1 0, stretches to fill available space */}
            <div
              className={`relative flex w-full flex-[3_1_0] flex-col px-4 pt-18 pb-12 [-ms-overflow-style:none] [scrollbar-width:none] max-[780px]:flex-[1_1_0] max-[580px]:px-0 min-[1080px]:max-w-170 [&::-webkit-scrollbar]:hidden`}
            >
              {/* Searching status - right aligned like PageDescription */}
              {(isSearching || isFiltered) && (
                <div className="text-text-gray-2 mr-4 text-right text-sm italic">
                  {isSearching
                    ? t("ui.searching")
                    : t("ui.searchResults", {
                        count: loaderData.memos.length,
                      })}
                  <span
                    className="hover:text-accent ml-3.5 cursor-pointer font-bold not-italic"
                    onClick={() => {
                      setSearchParams({});
                    }}
                  >
                    X
                  </span>
                </div>
              )}

              {/* Memo list container */}
              <div className="border-ui-line-gray-2 bg-bg mt-2.5 rounded-3xl border shadow-[0_0_12px_0_var(--shadow-bg)] max-[580px]:rounded-none max-[580px]:border-x-0">
                {isFiltered ? (
                  // Filtered view - simple list without virtual scroll
                  <VirtualList<TMemo>
                    key={`${loaderData.filterTag ?? ""}-${loaderData.searchQuery ?? ""}`}
                    id={`${loaderData.filterTag ?? ""}-${loaderData.searchQuery ?? ""}`}
                    className="virtualist *:border-ui-line-gray-2 *:border-b [&>*:first-child>.memocard]:rounded-t-3xl max-[580px]:[&>*:first-child>.memocard]:rounded-none [&>*:last-child]:border-b-transparent [&>*:last-child>.memocard]:rounded-b-3xl max-[580px]:[&>*:last-child>.memocard]:rounded-none"
                    initialItems={loaderData.memos}
                    Elem={(props) => (
                      <MemoCard
                        source={props.source}
                        onTagClick={handleTagClick}
                        triggerHeightChange={props.triggerHeightChange}
                      />
                    )}
                  />
                ) : (
                  // Normal view - virtual list with infinite scroll
                  <VirtualList<TMemo>
                    id={loaderData.source}
                    key={loaderData.source}
                    className="virtualist *:border-ui-line-gray-2 *:border-b [&>*:first-child>.memocard]:rounded-t-3xl max-[580px]:[&>*:first-child>.memocard]:rounded-none [&>*:has(+_div>.memoloading)]:border-b-transparent [&>*:has(+_div>.memoloading)>.memocard]:rounded-b-3xl [&>*:last-child>.memocard]:rounded-b-3xl max-[580px]:[&>*>.memocard]:rounded-none"
                    initialItems={loaderData.memos}
                    Elem={(props) => (
                      <MemoCard
                        source={props.source}
                        onTagClick={handleTagClick}
                        triggerHeightChange={props.triggerHeightChange}
                      />
                    )}
                    loadMore={loadMore}
                    Loading={MemoLoading}
                  />
                )}
              </div>
            </div>

            {/* Sidebar keeps its desktop width even without comments or tags. */}
            <div className="sticky top-0 flex max-h-screen flex-col">
              <Sidebar
                info={info}
                tags={tags}
                onTagClick={handleTagClick}
                onSearch={handleSearch}
                selectedTag={selectedTag}
                searchQuery={currentSearchQuery}
                isMobileSider={isMobileSider}
                onToggle={() => setIsMobileSider((v) => !v)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Image browser modal */}
      <ImageBrowser />
    </>
  );
}
