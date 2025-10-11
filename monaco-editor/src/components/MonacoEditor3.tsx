import * as monaco from "monaco-editor";
import { useRef, useEffect } from "react";
import { diff_match_patch } from "diff-match-patch";
import "./monacoEditorSetup";

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
  language = "typescript",
  theme = "vs-dark",
  readOnly = false,
  onChange,
}) => {
  const id = useRef<string>(`monaco-editor-${Math.random()}`);
  const editorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
  const originalModelRef = useRef<monaco.editor.ITextModel | null>(null);
  const modifiedModelRef = useRef<monaco.editor.ITextModel | null>(null);
  const previousValueRef = useRef<string>(value);

  useEffect(() => {
    const container = document.getElementById(id.current);
    if (!container) return;
    container.style.height = "70vh";
    container.style.width = "100%";

    const originalModel = monaco.editor.createModel(value, language);
    originalModelRef.current = originalModel;
    const modifiedModel = monaco.editor.createModel(value, language);
    modifiedModelRef.current = modifiedModel;

    editorRef.current = monaco.editor.createDiffEditor(container, {
      theme,
      readOnly,
      automaticLayout: true,
      fontSize: 14,
      renderSideBySide: false, // Inline mode
      enableSplitViewResizing: false,
      renderOverviewRuler: true, // Hide diff decorations initially
      ignoreTrimWhitespace: true,
      renderMarginRevertIcon: false,
      find: {
        autoFindInSelection: "always",
      },
    });

    editorRef.current.setModel({
      original: originalModel,
      modified: modifiedModel,
    });

    // Hide the original editor
    const originalEditor = editorRef.current.getOriginalEditor();
    originalEditor.updateOptions({
      readOnly: true,
      glyphMargin: false,
      lineNumbers: "off",
    });

    const modifiedEditor = editorRef.current.getModifiedEditor();

    const handleChange = () => {
      editorRef.current?.updateOptions({
        renderOverviewRuler: true,
      });
    };

    // Generate patches on blur
    const handleBlur = () => {
      const currentVal = modifiedModelRef.current!.getValue();
      console.log(currentVal);
      if (currentVal !== previousValueRef.current) {
        const dmp = new diff_match_patch();
        const diffs = dmp.diff_main(previousValueRef.current, currentVal);
        dmp.diff_cleanupSemantic(diffs);
        const patches = dmp.patch_make(previousValueRef.current, diffs);
        const patchText = dmp.patch_toText(patches);
        console.log("Generated Patches:", patchText);
        previousValueRef.current = currentVal;
        onChange?.(currentVal, patchText);
      }
    };

    const changeDisposable =
      modifiedModelRef.current.onDidChangeContent(handleChange);

    const blurDisposable = modifiedEditor.onDidBlurEditorText(handleBlur);

    return () => {
      changeDisposable.dispose();
      blurDisposable.dispose();
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, [filePath, language, theme, readOnly, value]);

  useEffect(() => {
    if (
      modifiedModelRef.current &&
      value !== modifiedModelRef.current.getValue()
    ) {
      modifiedModelRef.current.setValue(value);
      originalModelRef.current?.setValue(value);
    }
    previousValueRef.current = value;
  }, [value]);

  return <div id={id.current} />;
};

export default MonacoEditor;
