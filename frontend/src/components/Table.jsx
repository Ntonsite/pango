import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Table = ({ columns, data, page, pages, onPageChange, renderRow, renderMobileCard }) => {
  return (
    <div className="table-container">
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, idx) => renderRow(row, idx))
            )}
          </tbody>
        </table>
      </div>

      {renderMobileCard && (
        <div className="mobile-card-list">
          {data.length === 0 ? (
            <div className="mobile-card-empty">No records found.</div>
          ) : (
            data.map((row, idx) => renderMobileCard(row, idx))
          )}
        </div>
      )}

      {pages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-outline"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Page {page} of {pages}
          </span>
          <button
            className="btn btn-outline"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Table;
