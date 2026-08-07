import { ArrowUpToLine, Menu } from 'lucide-react';
import { FloatButton } from '~/components/common/FloatButton';
import { useReadingProgress } from '~/hooks/use-reading-progress';

type Props = {
  isViewing: boolean;
  onTocToggle: () => void;
};

export function FloatButtons({ isViewing, onTocToggle }: Props) {
  const progress = useReadingProgress();

  const scrollToTop = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* TOC toggle button - only visible on mobile/tablet */}
      <FloatButton
        Icon={Menu}
        onClick={(e) => {
          e.stopPropagation();
          onTocToggle();
        }}
        className="max-lg:flex hidden"
        style={isViewing ? { bottom: '5.25rem' } : undefined}
      />

      {/* Scroll to top button，附带阅读进度百分比 */}
      {isViewing && (
        <FloatButton
          Icon={ArrowUpToLine}
          onClick={scrollToTop}
          label={`${progress}%`}
        />
      )}
    </>
  );
}