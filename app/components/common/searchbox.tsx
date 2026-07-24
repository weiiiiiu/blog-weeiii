import type { PostSearchObj } from "lib/data/search.common";
import { POSTS_SEARCH_INDEX_FILE } from "lib/data/search.common";
import type { Match, Result } from "lib/search";
import { debounce } from "lib/throttle";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import useSearch from "~/hooks/use-search";

/**
 * Search result type for posts
 */
export interface PostSearchResult extends Result {
  id: string;
  title: string;
  matches: Match[];
}

type Props = {
  outSetSearch: (isShow: boolean) => void;
  outIsShow: boolean;
  iconEle: React.RefObject<HTMLDivElement | null>;
};

function getPostPath(result: PostSearchResult) {
  const id = result.id.substring(0, result.id.lastIndexOf(".")) || result.id;
  return `/posts/${id}`;
}

function SearchBox({ outSetSearch: outShow, outIsShow, iconEle }: Props) {
  const [res, setRes] = useState<PostSearchResult[]>([]);
  const [selected, setSelected] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const initData = useCallback(async () => {
    const response = await fetch(`/data/${POSTS_SEARCH_INDEX_FILE}`);
    const data = (await response.json()) as PostSearchObj[];

    return {
      data,
      fields: ["title", "tags", "description", "keywords", "content"] as Array<
        keyof PostSearchObj
      >,
      buildResult: (
        obj: PostSearchObj,
        matches: Match[],
      ): PostSearchResult => ({
        id: obj.id,
        title: obj.title,
        matches,
      }),
    };
  }, []);

  const { searchStatus, search } = useSearch<PostSearchObj, PostSearchResult>({
    inputRef,
    setRes,
    initData,
  });

  // Debounced search on input
  const debouncedSearch = useMemo(
    () =>
      debounce(() => {
        search();
      }, 300),
    [search],
  );

  /**
   * UI control
   */
  const close = useCallback(() => {
    setSelected(-1);
    outShow(false);
  }, [outShow]);

  // Click Outside to close & Esc to close
  useEffect(() => {
    if (!outIsShow) return;

    function handleClick(e: MouseEvent) {
      const clickSearchBox =
        containerRef.current && containerRef.current.contains(e.target as Node);
      const clickSearchIcon =
        iconEle.current && iconEle.current.contains(e.target as Node);
      if (!clickSearchBox && !clickSearchIcon) {
        close();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
      }
    }

    document.addEventListener("pointerdown", handleClick, false);
    document.addEventListener("keydown", handleKeyDown, false);

    return () => {
      document.removeEventListener("pointerdown", handleClick, false);
      document.removeEventListener("keydown", handleKeyDown, false);
    };
  }, [iconEle, close, outIsShow]);

  // Focus on open
  useEffect(() => {
    if (!outIsShow) return;

    setSelected(0);

    const frameId = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frameId);
  }, [outIsShow]);

  // Handle input change - search on typing
  const handleInput = () => {
    debouncedSearch();
  };

  // Reset keyboard selection when a new result set is committed.
  useLayoutEffect(() => {
    setSelected(res.length > 0 ? 0 : -1);
  }, [res]);

  // Keyboard navigation for search results
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((current) => Math.min(current + 1, res.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((current) => Math.max(current - 1, 0));
      } else if (e.key === "Enter" && selected >= 0 && selected < res.length) {
        e.preventDefault();
        close();
        void navigate(getPostPath(res[selected]));
      }
    },
    [close, navigate, res, selected],
  );

  const highlightSlot = useCallback(
    (s: string, patterns: string | string[] | undefined) => {
      if (!patterns) return s;

      if (typeof patterns === "string") {
        patterns = [patterns];
      }

      const regexPattern = new RegExp(`(${patterns.join("|")})`, "gi");
      const matches = s.split(regexPattern);

      return (
        <>
          {matches.map((match, index) => {
            if (regexPattern.test(match)) {
              return (
                <mark key={index} className="text-accent bg-transparent">
                  {match}
                </mark>
              );
            } else {
              return <span key={index}>{match}</span>;
            }
          })}
        </>
      );
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      className={`bg-bg border-ui-line-gray-2 fixed top-13.75 right-0 z-11 m-[0_10px] w-96 overflow-hidden rounded-xl border shadow-[0_0_12px_var(--shadow-bg)] transition-[opacity,transform] duration-300 ease-out max-[580px]:max-h-[50%] max-[580px]:w-[96%] ${
        outIsShow
          ? "visible translate-y-0 opacity-100"
          : "pointer-events-none invisible -translate-y-2.5 opacity-0"
      } `}
    >
      {/* Sticky search input */}
      <div className="bg-bg sticky top-0 p-4 pb-0">
        <input
          type="text"
          placeholder={t("ui.searchPlaceholder")}
          ref={inputRef}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="bg-bg text-text-primary w-full rounded-none border-none focus:outline-none focus-visible:outline-none"
        />
      </div>

      {/* Scrollable results */}
      <div className="max-h-[60vh] overflow-y-auto px-4 py-2">
        {searchStatus.isSearch === "ready" ? (
          <div className="text-sm opacity-50">
            <div className="text-text-gray overflow-hidden text-sm whitespace-nowrap">
              {t("ui.searchHint")}
            </div>
          </div>
        ) : searchStatus.isSearch === "searching" ? (
          <div className="text-sm opacity-50">
            <div className="text-text-gray overflow-hidden text-sm whitespace-nowrap">
              {t("ui.searching")}
            </div>
          </div>
        ) : res.length === 0 ? (
          <div className="text-sm opacity-50">
            <div className="text-text-gray overflow-hidden text-sm whitespace-nowrap">
              {t("ui.noResults")}
            </div>
          </div>
        ) : (
          // Seach Done
          res.map((r, i) => {
            const path = getPostPath(r);
            return (
              <Link
                to={path}
                key={i}
                onClick={() => close()}
                className={`group block rounded-md py-1.5 pl-4 ${
                  selected === i ? "bg-tag-bg" : ""
                }`}
              >
                <span className="before:text-accent relative transition-shadow duration-500 group-hover:shadow-[inset_0_-0.5em_0_var(--accent-hover)] before:absolute before:-left-3.5 before:content-['•']">
                  {highlightSlot(
                    r.title,
                    r.matches?.map((e) => e.word),
                  )}
                </span>
                {r.matches?.map(
                  (e) =>
                    e.excerpt && (
                      <div
                        key={e.word}
                        className="text-text-gray overflow-hidden text-sm whitespace-nowrap"
                      >
                        {highlightSlot(e.excerpt, e.word)}
                      </div>
                    ),
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

export default SearchBox;
