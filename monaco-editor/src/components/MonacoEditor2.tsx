import * as monaco from 'monaco-editor';
import { useRef, useEffect } from 'react';
import { loadVirtualFilesAndCreateModels } from './monacoEditorSetup';
import{ diff_match_patch} from "diff-match-patch";

interface MonacoEditor2Props {
  filePath: string;
  value?: string;
  language?: string;
  theme?: string;
  readOnly?: boolean;
  onChange?: (value: string, diff: DiffChange[] | null) => void;
}

export interface DiffChange {
  type: 'added' | 'removed' | 'edited' | 'unchanged';
  range: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  removedTextLength: number;
  addedText: string;
  timestamp: number;
}

const MonacoEditor2: React.FC<MonacoEditor2Props> = ({
  filePath,
  value = '',
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
    previousValueRef.current = value;
    if (modelRef.current && value !== modelRef.current.getValue()) {
      modelRef.current.setValue(value);
    }
  }, [value]);

  // Initialize model and editor only once
  useEffect(() => {
    let isMounted = true;
    loadVirtualFilesAndCreateModels().then(() => {
      if (!isMounted) return; // Prevent state updates after unmount

      const uri = monaco.Uri.parse(`file:///${filePath}`);
      let currentModel = monaco.editor.getModel(uri);
      if (!currentModel) {
        currentModel = monaco.editor.createModel(value, language, uri);
      }
      modelRef.current = currentModel;

      const container = document.getElementById(id.current);
      if (container) {
        container.style.height = '40vh';
        container.style.width = '100vw';

        editorRef.current = monaco.editor.create(container, {
          model: currentModel,
          theme,
          readOnly,
          automaticLayout: true,
          fontSize: 14,
        });

        // Listen for content changes
        const disposable = editorRef.current.onDidChangeModelContent(() => {
          const currentVal = editorRef.current!.getValue();
          const diff = generateDiff(previousValueRef.current, currentVal);
          previousValueRef.current = currentVal; // update immediately
          onChange?.(currentVal, diff);
        });

        return () => {
          disposable.dispose();
          if (editorRef.current) {
            editorRef.current.dispose();
          }
        };
      }
    });
    return () => {
      isMounted = false;
    };
  }, [filePath, theme, readOnly, language]); 
  
  const generateDiff = (oldVal: string | undefined, newVal: string): DiffChange[] | null => {
    if (oldVal === undefined) return null;

    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(oldVal, newVal);
    dmp.diff_cleanupSemantic(diffs);
    console.log(diffs)
    const result: DiffChange[] = [];
    let oldPos = 0;
    let newPos = 0;

    for (let i = 0; i < diffs.length; i++) {
      const [operation, text] = diffs[i];
      const length = text.length;

      if (operation === 0) {
        // unchanged
        oldPos += length;
        newPos += length;
      } else if (operation === -1) {
        // deletion
        const nextDiff = diffs[i + 1];
        if (nextDiff && nextDiff[0] === 1) {
          // treat as edit
          const insertedText = nextDiff[1];
          const insertedLength = insertedText.length;
          result.push({
            type: 'edited',
            range: {
              start: { line: 1, column: oldPos + 1 },
              end: { line: 1, column: oldPos + length + 1 },
            },
            removedTextLength: length,
            addedText: insertedText,
            timestamp: Date.now(),
          });
          oldPos += length;
          newPos += insertedLength;
          i++; // skip insertion diff
        } else {
          // pure removal
          result.push({
            type: 'removed',
            range: {
              start: { line: 1, column: oldPos + 1 },
              end: { line: 1, column: oldPos + length + 1 },
            },
            removedTextLength: length,
            addedText: '',
            timestamp: Date.now(),
          });
          oldPos += length;
        }
      } else if (operation === 1) {
        // insertion
        result.push({
          type: 'added',
          range: {
            start: { line: 1, column: newPos + 1 },
            end: { line: 1, column: newPos + length + 1 },
          },
          removedTextLength: 0,
          addedText: text,
          timestamp: Date.now(),
        });
        newPos += length;
      }
    }

    return result.length > 0 ? result : null;
  };

  return <div id={id.current} className="h-full w-full border" />;
};

export default MonacoEditor2;