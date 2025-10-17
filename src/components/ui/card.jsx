function combineClasses(base, extra) {
  return extra ? `${base} ${extra}` : base;
}

export function Card({ className = "", children }) {
  return <div className={combineClasses("card", className)}>{children}</div>;
}

export function CardContent({ className = "", children }) {
  return (
    <div className={combineClasses("card-content", className)}>{children}</div>
  );
}
