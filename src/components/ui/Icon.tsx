interface IconProps {
  name: string;
  size?: number;
  fill?: 0 | 1;
  weight?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 24, fill = 0, weight = 400, className = '', style }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined${className ? ` ${className}` : ''}`}
      style={{
        fontSize: size,
        fontVariationSettings: `"FILL" ${fill}, "wght" ${weight}, "GRAD" 0, "opsz" 24`,
        lineHeight: 1,
        ...style,
      }}
    >
      {name}
    </span>
  );
}
