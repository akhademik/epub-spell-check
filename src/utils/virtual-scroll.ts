import { ErrorGroup } from '../types/errors';

/**
 * Simple virtual scroll implementation for error list
 */
export class SimpleVirtualScroll {
    private container: HTMLElement;
    private items: ErrorGroup[];
    private rowHeight: number;
    private renderRow: (group: ErrorGroup) => HTMLElement;
    private visibleStart = 0;
    private visibleEnd = 0;
    private contentWrapper!: HTMLDivElement;
    private viewport!: HTMLDivElement;

    constructor(
        container: HTMLElement,
        items: ErrorGroup[],
        rowHeight: number,
        renderRow: (group: ErrorGroup) => HTMLElement
    ) {
        this.container = container;
        this.items = items;
        this.rowHeight = rowHeight;
        this.renderRow = renderRow;

        this.setup();
        this.render();
    }

    private setup() {
        // Create viewport
        this.viewport = document.createElement('div');
        this.viewport.style.cssText = `
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
    `;

        // Create content wrapper with full height
        this.contentWrapper = document.createElement('div');
        this.contentWrapper.style.cssText = `
      position: relative;
      height: ${this.items.length * this.rowHeight}px;
    `;

        this.viewport.appendChild(this.contentWrapper);
        this.container.appendChild(this.viewport);

        // Add scroll listener
        this.viewport.addEventListener('scroll', () => this.handleScroll());
    }

    private handleScroll() {
        requestAnimationFrame(() => this.render());
    }

    private render() {
        const scrollTop = this.viewport.scrollTop;
        const containerHeight = this.container.clientHeight;

        // Calculate visible range with buffer
        const buffer = 15;
        this.visibleStart = Math.max(0, Math.floor(scrollTop / this.rowHeight) - buffer);
        this.visibleEnd = Math.min(
            this.items.length,
            Math.ceil((scrollTop + containerHeight) / this.rowHeight) + buffer
        );

        // Clear and render visible items
        // A document fragment can be used to improve performance
        const fragment = document.createDocumentFragment();
        for (let i = this.visibleStart; i < this.visibleEnd; i++) {
            const item = this.renderRow(this.items[i]);
            item.style.position = 'absolute';
            item.style.top = `${i * this.rowHeight}px`;
            item.style.left = '0';
            item.style.right = '0';
            fragment.appendChild(item);
        }
        this.contentWrapper.innerHTML = '';
        this.contentWrapper.appendChild(fragment);
    }

    public updateItems(newItems: ErrorGroup[]) {
        this.items = newItems;
        this.contentWrapper.style.height = `${this.items.length * this.rowHeight}px`;
        this.render();
    }


    public scrollToIndex(index: number, behavior: 'auto' | 'smooth' = 'auto') {
        const viewportHeight = this.viewport.clientHeight;
        const newScrollTop = (index * this.rowHeight) - (viewportHeight / 2) + (this.rowHeight / 2);
        const maxScrollTop = (this.items.length * this.rowHeight) - viewportHeight;
        const clampedScrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop));

        this.viewport.scrollTo({ top: clampedScrollTop, behavior });
    }

    destroy() {
        this.viewport.removeEventListener('scroll', () => this.handleScroll());
        this.container.innerHTML = '';
    }
}
