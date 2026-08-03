import { init } from "@waline/client";
import "@waline/client/style";
import { walinePath } from "lib/waline-path";
import { useEffect } from "react";
import { siteInfo } from "site.config";
import "./waline.scss";

const Waline = (props: React.HTMLProps<HTMLDivElement>) => {
  if (!siteInfo.walineApi) return;

  useEffect(() => {
    if (!siteInfo.walineApi) {
      return;
    }
    init({
      el: "#waline",
      serverURL: siteInfo.walineApi,
      path: walinePath(window.location.pathname),
      pageview: true,
      comment: true,
    });
  }, []);

  return (
    <div id="waline" {...props}>
      Waline
    </div>
  );
};

export default Waline;
