import './Pagination.css';

/**
 * Reusable Pagination component.
 * Props:
 *   currentPage  {number}  - current active page (1-indexed)
 *   totalPages   {number}  - total number of pages from the API
 *   onPageChange {fn}      - callback called with the new page number
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  const delta = 2; // how many pages to show around current

  // Always show first page
  pages.push(1);

  // Ellipsis after 1 if gap exists
  if (currentPage - delta > 2) pages.push('...');

  // Pages around current
  for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
    pages.push(i);
  }

  // Ellipsis before last if gap exists
  if (currentPage + delta < totalPages - 1) pages.push('...');

  // Always show last page
  if (totalPages > 1) pages.push(totalPages);

  return (
    <div className="pagination">
      <button
        className="pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        ‹
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`pagination-btn ${p === currentPage ? 'pagination-btn--active' : ''}`}
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        className="pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        ›
      </button>
    </div>
  );
};

export default Pagination;
