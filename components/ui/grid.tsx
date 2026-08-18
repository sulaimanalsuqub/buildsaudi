import { ReactNode } from "react";

type GridProps = {
  children: ReactNode;
  className?: string;
};

/** 12-column grid for asymmetric layouts (7/5, 8/4, offset columns) — use col-span-* / col-start-* on children. */
export function Grid({ children, className = "" }: GridProps) {
  return (
    <div className={`mx-auto grid w-full max-w-[1440px] grid-cols-4 gap-x-4 px-4 sm:grid-cols-8 sm:px-6 lg:grid-cols-12 lg:gap-x-6 lg:px-10 ${className}`}>
      {children}
    </div>
  );
}

/** Edge-to-edge wrapper for moments that should break out of the reading column. */
export function FullBleed({ children, className = "" }: GridProps) {
  return <div className={`w-full ${className}`}>{children}</div>;
}
