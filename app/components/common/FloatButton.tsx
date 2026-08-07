import type { LucideIcon } from "lucide-react";

type FloatButtonProps = {
  Icon: LucideIcon;
  onClick: (e: React.MouseEvent) => void;
  /** 可选文字，跟在图标右侧；给了之后按钮由方形变为自适应宽度的胶囊 */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function FloatButton({
  Icon,
  onClick,
  label,
  className = "",
  style,
}: FloatButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`text-text-gray-2 bg-tag-bg hover:text-text-primary active:bg-accent-hover active:text-text-primary fixed right-4 bottom-8 z-5 flex h-10 cursor-pointer items-center justify-center gap-1 rounded-[0.625rem] border-0 text-xl backdrop-blur-sm transition-colors ${label ? "px-3" : "w-10"} ${className} `}
      style={style}
    >
      <Icon size="1em" />
      {label && (
        <span className="text-sm tabular-nums">{label}</span>
      )}
    </button>
  );
}

export default FloatButton;
