// Block Editor System using Tiptap
// SOLID: Single responsibility - each block type has one purpose
// ATOMIC: Small, composable block components
// YAGNI: Only implement what's needed now
// Don't Reinvent: Use Tiptap for rich text editing

import { Editor } from './node_modules/@tiptap/core/dist/index.js'
import StarterKit from './node_modules/@tiptap/starter-kit/dist/index.js'
import Placeholder from './node_modules/@tiptap/extension-placeholder/dist/index.js'

// SOLID: Single responsibility block system
class BlockSystem {
    constructor(container) {
        this.blocks = [];
        this.editors = new Map();
        this.container = container || document.getElementById('middle-blocks');
    }

    // ATOMIC: Create single block
    createBlock(type = 'text', content = '', placeholder = '') {
        const blockId = `block-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        
        const blockElement = document.createElement('div');
        blockElement.className = 'block';
        blockElement.innerHTML = `
            <div class="block-actions">
                <button onclick="App.removeBlock('${blockId}')">×</button>
            </div>
            <div class="block-type">${type}</div>
            <div class="block-content">
                <div class="block-editor" id="${blockId}"></div>
            </div>
        `;

        this.container.appendChild(blockElement);

        // Don't Reinvent: Use Tiptap's proven editor
        const editor = new Editor({
            element: document.getElementById(blockId),
            extensions: [
                StarterKit,
                Placeholder.configure({
                    placeholder: placeholder || `Start typing in this ${type} block...`
                })
            ],
            content: content,
            editorProps: {
                attributes: {
                    class: 'ProseMirror'
                }
            }
        });

        const block = { id: blockId, type, element: blockElement, editor };
        this.blocks.push(block);
        this.editors.set(blockId, editor);

        // Focus new block
        setTimeout(() => editor.commands.focus(), 100);
        
        return block;
    }

    // YAGNI: Simple removal
    removeBlock(blockId) {
        const editor = this.editors.get(blockId);
        if (editor) {
            editor.destroy();
            this.editors.delete(blockId);
        }

        this.blocks = this.blocks.filter(block => {
            if (block.id === blockId) {
                block.element.remove();
                return false;
            }
            return true;
        });
    }

    // ATOMIC: Get minimal block data
    getBlocks() {
        return this.blocks.map(block => ({
            id: block.id,
            type: block.type,
            content: block.editor ? block.editor.getHTML() : ''
        }));
    }
}

// SOLID: Factory pattern for different block types
class BlockFactory {
    static createTextBlock(editor, content = '') {
        return editor.createBlock('text', content, 'Start writing...');
    }

    static createHeadingBlock(editor, content = '') {
        return editor.createBlock('heading', content, 'Enter heading...');
    }

    static createQuoteBlock(editor, content = '') {
        return editor.createBlock('quote', content, 'Enter quote...');
    }

    static createListBlock(editor, content = '') {
        return editor.createBlock('list', content, 'Create a list...');
    }
}

// Export for global use
window.BlockSystem = BlockSystem;
window.BlockFactory = BlockFactory;