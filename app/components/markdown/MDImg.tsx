import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DetailedHTMLProps,
  type ImgHTMLAttributes,
  type Ref,
} from "react";
import { useTranslation } from "react-i18next";
import { useDocumentEvent } from "~/hooks/use-event";
import { useViewHeight, useViewWidth } from "~/hooks/use-view";
import { SkeletonError } from "../common/skeleton";

type ImageProps = DetailedHTMLProps<
  ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
>;

export function MDImg(props: ImageProps) {
  // Reset load and zoom state when client-side navigation changes the image.
  return <MarkdownImage key={`${props.src}:${props.srcSet}`} {...props} />;
}

function MarkdownImage(props: ImageProps) {
  const { t } = useTranslation();
  const [isModal, setisModal] = useState(false);
  const [isLoading, setisLoading] = useState(true);
  const [isError, setisError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const imgRef: Ref<HTMLImageElement> | undefined = useRef(null);
  const containerRef: Ref<HTMLDivElement> | undefined = useRef(null);

  // life cycle - init style
  const [containerStyle, setContainerStyle] = useState<
    CSSProperties & {
      width: string;
      height: string;
    }
  >({ width: "100%", height: "auto" });
  const [imgStyle, setImgStyle] = useState<CSSProperties>({});

  const vw = useViewWidth();
  const vh = useViewHeight();

  const handleImageLoaded = useCallback(() => {
    setisLoading(false);
    setisError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setisLoading(false);
    setisError(true);
  }, []);

  useEffect(() => {
    const elem = imgRef.current;
    // A prerendered image can finish before hydration; broken images are also complete.
    if (!elem?.complete) return;
    if (elem.naturalWidth > 0) handleImageLoaded();
    else handleImageError();
  }, [attempt, handleImageLoaded, handleImageError]);

  // Close on scroll
  useDocumentEvent(
    "scroll",
    () => {
      if (isModal) {
        handleClick();
      }
    },
    false,
    [isModal],
  );

  // Click to show or hide image model
  const handleClick = useCallback(() => {
    if (isLoading || isError || !imgRef.current?.naturalWidth) return;
    if (isModal && imgRef.current && containerRef.current) {
      // hide model
      //0ms
      setImgStyle((s) => {
        return {
          ...s,
          transform: "scale(1) translate(0,0)",
          cursor: "zoom-in",
        };
      });
      // 300ms
      setTimeout(() => {
        setImgStyle((s) => {
          return {
            ...s,
            zIndex: "auto",
          };
        });
        setContainerStyle((s) => {
          return {
            ...s,
            height: "auto",
            zIndex: "auto",
          };
        });
      }, 300);
    } else if (imgRef.current && containerRef.current) {
      // show model
      const img = imgRef.current.getBoundingClientRect();
      const ctn = containerRef.current.getBoundingClientRect();
      const width = img.width;
      const height = img.height;
      const transY = -(img.y - vh / 2 + height / 2);
      const transX = img.x - 2 * ctn.x - ctn.width / 2 + vw / 2;

      const scale = Math.min(vw / width, vh / height) - 0.05;
      setContainerStyle((s) => {
        // Lock height
        return {
          ...s,
          height: height + "px",
        };
      });
      setImgStyle((s) => {
        return {
          ...s,
          transform: `translateX(${transX}px) translateY(${transY}px) scale(${scale})`,
          cursor: "zoom-out",
        };
      });
    } else {
      console.error("[Error] img nothing happened, ref not inited");
    }
    setisModal(!isModal);
  }, [isModal, isLoading, isError, vh, vw]);

  // Keep the real image in prerendered HTML so fetching and painting do not wait for JS.
  return (
    <div
      ref={containerRef}
      className="relative my-6"
      style={{
        ...containerStyle,
      }}
    >
      {isError && (
        <button
          type="button"
          className="w-full cursor-pointer"
          aria-label={t("ui.imageRetry")}
          onClick={() => {
            setisLoading(true);
            setisError(false);
            setAttempt((value) => value + 1);
          }}
        >
          <SkeletonError
            height="100px"
            width="100%"
            text={t("ui.imageRetry")}
          />
        </button>
      )}
      {/* Mask */}
      {isModal ? (
        <div
          className="fixed inset-0 z-20 cursor-zoom-out backdrop-blur"
          onClick={handleClick}
        />
      ) : null}
      <img
        {...props}
        key={attempt}
        ref={imgRef}
        loading={attempt > 0 ? "eager" : (props.loading ?? "lazy")}
        decoding={props.decoding ?? "async"}
        onLoad={(event) => {
          handleImageLoaded();
          props.onLoad?.(event);
        }}
        onError={(event) => {
          handleImageError();
          props.onError?.(event);
        }}
        onClick={handleClick}
        style={{
          ...props.style,
          ...imgStyle,
          display: isError ? "none" : undefined,
          minHeight: isLoading ? "100px" : undefined,
          cursor: isModal ? "zoom-out" : "zoom-in",
          position: "relative",
          transition: "transform .3s ease",
          zIndex: isModal ? 21 : "auto",
        }}
      />
    </div>
  );
}
