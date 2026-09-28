export class GridControlPanel {
    constructor({ rows = 3, cols = 3, collapsed = false } = {}) {
        this._rows = rows;
        this._cols = cols;
        this._collapsed = collapsed; // <-- was missing
        this._cells = new Map();
    }

    onAdd(map) {
        this._map = map;

        this._container = document.createElement('div');
        this._container.className = 'grid-control-panel maplibregl-ctrl';
        // Inline style wins over MapLibre's stylesheet rule automatically
        //this._container.style.marginTop = 'calc(env(safe-area-inset-top, 0px) + 12px)';

        this._toggle = document.createElement('button');
        this._toggle.className = 'grid-control-toggle';
        this._toggle.textContent = '⋮';
        this._toggle.onclick = () => this.toggleCollapse();
        this._container.appendChild(this._toggle);

        this._grid = document.createElement('div');
        this._grid.className = 'grid-control-grid';
        this._grid.style.display = this._collapsed ? 'none' : 'grid';
        this._grid.style.gridTemplateRows = `repeat(${this._rows}, auto)`;
        this._grid.style.gridTemplateColumns = `repeat(${this._cols}, auto)`;
        this._grid.style.gap = '4px';
        this._container.appendChild(this._grid);

        return this._container;
    }

    onRemove() {
        this._container.parentNode?.removeChild(this._container);
        this._map = undefined;
    }

    toggleCollapse() {
        const isHidden = this._grid.style.display === 'none';
        this._grid.style.display = isHidden ? 'grid' : 'none';
    }

    // Place a MapLibre-style control (must implement onAdd(map) -> HTMLElement)
    // at a given row/col in the grid.
    addControlAt(control, row, col) {
        if (row < 1 || row > this._rows || col < 1 || col > this._cols) {
            throw new Error(`Position ${row},${col} is outside the ${this._rows}x${this._cols} grid`);
        }

        const key = `${row}-${col}`;
        if (this._cells.has(key)) {
            throw new Error(`Cell ${key} is already occupied`);
        }

        const el = control.onAdd(this._map);
        el.style.gridRow = row;
        el.style.gridColumn = col;

        this._grid.appendChild(el);
        this._cells.set(key, { control, el });

        return el;
    }

    removeControlAt(row, col) {
        const key = `${row}-${col}`;
        const entry = this._cells.get(key);
        if (!entry) return;

        entry.control.onRemove?.();
        this._cells.delete(key);
    }
}