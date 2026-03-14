// noinspection CssInvalidHtmlTagReference

import { addTableButton } from './trix/TrixTableToolbar.js';

/**
 * Adds custom buttons and features to every Trix toolbar found on the page.
 *
 * Buttons added:
 *  - H2 / H3 headings      → custom trix-attribute (registered in trixEditorConfig)
 *  - Underline             → custom trix-attribute
 *  - Text color picker     → applies inline `color` trix-attribute
 *  - Table                 → inserts an HTML table via Trix Attachment
 */
const configureCustomTrixToolbar = () => {
    document.querySelectorAll('trix-toolbar').forEach((toolbar) => {
        const widget       = toolbar.closest('.form-widget');
        const editor       = widget?.querySelector('trix-editor');
        const buttonRow    = toolbar.querySelector('.trix-button-row');
        const textToolsGroup = toolbar.querySelector('.trix-button-group--text-tools');

        // Safety guards
        if (!editor || !buttonRow) return;

        // Prevent double-initialization
        if (buttonRow.querySelector('.trix-button-group--custom-formats')) return;

        // ── Build custom button group (H2, H3, Underline) ────────────────────
        const customGroup = createButtonGroup('trix-button-group--custom-formats');

        customGroup.appendChild(createAttributeButton('Heading 2', 'heading2', 'trix-button--icon-heading-2'));
        customGroup.appendChild(createAttributeButton('Heading 3', 'heading3', 'trix-button--icon-heading-3'));

        // Underline goes into text-tools group if available, otherwise custom group
        const underlineTarget = textToolsGroup ?? customGroup;
        underlineTarget.appendChild(createAttributeButton('Souligné', 'underline', 'trix-button--icon-underline'));

        // Insert custom group before the spacer
        const spacer = buttonRow.querySelector('.trix-button-group-spacer') ?? buttonRow.firstElementChild;
        spacer.before(customGroup);

        // ── Table button in its own group ─────────────────────────────────────
        const tableGroup = createButtonGroup('trix-button-group--table');
        addTableButton(tableGroup, editor);
        spacer.before(tableGroup);

        // ── Color picker ──────────────────────────────────────────────────────
        addColorPicker(textToolsGroup ?? customGroup, editor);
        wireColorPickerToSelection(textToolsGroup ?? customGroup, editor);
    });
};

// ─── Button factory helpers ───────────────────────────────────────────────────

/**
 * Creates a new trix-button-group <span>.
 *
 * @param {string} className
 * @returns {HTMLSpanElement}
 */
const createButtonGroup = (className) => {
    const group = document.createElement('span');
    group.classList.add('trix-button-group', className);
    return group;
};

/**
 * Creates a Trix toolbar button that toggles a trix-attribute.
 *
 * @param {string} label         - Accessible label / fallback text
 * @param {string} attributeName - The Trix attribute name to toggle
 * @param {string} iconClass     - CSS class that provides the ::before icon
 * @returns {HTMLButtonElement}
 */
const createAttributeButton = (label, attributeName, iconClass) => {
    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.setAttribute('data-trix-attribute', attributeName);
    button.setAttribute('title', label);
    button.classList.add('trix-button', 'trix-button--icon', iconClass);
    button.textContent = label;
    return button;
};

// ─── Color picker ─────────────────────────────────────────────────────────────

/**
 * Adds the color picker button + clear button to the given group.
 *
 * @param {HTMLElement}  group
 * @param {HTMLElement}  trixEditorEl - The <trix-editor> element
 */
const addColorPicker = (group, trixEditorEl) => {
    const trixApi = trixEditorEl.editor;

    // ── Color picker button ───────────────────────────────────────────────────
    const pickerBtn = document.createElement('button');
    pickerBtn.type      = 'button';
    pickerBtn.className = 'trix-button trix-color-picker-btn';
    pickerBtn.title     = 'Couleur du texte';
    pickerBtn.tabIndex  = -1;
    pickerBtn.style.cssText = `
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0 6px;
    `;
    pickerBtn.innerHTML = `
        <span class="trix-color-icon" style="display:flex; flex-direction:column; align-items:center; line-height:1; font-weight:bold; font-size:13px; font-family:serif;">
            A
            <span class="trix-color-bar" style="display:block; height:3px; width:14px; background:#e74c3c; border-radius:1px; margin-top:1px;"></span>
        </span>
        <input type="color" value="#e74c3c" class="trix-color-input" style="opacity: 0; position: absolute; left: 0; top: 0; width: 100%; height: 100%; cursor: pointer;">
    `;
    group.appendChild(pickerBtn);

    // ── Clear color button ────────────────────────────────────────────────────
    const clearBtn = document.createElement('button');
    clearBtn.type       = 'button';
    clearBtn.className  = 'trix-button trix-clear-color-btn';
    clearBtn.title      = 'Effacer la couleur';
    clearBtn.tabIndex   = -1;
    clearBtn.style.cssText = `cursor: pointer; padding: 0 6px; display: inline-flex; align-items: center; justify-content: center; opacity: 0.4`;
    clearBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    `;
    group.appendChild(clearBtn);

    // ── Event wiring ──────────────────────────────────────────────────────────
    const colorInput = pickerBtn.querySelector('.trix-color-input');
    const colorBar   = pickerBtn.querySelector('.trix-color-bar');

    colorInput?.addEventListener('input', (e) => {
        const color = e.target.value;
        colorBar.style.background = color;
        trixApi.activateAttribute('color', color);
    });

    clearBtn.addEventListener('click', () => {
        if (!trixEditorEl.editor.composition.currentAttributes.color) return;
        trixApi.deactivateAttribute('color');
        colorBar.style.background = '#e74c3c';
        colorInput.value = '#e74c3c';
    });
};

/**
 * Keeps the color picker indicator in sync with the current selection color.
 *
 * @param {HTMLElement} group
 * @param {HTMLElement} trixEditorEl
 */
const wireColorPickerToSelection = (group, trixEditorEl) => {
    trixEditorEl.addEventListener('trix-selection-change', () => {
        const clearBtn = group.querySelector('.trix-clear-color-btn');
        const colorBar = group.querySelector('.trix-color-bar');
        if (!clearBtn || !colorBar) return;

        const colorInput = group.querySelector('.trix-color-input');

        const color = trixEditorEl.editor.composition.currentAttributes.color;
        if (!color) {
            colorBar.style.background = '#e74c3c';
            colorInput.value = '#e74c3c';
            clearBtn.style.opacity = '0.4';
            return;
        }
        colorBar.style.background = color;
        clearBtn.style.opacity    = '1';
    });
};

export default configureCustomTrixToolbar;
