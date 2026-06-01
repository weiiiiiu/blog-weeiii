import { parseDate } from "lib/date";
import { Folder } from "lucide-react";
import { Link } from "react-router";
import useDateI18n from "~/hooks/use-date-i18n";
import "./ArticleItem.css";

type PostType = {
  slug: string;
  date: string;
  title?: string;
  categories?: string | null;
  description?: string | null;
};

type Props = {
  post: PostType;
  index: number;
};

export default function ArticleItem({ post, index }: Props) {
  const { dateI18n } = useDateI18n();

  return (
    <Link
      to={`/posts/${post.slug}`}
      className="article-card group relative block min-h-24 cursor-pointer max-md:min-h-21"
    >
      <div className="relative py-4 pb-10">
        {/* Meta: date + category */}
        <div className="text-text-gray-2 my-2">
          <span className="text-sm font-medium">
            {dateI18n(parseDate(post.date), "dateNatural")}
          </span>
          <Folder size="1em" className="mr-1 mb-0.5 ml-2 inline" />
          <span className="inline-block text-sm font-medium">
            {post.categories}
          </span>
        </div>

        {/* Title + Description container with hover effect */}
        <div className="post-container">
          {/* Title */}
          <span className="title text-xl font-medium max-md:text-xl">
            {post.title}
          </span>

          {/* Description */}
          <div className="text-text-secondary my-2 text-sm">
            {post.description}
          </div>
        </div>
      </div>
    </Link>
  );
}
