import * as monaco from 'monaco-editor';
import { useRef, useEffect, useId } from 'react';
import { loadVirtualFilesAndCreateModels } from './monacoEditorSetup';

interface MonacoEditorProps {
  filePath: string;
  originalValue?: string;
  modifiedValue?: string;
  language?: string;
  theme?: string;
  readOnly?: boolean;
  onDiffChange?: (diff: any) => void;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  filePath,
  originalValue = '',
  modifiedValue = '',
  language = 'typescript',
  theme = 'vs-dark',
  readOnly = false,
  onDiffChange,
}) => {
  const id = useRef(useId());
  const editorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
  const originalModelRef = useRef<monaco.editor.ITextModel | null>(null);
  const modifiedModelRef = useRef<monaco.editor.ITextModel | null>(null);

  useEffect(() => {
    loadVirtualFilesAndCreateModels().then(() => {
      const originalUri = monaco.Uri.parse(`file:///${filePath}-original`);
      const modifiedUri = monaco.Uri.parse(`file:///${filePath}-modified`);

      // Create or reuse models
      originalModelRef.current = monaco.editor.getModel(originalUri) || monaco.editor.createModel(originalValue, language, originalUri);
      modifiedModelRef.current = monaco.editor.getModel(modifiedUri) || monaco.editor.createModel(modifiedValue, language, modifiedUri);

      const container = document.getElementById(id.current);
      if (container) {
        container.style.height = "100vh";
        container.style.width = "100vw";

        editorRef.current = monaco.editor.createDiffEditor(container, {
          renderSideBySide: false, // Inline view
          theme,
          fontSize: 14,
          readOnly,
        });

        editorRef.current.setModel({
          original: originalModelRef.current,
          modified: modifiedModelRef.current,
        });

        // Log line changes (optional)
        const lineChanges = editorRef.current.getLineChanges();
        console.log("Line level diff:", lineChanges);
        onDiffChange?.(lineChanges);
      }
    });

    return () => {
      editorRef.current?.dispose();
      if (originalModelRef.current && !originalModelRef.current.isAttachedToEditor()) {
        originalModelRef.current.dispose();
      }
      if (modifiedModelRef.current && !modifiedModelRef.current.isAttachedToEditor()) {
        modifiedModelRef.current.dispose();
      }
    };
  }, []);

  return <div id={id.current} className="h-full w-full border" />;
};

export default MonacoEditor;
