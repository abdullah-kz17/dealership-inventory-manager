export function Card({ className = '', ...props }) {
  return <div className={`rounded-lg border border-border bg-card shadow-sm ${className}`} {...props} />;
}

export function CardHeader({ className = '', ...props }) {
  return <div className={`px-6 py-5 border-b border-border ${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }) {
  return <div className={`px-6 py-5 ${className}`} {...props} />;
}
