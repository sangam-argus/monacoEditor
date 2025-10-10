import * as monaco from 'monaco-editor';
import { useRef, useEffect } from 'react';
import { diff_match_patch } from 'diff-match-patch';
import './monacoEditorSetup'; // Import the Monaco setup

interface MonacoEditorProps {
  filePath: string;
  value: string;
  language?: string;
  theme?: string;
  readOnly?: boolean;
  onChange?: (value: string, patches: string) => void;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  filePath,
  value,
  language = 'typescript',
  theme = 'vs-dark',
  readOnly = false,
  onChange,
}) => {
  const id = useRef<string>(`monaco-editor-${Math.random()}`);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const modelRef = useRef<monaco.editor.ITextModel | null>(null);
  const previousValueRef = useRef<string>(value);

  useEffect(() => {
    const container = document.getElementById(id.current);
    if (!container) return;

    container.style.height = '70vh';
    container.style.width = '100%';

    const uri = monaco.Uri.parse(`file:///${filePath}`);
    let currentModel = monaco.editor.getModel(uri);

    if (!currentModel) {
      currentModel = monaco.editor.createModel(value, language, uri);
    }

    modelRef.current = currentModel;
    editorRef.current = monaco.editor.create(container, {
      model: currentModel,
      theme,
      readOnly,
      automaticLayout: true,
      fontSize: 14,
    });

    const handleBlur = () => {
      const currentVal = editorRef.current!.getValue();
      if (currentVal !== previousValueRef.current) {
        const dmp = new diff_match_patch();
        const diffs = dmp.diff_main(previousValueRef.current, currentVal);
        dmp.diff_cleanupSemantic(diffs);
        const patches = dmp.patch_make(previousValueRef.current, diffs);
        const patchText = dmp.patch_toText(patches);
        console.log('Generated Patches:', patchText);
        previousValueRef.current = currentVal;
        onChange?.(currentVal, patchText);
      }
    };

    const disposable = editorRef.current.onDidBlurEditorText(handleBlur);

    return () => {
      disposable.dispose();
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, [filePath, language, theme, readOnly]);

  useEffect(() => {
    if (modelRef.current && value !== modelRef.current.getValue()) {
      modelRef.current.setValue(value);
    }
    previousValueRef.current = value;
  }, [value]);

  return <div id={id.current} />;
};

export default MonacoEditor;
