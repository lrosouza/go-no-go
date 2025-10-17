import { forwardRef } from "react";

function combineClasses(base, extra) {
  return extra ? `${base} ${extra}` : base;
}

export const Input = forwardRef(function Input({ className = "", ...props }, ref) {
  return <input ref={ref} className={combineClasses("input", className)} {...props} />;
});
