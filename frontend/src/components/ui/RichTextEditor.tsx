'use client';

import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, 
  List, ListOrdered, Link as LinkIcon, Unlink, Undo, Redo 
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL del enlace', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const buttonStyle = (isActive: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
    color: isActive ? '#8b5cf6' : 'var(--text-muted)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '4px', 
      padding: '8px', 
      borderBottom: '1px solid var(--card-border)',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: '8px 8px 0 0'
    }}>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        style={buttonStyle(editor.isActive('bold'))}
        title="Negrita"
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        style={buttonStyle(editor.isActive('italic'))}
        title="Cursiva"
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        style={buttonStyle(editor.isActive('strike'))}
        title="Tachado"
      >
        <Strikethrough size={16} />
      </button>

      <div style={{ width: '1px', background: 'var(--card-border)', margin: '0 4px' }} />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        style={buttonStyle(editor.isActive('heading', { level: 1 }))}
        title="Título 1"
      >
        <Heading1 size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        style={buttonStyle(editor.isActive('heading', { level: 2 }))}
        title="Título 2"
      >
        <Heading2 size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        style={buttonStyle(editor.isActive('heading', { level: 3 }))}
        title="Título 3"
      >
        <Heading3 size={16} />
      </button>

      <div style={{ width: '1px', background: 'var(--card-border)', margin: '0 4px' }} />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        style={buttonStyle(editor.isActive('bulletList'))}
        title="Lista de viñetas"
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        style={buttonStyle(editor.isActive('orderedList'))}
        title="Lista enumerada"
      >
        <ListOrdered size={16} />
      </button>

      <div style={{ width: '1px', background: 'var(--card-border)', margin: '0 4px' }} />

      <button
        type="button"
        onClick={setLink}
        style={buttonStyle(editor.isActive('link'))}
        title="Añadir Enlace"
      >
        <LinkIcon size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
        style={{ ...buttonStyle(false), opacity: editor.isActive('link') ? 1 : 0.4 }}
        title="Quitar Enlace"
      >
        <Unlink size={16} />
      </button>

      <div style={{ flex: 1 }} />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        style={buttonStyle(false)}
        title="Deshacer"
      >
        <Undo size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        style={buttonStyle(false)}
        title="Rehacer"
      >
        <Redo size={16} />
      </button>
    </div>
  );
};

export default function RichTextEditor({ value, onChange, placeholder, minHeight = '150px' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div style={{ 
      border: '1px solid var(--card-border)', 
      borderRadius: '8px', 
      background: 'rgba(255,255,255,0.01)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
    }} className="rich-text-editor-container focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
      <style dangerouslySetInnerHTML={{__html: `
        .ProseMirror {
          padding: 16px;
          min-height: ${minHeight};
          outline: none;
          color: var(--text-color);
          line-height: 1.6;
        }
        .ProseMirror p {
          margin-top: 0;
          margin-bottom: 1em;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: '${placeholder || 'Escribe algo increíble...'}';
          float: left;
          color: var(--text-muted);
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
          color: var(--foreground);
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          line-height: 1.2;
        }
        .ProseMirror h1 { font-size: 1.8em; }
        .ProseMirror h2 { font-size: 1.5em; }
        .ProseMirror h3 { font-size: 1.2em; }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 24px;
          margin-bottom: 1em;
        }
        .ProseMirror a {
          color: #8b5cf6;
          text-decoration: underline;
          cursor: pointer;
        }
        .rich-text-editor-container:focus-within {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
        }
        .rich-text-editor-container button:hover:not(:disabled) {
          background: rgba(139, 92, 246, 0.1) !important;
          color: #8b5cf6 !important;
        }
      `}} />
      <MenuBar editor={editor} />
      <EditorContent editor={editor} style={{ flex: 1, overflowY: 'auto' }} />
    </div>
  );
}
