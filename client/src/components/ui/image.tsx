import * as React from "react";
import { cn } from "@/lib/utils";

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  width?: number;
  height?: number;
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ className, src, alt, width, height, ...props }, ref) => {
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn("object-contain", className)}
        {...props}
      />
    );
  }
);

Image.displayName = "Image";

export { Image };
