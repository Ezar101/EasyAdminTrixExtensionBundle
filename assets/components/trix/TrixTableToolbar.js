/**
 * TrixTableToolbar.js
 *
 * Handles the "Insert Table" button in the Trix toolbar.
 *
 * Approach for detecting selected table attachment:
 * - We use `mousedown + e.preventDefault()` on the toolbar button so the editor
 *   KEEPS its focus and selection when the button is pressed.
 * - We track which table was last clicked in the editor via click events on the editor.
 * - We save the Trix selection range at mousedown so we can restore it after the
 *   modal is closed (for the "replace existing table" flow).
 */

import { TrixTableEditor }                                    from './TrixTableEditor.js';
import { createTableAttachment, parseTableHtml, TABLE_ATTACHMENT_TYPE } from './TrixTableAttachment.js';

/** Singleton modal shared across all editors on the page. */
let _sharedEditor = null;

const getSharedEditor = () => {
    if (!_sharedEditor) _sharedEditor = new TrixTableEditor();
    return _sharedEditor;
};

/**
 * Creates and appends the "Table" button to a Trix toolbar button group
 * and wires all the necessary event logic.
 *
 * @param {HTMLElement} buttonGroup   - The <span> toolbar group to append the button to
 * @param {HTMLElement} trixEditorEl  - The <trix-editor> element
 */
export const addTableButton = (buttonGroup, trixEditorEl) => {
    const trixApi = trixEditorEl.editor;

    // ── Toolbar button ────────────────────────────────────────────────────────
    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.setAttribute('title', 'Insérer / modifier un tableau');
    button.setAttribute('tabindex', '-1');
    button.classList.add('trix-button', 'trix-button--icon', 'trix-button--icon-table');
    button.textContent = 'Table'; // fallback text if icon doesn't load

    buttonGroup.appendChild(button);

    // ── Per-editor state ──────────────────────────────────────────────────────
    /**
     * Stores the data-trix-attachment JSON of the last clicked table figure.
     * Cleared after use (once the toolbar button is clicked or the editor is typed in).
     * @type {{ data: import('./TrixTableAttachment.js').TableData, range: [number, number] } | null}
     */
    let _pendingEdit = null;

    // ── Detect table clicks INSIDE the editor ─────────────────────────────────
    // When the user clicks on a rendered table attachment, we parse and store its data.
    trixEditorEl.addEventListener('click', (e) => {
        const figure = e.target.closest('figure[data-trix-attachment]');
        if (figure) {
            try {
                const meta = JSON.parse(figure.dataset.trixAttachment || '{}');
                if (meta.contentType === TABLE_ATTACHMENT_TYPE) {
                    // Parse table from the attachment's stored `content` field (the HTML)
                    const parsedData = parseTableHtml(meta.content ?? figure.innerHTML);
                    if (parsedData) {
                        _pendingEdit = {
                            data:  parsedData,
                            range: trixApi.getSelectedRange(),
                        };
                        button.classList.add('trix-button--active');
                        return;
                    }
                }
            } catch (err) {
                console.warn('[TrixTable] Could not parse clicked attachment:', err);
            }
        }
        // Clicked elsewhere → clear pending edit
        _pendingEdit = null;
        button.classList.remove('trix-button--active');
    });

    // Clear pending state when the user types (they moved on)
    trixEditorEl.addEventListener('trix-change', () => {
        _pendingEdit = null;
        button.classList.remove('trix-button--active');
    });

    // ── Toolbar button interactions ────────────────────────────────────────────

    // mousedown: prevent the editor from losing focus/selection.
    // This is the standard pattern for WYSIWYG toolbar buttons.
    button.addEventListener('mousedown', (e) => {
        e.preventDefault();
        // Also capture selection RIGHT NOW before anything changes
        if (!_pendingEdit) {
            // Not editing a table; just make sure we have a fresh cursor position
            _pendingEdit = null;
        }
    });

    button.addEventListener('click', () => {
        if (_pendingEdit) {
            // ── Edit mode: open modal with existing table data ─────────────────
            const { data, range } = _pendingEdit;
            _pendingEdit = null;
            button.classList.remove('trix-button--active');

            getSharedEditor().open(data, (tableData) => {
                // Restore selection to the attachment position, delete it, then insert updated table
                if (range) trixApi.setSelectedRange(range);
                trixApi.deleteInDirection('backward');
                insertTable(trixApi, tableData);
            });
        } else {
            // ── Insert mode: open fresh modal ──────────────────────────────────
            getSharedEditor().open(null, (tableData) => {
                insertTable(trixApi, tableData);
            });
        }
    });
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Inserts a new table attachment at the current Trix cursor position.
 *
 * @param {Trix.Editor} trixApi
 * @param {import('./TrixTableAttachment.js').TableData} tableData
 */
const insertTable = (trixApi, tableData) => {
    const attachment = createTableAttachment(tableData);
    trixApi.insertAttachment(attachment);
    // Insert a newline after the table so the user can continue typing below it
    trixApi.insertString('\n');
};
