import '../css/SkeletonCard.css'

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-poster">
        <div className="skeleton-shimmer"></div>
      </div>
      <div className="skeleton-info">
        <div className="skeleton-title">
          <div className="skeleton-shimmer"></div>
        </div>
        <div className="skeleton-year">
          <div className="skeleton-shimmer"></div>
        </div>
      </div>
    </div>
  )
}