const STYLES = {
  GREEN: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  AMBER: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  RED: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
};

export default function TrafficLightBadge({ rating, large = false }) {
  if (!rating) {
    return <span className={`badge badge-muted ${large ? 'badge-lg' : ''}`}>N/A</span>;
  }

  const style = STYLES[rating] ?? STYLES.GREEN;

  return (
    <span
      className={`badge ${large ? 'badge-lg' : ''}`}
      style={{
        background: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
    >
      {rating}
    </span>
  );
}
