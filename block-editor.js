// Block Editor System using Tiptap
// SOLID: Single responsibility - each block type has one purpose
// ATOMIC: Small, composable block components
// YAGNI: Only implement what's needed now
// Don't Reinvent: Use Tiptap for rich text editing

import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

class BlockEditor {
    constructor(container) {
        this.container = container;
        this.blocks = [];
        this.editors = new Map();
    }

    // SOLID: Single responsibility - create one block type
    createBlock(type, content = '', placeholder = '') {
        const blockId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const block = {
            id: blockId,
            type: type,
            content: content,
            element: this.createElement(blockId, type, placeholder)
        };

        this.blocks.push(block);
        this.container.appendChild(block.element);
        
        // ATOMIC: Each block gets its own editor instance
        this.initializeEditor(block, placeholder);
        
        return block;
    }

    // Don't Reinvent: Use Tiptap's proven editor
    initializeEditor(block, placeholder) {
        const editorElement = block.element.querySelector('.block-editor');
        
        const editor = new Editor({
            element: editorElement,
            extensions: [
                StarterKit,
                Placeholder.configure({
                    placeholder: placeholder || `Type something in this ${block.type} block...`,
                })
            ],
            content: block.content,
            onUpdate: ({ editor }) => {
                // SOLID: Separation of concerns - content management
                block.content = editor.getHTML();
                this.onBlockChange(block);
            }
        });

        this.editors.set(block.id, editor);
    }

    // ATOMIC: Minimal element creation
    createElement(blockId, type, placeholder) {
        const element = document.createElement('div');
        element.className = 'block';
        element.innerHTML = `
            <div class="block-type">${type}</div>
            <div class="block-content">
                <div class="block-editor" id="${blockId}"></div>
            </div>
            <div class="block-actions">
                <button onclick="blockSystem.removeBlock('${blockId}')">×</button>
            </div>
        `;
        return element;
    }

    // YAGNI: Simple block removal for now
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

    // SOLID: Single responsibility - handle content changes
    onBlockChange(block) {
        // Extensible: Can add auto-save, validation, etc.
        console.log(`Block ${block.id} (${block.type}) updated:`, block.content);
    }

    // ATOMIC: Get minimal block data
    getBlocks() {
        return this.blocks.map(block => ({
            id: block.id,
            type: block.type,
            content: block.content
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
window.BlockEditor = BlockEditor;
window.BlockFactory = BlockFactory;