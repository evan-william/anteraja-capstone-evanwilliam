import type { ImgHTMLAttributes } from 'react';

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
};

export default function Image({ fill, priority, quality, unoptimized, style, ...props }: Props) {
  void quality;
  void unoptimized;
  return <img {...props} loading={priority ? 'eager' : 'lazy'} decoding="async" style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style } : style} />;
}
