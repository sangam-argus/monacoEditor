import * as monaco from 'monaco-editor';
import { useRef, useEffect, useState, useId } from 'react';
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
//   onDiffChange
}) => {
  const id = useRef(useId());
  const editorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
  const [originalModel, setOriginalModel] = useState<monaco.editor.ITextModel | null>(null);
  const [modifiedModel, setModifiedModel] = useState<monaco.editor.ITextModel | null>(null);
//   const debounceTimer = useRef<number| null>(null);

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
        container.style.height="100vh"
        container.style.width="100vw"

        editorRef.current = monaco.editor.createDiffEditor(container, {
          enableSplitViewResizing:true,
          renderSideBySide: true,
          theme,
          readOnly,
          automaticLayout: true,
          fontSize: 14,
          originalEditable:true,
          renderIndicators:true,
          useInlineViewWhenSpaceIsLimited:true
        });
        

        editorRef.current.setModel({
          original: originalModel,
          modified: modifiedModel
        });
        const linechanges=editorRef.current?.getLineChanges();
            console.log("Line level diff",linechanges)
      }
    }
  }, [originalModel, modifiedModel]);

  return <div id={id.current} className="h-full w-full border" />;
};

export default MonacoEditor;