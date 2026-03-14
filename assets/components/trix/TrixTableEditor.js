/**
 * TrixTableEditor.js
 *
 * A modal-based table editor for Trix.
 * Each cell uses a contenteditable div with a shared mini formatting toolbar
 * (bold, italic, underline, strikethrough, link).
 */

const DEFAULT_ROWS = 3;
const DEFAULT_COLS = 3;

/**
 * Mini formatting toolbar actions using document.execCommand
 * (still the standard for contenteditable rich-text editing).
 */
const FORMAT_ACTIONS = [
    { command: 'bold',          title: 'Gras',            icon: '<strong>G</strong>' },
    { command: 'italic',        title: 'Italique',        icon: '<em>I</em>' },
    { command: 'underline',     title: 'Souligner',       icon: '<span style="text-decoration:underline">S</span>' },
    { command: 'strikeThrough', title: 'Barrer',          icon: '<span style="text-decoration:line-through">B</span>' },
];

export class TrixTableEditor {
    constructor() {
        this._modal        = null;
        this._grid         = null;
        this._toolbar      = null;
        this._onInsert     = null;
        this._tableData    = null;
        this._activeCellEl = null;
        this._headerCheckbox = null;

        this._buildModal();
        this._bindGlobalEvents();
    }

    // ─── Public API ────────────────────────────────────────────────────────────

    /**
     * Open the modal editor.
     *
     * @param {import('./TrixTableAttachment.js').TableData|null} tableData - Existing table to edit, or null for new
     * @param {(data: import('./TrixTableAttachment.js').TableData) => void} onInsert - Callback when user confirms
     */
    open(tableData, onInsert) {
        this._onInsert  = onInsert;
        // Always set fresh table data - do NOT read from DOM here (that's _collectCellData's job)
        this._tableData = tableData ?? this._makeEmptyTable(DEFAULT_ROWS, DEFAULT_COLS);
        this._renderGrid();
        this._modal.classList.add('trix-table-editor-modal--open');

        // Focus first cell after DOM settles
        requestAnimationFrame(() => {
            const firstCell = this._grid.querySelector('.trix-table-editor__cell');
            firstCell?.focus();
        });
    }

    /** Close the modal without saving. */
    close() {
        this._modal.classList.remove('trix-table-editor-modal--open');
        this._activeCellEl = null;
    }

    // ─── Modal DOM Build ───────────────────────────────────────────────────────

    _buildModal() {
        const backdrop = document.createElement('div');
        backdrop.className = 'trix-table-editor-backdrop';
        backdrop.addEventListener('click', () => this.close());

        const panel = document.createElement('div');
        panel.className = 'trix-table-editor-panel';
        panel.addEventListener('click', (e) => e.stopPropagation());

        const header = this._buildHeader();
        this._toolbar = this._buildFormattingToolbar();
        const controls = this._buildTableControls();

        this._grid = document.createElement('div');
        this._grid.className = 'trix-table-editor-grid-wrapper';

        const footer = this._buildFooter();

        panel.append(header, this._toolbar, controls, this._grid, footer);

        this._modal = document.createElement('div');
        this._modal.className = 'trix-table-editor-modal';
        this._modal.append(backdrop, panel);

        document.body.appendChild(this._modal);
    }

    _buildHeader() {
        const header = document.createElement('div');
        header.className = 'trix-table-editor-header';
        header.innerHTML = `
            <h3 class="trix-table-editor-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
                    <line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
                </svg>
                Éditeur de tableau
            </h3>
            <button type="button" class="trix-table-editor-close" title="Fermer" aria-label="Fermer">×</button>
        `;
        header.querySelector('.trix-table-editor-close').addEventListener('click', () => this.close());
        return header;
    }

