import { useEffect, useState } from "react";
import { siteInfo } from "site.config";
import { OneColLayout } from "~/components/common/layout";
import type { Route } from "./+types/about";
import "./about.css";

export async function loader() {
  const { about } = await import("../../../.velite");
  return about;
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: `About ${siteInfo.author}` },
    {
      name: "description",
      content: loaderData.description ?? "A personal blog about work and life",
    },
  ];
}

export default function About({ loaderData }: Route.ComponentProps) {
  const [isBgLoaded, setIsBgLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = "/imgs/bg.jpg";
    img.onload = () => setIsBgLoaded(true);
    img.onerror = () => {};

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, []);

  return (
    <>
      {/* Hero Section */}
      <h1 className={`about-hero ${isBgLoaded ? "loaded" : ""}`}>
        <span>{loaderData.hero ?? `Hi, I'm ${siteInfo.author}`}</span>
      </h1>

      <OneColLayout>
        {/* Page Description */}
        {loaderData.subtitle && (
          <div className="text-text-gray-2 text-right text-sm italic">
            {loaderData.subtitle}
          </div>
        )}

        {/* Content — 来自 content/pages/about.md，可在 Pages CMS 后台编辑 */}
        <div
          className="markdown-wrapper animate-bottom-fade-in"
          dangerouslySetInnerHTML={{ __html: loaderData.content_html }}
        />
      </OneColLayout>
    </>
  );
}
