import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Table = ({ columns, data, page, pages, onPageChange, renderRow }) => {
  return (
    <div className="table-container">
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