    _buildFormattingToolbar() {
        const bar = document.createElement('div');
        bar.className = 'trix-table-editor-format-bar';

        FORMAT_ACTIONS.forEach(({ command, title, icon }) => {
            const btn = document.createElement('button');
            btn.type      = 'button';
            btn.title     = title;
            btn.innerHTML = icon;
            btn.className = 'trix-table-editor-format-btn';
            btn.dataset.command = command;
            // mousedown: prevent blur from the active cell so execCommand works
            btn.addEventListener('mousedown', (e) => e.preventDefault());
            btn.addEventListener('click', () => {
                document.execCommand(command, false, null);
                this._updateToolbarState();
            });
            bar.appendChild(btn);
        });

        const sep = document.createElement('span');
        sep.className = 'trix-table-editor-format-sep';
        bar.appendChild(sep);

        // Link button
        const linkBtn = document.createElement('button');
        linkBtn.type      = 'button';
        linkBtn.title     = 'Lien';
        linkBtn.className = 'trix-table-editor-format-btn';
        linkBtn.dataset.command = 'createLink';
        linkBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
        `;
        linkBtn.addEventListener('mousedown', (e) => e.preventDefault());
        linkBtn.addEventListener('click', () => {
            const url = prompt('URL du lien :', 'https://');
            if (url) document.execCommand('createLink', false, url);
        });
        bar.appendChild(linkBtn);

        // Unlink button
        const unlinkBtn = document.createElement('button');
        unlinkBtn.type      = 'button';
        unlinkBtn.title     = 'Supprimer le lien';
        unlinkBtn.className = 'trix-table-editor-format-btn';
        unlinkBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                <line x1="2" y1="2" x2="22" y2="22"/>
            </svg>
        `;
        unlinkBtn.addEventListener('mousedown', (e) => e.preventDefault());
        unlinkBtn.addEventListener('click', () => document.execCommand('unlink', false, null));
        bar.appendChild(unlinkBtn);

        return bar;
    }

    _buildTableControls() {
        const controls = document.createElement('div');
        controls.className = 'trix-table-editor-controls';

        const makeBtn = (label, icon, onClick) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'trix-table-editor-ctrl-btn';
            btn.title = label;
            btn.innerHTML = `${icon}<span>${label}</span>`;
            btn.addEventListener('click', onClick);
            return btn;
        };

        controls.append(
            makeBtn('Ajouter ligne',     this._icon('row-add'),    () => this._addRow()),
            makeBtn('Supprimer ligne',   this._icon('row-remove'), () => this._removeRow()),
            makeBtn('Ajouter colonne',   this._icon('col-add'),    () => this._addCol()),
            makeBtn('Supprimer colonne', this._icon('col-remove'), () => this._removeCol()),
        );

        const headerToggle = document.createElement('label');
        headerToggle.className = 'trix-table-editor-toggle';
        headerToggle.innerHTML = `
            <input type="checkbox" class="trix-table-editor-toggle__input" id="trix-table-header-toggle">
            <span class="trix-table-editor-toggle__label">Ligne d'en-tête</span>
        `;
        this._headerCheckbox = headerToggle.querySelector('input');
        this._headerCheckbox.addEventListener('change', () => {
            this._tableData.hasHeader = this._headerCheckbox.checked;
            // Collect current cell content before re-rendering structure
            this._collectCellData();
            this._renderGrid();
        });

