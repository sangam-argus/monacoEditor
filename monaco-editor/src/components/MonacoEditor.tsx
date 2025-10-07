import * as monaco from 'monaco-editor';
import { useRef, useEffect, useState, useId } from 'react';
import { loadVirtualFilesAndCreateModels } from './monacoEditorSetup';

interface MonacoEditorProps {
  filePath: string;           // file path for model
  originalValue?: string;     // content from DB
  modifiedValue?: string;     // content user edits
  language?: string;
  theme?: string;
  readOnly?: boolean;
  onDiffChange?: (diff: any) => void; // optional callback to send diff to backend
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  filePath,
  originalValue = '',
  modifiedValue = '',
  language = 'typescript',
  theme = 'vs-dark',
  readOnly = false,
  onDiffChange
}) => {
  const id = useRef(useId());
  const editorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
  const [originalModel, setOriginalModel] = useState<monaco.editor.ITextModel | null>(null);
  const [modifiedModel, setModifiedModel] = useState<monaco.editor.ITextModel | null>(null);
  const debounceTimer = useRef<number| null>(null);

  useEffect(() => {
    loadVirtualFilesAndCreateModels().then(() => {
      const originalUri = monaco.Uri.parse(`file:///${filePath}-original`);
      const modifiedUri = monaco.Uri.parse(`file:///${filePath}-modified`);

      let origModel = monaco.editor.getModel(originalUri);
      if (!origModel) {
        origModel = monaco.editor.createModel(originalValue, language, originalUri);
      }

      let modModel = monaco.editor.getModel(modifiedUri);
      if (!modModel) {
        modModel = monaco.editor.createModel(modifiedValue, language, modifiedUri);
      }

      setOriginalModel(origModel);
      setModifiedModel(modModel);
    });

    return () => {
      editorRef.current?.dispose();
      if (originalModel && !originalModel.isAttachedToEditor()) originalModel.dispose();
      if (modifiedModel && !modifiedModel.isAttachedToEditor()) modifiedModel.dispose();
    };
  }, []);

  useEffect(() => {
    if (originalModel && modifiedModel) {
      const container = document.getElementById(id.current);
      if (container) {
        container.style.height="60vh"
        container.style.width="50vw"

        editorRef.current = monaco.editor.createDiffEditor(container, {
          renderSideBySide: true,
          theme,
          readOnly,
          automaticLayout: true,
          fontSize: 14
        });

        editorRef.current.setModel({
          original: originalModel,
          modified: modifiedModel
        });

        // Detect changes in modified model and compute diff
        modifiedModel.onDidChangeContent(() => {
          if (debounceTimer.current) clearTimeout(debounceTimer.current);
          debounceTimer.current = setTimeout(() => {
            // const diff = monaco.editor.computeDiff(originalModel, modifiedModel, { ignoreTrimWhitespace: false });
            const lineChange=editorRef.current?.getLineChanges()||[];
            // Prepare structured diff
            
            const diffPayload = lineChange.map(c => ({
              originalStartLineNumber: c.originalStartLineNumber,
              originalEndLineNumber: c.originalEndLineNumber,
              modifiedStartLineNumber: c.modifiedStartLineNumber,
              modifiedEndLineNumber: c.modifiedEndLineNumber,
              charChanges:c.charChanges
              
            }));
            console.log(diffPayload)
            // Optional callback to send diff to backend
            onDiffChange?.(diffPayload);
          }, 800);
        });
      }
    }
  }, [originalModel, modifiedModel]);

  return <div id={id.current} className="h-full w-full border" />;
};

export default MonacoEditor;