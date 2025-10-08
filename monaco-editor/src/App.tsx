import React, { useState } from 'react';
import MonacoEditor from './components/MonacoEditor';
import exampleFile from './example.tsx?raw';
import MonacoEditor2, { type DiffChange } from './components/MonacoEditor2';

const App: React.FC = () => {
  const [fileContent, setFileContent] = useState("const a = 1;");
 const [diffLog, setDiffLog] = useState<string>('');

   const handleChange = (value: string, diff: DiffChange[] | null) => {
         const diffString = JSON.stringify(diff, null, 2);
      setDiffLog(diffString);
      setFileContent(value)
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ textAlign: 'center', margin: '10px' }}>Monaco Diff Editor Demo</h2>
      <div style={{ flexGrow: 1 }}>
        {/* <MonacoEditor
          filePath="example.tsx"
          originalValue={fileContent}   // DB version
          modifiedValue={fileContent}   // Editable version
          language="typescript"
          onDiffChange={handleDiffChange}
        /> */}
         <MonacoEditor2
      filePath="example.ts"
      value={fileContent}
      onChange={handleChange}
    />
      <h3>Diff Object (Copyable):</h3>
      <pre style={{ background: 'white',color:"black", padding: '10px', borderRadius: '4px' }}>
        {diffLog}
      </pre>
      </div>
    </div>
  );
};

export default App;