        controls.appendChild(headerToggle);
        return controls;
    }

    _buildFooter() {
        const footer = document.createElement('div');
        footer.className = 'trix-table-editor-footer';

        const cancelBtn = document.createElement('button');
        cancelBtn.type      = 'button';
        cancelBtn.className = 'trix-table-editor-btn trix-table-editor-btn--secondary';
        cancelBtn.textContent = 'Annuler';
        cancelBtn.addEventListener('click', () => this.close());

        const insertBtn = document.createElement('button');
        insertBtn.type      = 'button';
        insertBtn.className = 'trix-table-editor-btn trix-table-editor-btn--primary';
        insertBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            Insérer le tableau
        `;
        insertBtn.addEventListener('click', () => this._confirmInsert());

        footer.append(cancelBtn, insertBtn);
        return footer;
    }

    // ─── Grid Rendering ────────────────────────────────────────────────────────

    /**
     * Renders the table grid from this._tableData.
     * IMPORTANT: does NOT call _collectCellData(). Callers are responsible
     * for collecting cell content before modifying this._tableData structure.
     */
    _renderGrid() {
        this._grid.innerHTML = '';
        this._headerCheckbox.checked = this._tableData.hasHeader;

        const table = document.createElement('table');
        table.className = 'trix-table-editor-table';

        let thead = null;
        let tbody = null;

        for (let r = 0; r < this._tableData.rows; r++) {
            const isHeaderRow = this._tableData.hasHeader && r === 0;
            const tr = document.createElement('tr');

            for (let c = 0; c < this._tableData.cols; c++) {
                const td = document.createElement(isHeaderRow ? 'th' : 'td');
                const cell = document.createElement('div');
                cell.className       = 'trix-table-editor__cell';
                cell.contentEditable = 'true';
                cell.dataset.row     = r;
                cell.dataset.col     = c;
                // Restore saved cell content
                cell.innerHTML = this._tableData.cells[r]?.[c] ?? '';

                cell.addEventListener('focus',   () => { this._activeCellEl = cell; this._updateToolbarState(); });
                cell.addEventListener('keyup',   () => this._updateToolbarState());
                cell.addEventListener('mouseup', () => this._updateToolbarState());

                td.appendChild(cell);
                tr.appendChild(td);
            }

            if (isHeaderRow) {
                if (!thead) { thead = document.createElement('thead'); table.appendChild(thead); }
                thead.appendChild(tr);
            } else {
                if (!tbody) { tbody = document.createElement('tbody'); table.appendChild(tbody); }
                tbody.appendChild(tr);
            }
        }

        this._grid.appendChild(table);
    }

    // ─── Table Structure Mutations ─────────────────────────────────────────────

    /** Reads current DOM cell content into this._tableData.cells */
    _collectCellData() {
        if (!this._grid) return;
        this._grid.querySelectorAll('.trix-table-editor__cell').forEach((el) => {
            const r = parseInt(el.dataset.row, 10);
            const c = parseInt(el.dataset.col, 10);
            if (!this._tableData.cells[r]) this._tableData.cells[r] = [];
            this._tableData.cells[r][c] = el.innerHTML;
        });
    }

    _addRow() {
        this._collectCellData();
        this._tableData.rows++;
        this._tableData.cells.push(new Array(this._tableData.cols).fill(''));
        this._renderGrid();
        // Focus first cell of the new row
        const cells = this._grid.querySelectorAll('.trix-table-editor__cell');
        cells[(this._tableData.rows - 1) * this._tableData.cols]?.focus();
    }

    _removeRow() {
        if (this._tableData.rows <= 1) return;
        this._collectCellData();
        this._tableData.rows--;
        this._tableData.cells.splice(this._tableData.rows, 1);
        this._renderGrid();
    }

    _addCol() {
        this._collectCellData();
        this._tableData.cols++;
        this._tableData.cells.forEach((row) => row.push(''));
        this._renderGrid();
    }

    _removeCol() {
        if (this._tableData.cols <= 1) return;
        this._collectCellData();
        this._tableData.cols--;
        this._tableData.cells.forEach((row) => row.splice(this._tableData.cols, 1));
        this._renderGrid();
    }

    // ─── Formatting Toolbar State ──────────────────────────────────────────────

    _updateToolbarState() {
        FORMAT_ACTIONS.forEach(({ command }) => {
            const btn = this._toolbar.querySelector(`[data-command="${command}"]`);
            if (btn) {
                btn.classList.toggle('trix-table-editor-format-btn--active', document.queryCommandState(command));
            }
        });
    }

    // ─── Confirm Insert ────────────────────────────────────────────────────────

    _confirmInsert() {
        this._collectCellData();
        this._onInsert?.({ ...this._tableData });
        this.close();
    }

    // ─── Global Events ─────────────────────────────────────────────────────────

    _bindGlobalEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this._modal?.classList.contains('trix-table-editor-modal--open')) {
                this.close();
            }
        });
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    _makeEmptyTable(rows, cols) {
        return {
            rows,
            cols,
            hasHeader: true,
            cells: Array.from({ length: rows }, () => new Array(cols).fill('')),
        };
    }

    _icon(type) {
        const icons = {
            'row-add':    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/></svg>`,
            'row-remove': `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="18" x2="15" y2="18"/></svg>`,
            'col-add':    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="12" x2="21" y2="12"/><line x1="18" y1="9" x2="18" y2="15"/></svg>`,
            'col-remove': `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="12" x2="21" y2="12"/></svg>`,
        };
        return icons[type] ?? '';
    }
}
