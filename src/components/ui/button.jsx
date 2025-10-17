import { forwardRef } from "react";

function combineClasses(base, extra) {
  return extra ? `${base} ${extra}` : base;
}

export const Button = forwardRef(function Button(
  { className = "", children, ...props },
  ref
) {
  return (
    <button ref={ref} className={combineClasses("button", className)} {...props}>
      {children}
    </button>
  );
});
