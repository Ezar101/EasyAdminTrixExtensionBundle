/**
 * TrixTableAttachment.js
 *
 * Manages the creation, serialization and deserialization of HTML tables
 * as Trix Attachments.
 *
 * Core concept (from Benoit Tremblay's approach here https://benoit.cx/how-we-built-table-support-for-trix-editor/):
 * Tables are encapsulated as Trix Attachments. Trix wraps the `content` HTML
 * inside a <figure data-trix-attachment="..."> element in the editor DOM.
 * The `content` field (our table HTML) is stored in the attachment metadata,
 * which lets us parse it back when the user wants to edit the table.
 */

/**
 * @typedef {Object} TableData
 * @property {number}   rows      - Number of rows (including header if any)
 * @property {number}   cols      - Number of columns
 * @property {boolean}  hasHeader - Whether the first row is a <thead> header
 * @property {string[][]} cells   - cells[rowIndex][colIndex] = inner HTML content
 */

/** Unique content-type identifier for table attachments. */
export const TABLE_ATTACHMENT_TYPE = 'trix-table';

/**
 * Generates a clean HTML <table> string from structured TableData.
 *
 * @param {TableData} tableData
 * @returns {string}
 */
export const buildTableHtml = ({ rows, cols, hasHeader, cells }) => {
    const parts = ['<div class="table-responsive"><table class="trix-table table table-bordered table-hover">'];

    for (let r = 0; r < rows; r++) {
        const isHeaderRow = hasHeader && r === 0;

        if (isHeaderRow) {
            parts.push('<thead><tr>');
            for (let c = 0; c < cols; c++) {
                parts.push(`<th scope="col">${cells[r]?.[c] ?? ''}</th>`);
            }
            parts.push('</tr></thead>');
        } else {
            // Open <tbody> once, on the first body row
            if (r === (hasHeader ? 1 : 0)) parts.push('<tbody>');
            parts.push('<tr>');
            for (let c = 0; c < cols; c++) {
                parts.push(`<td>${cells[r]?.[c] ?? ''}</td>`);
            }
            parts.push('</tr>');
            // Close <tbody> on the last row
            if (r === rows - 1) parts.push('</tbody>');
        }
    }

    parts.push('</table></div>');
    return parts.join('');
};

/**
 * Creates a Trix.Attachment from table data.
 * Trix wraps the `content` HTML inside its own <figure> in the editor DOM.
 * The `content` is also stored in `data-trix-attachment` JSON, which is how
 * we retrieve it for editing.
 *
 * @param {TableData} tableData
 * @returns {Trix.Attachment}
 */
export const createTableAttachment = (tableData) => {
    const tableHtml = buildTableHtml(tableData);

    return new Trix.Attachment({
        content:     tableHtml,
        contentType: TABLE_ATTACHMENT_TYPE,
    });
};

/**
 * Parses an HTML table string back into a TableData object.
 * Used when editing an existing table attachment.
 *
 * @param {string} html - HTML content from data-trix-attachment.content
 * @returns {TableData|null}
 */
export const parseTableHtml = (html) => {
    if (!html) return null;

    const parser = new DOMParser();
    const doc    = parser.parseFromString(html, 'text/html');
    const table  = doc.querySelector('table');
    if (!table) return null;

    const thead     = table.querySelector('thead');
    const tbody     = table.querySelector('tbody');
    const hasHeader = !!thead;

    const cells = [];
    let rows = 0;
    let cols = 0;

    // Parse header row
    if (thead) {
        const headerRow = [];
        thead.querySelectorAll('th, td').forEach((cell) => headerRow.push(cell.innerHTML));
        cols = Math.max(cols, headerRow.length);
        cells.push(headerRow);
        rows++;
    }

    // Parse body rows (fall back to all <tr> if no explicit <tbody>)
    const bodyContainer = tbody ?? table;
    bodyContainer.querySelectorAll('tr').forEach((tr) => {
        const row = [];
        tr.querySelectorAll('th, td').forEach((cell) => row.push(cell.innerHTML));
        if (row.length > 0) {
            cols = Math.max(cols, row.length);
            cells.push(row);
            rows++;
        }
    });

    if (rows === 0 || cols === 0) return null;

    return { rows, cols, hasHeader, cells };
};
