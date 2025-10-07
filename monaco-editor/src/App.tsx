import React, { useState } from 'react';
import MonacoEditor from './components/MonacoEditor';
import exampleFile from './example.tsx?raw';

const App: React.FC = () => {
  const [fileContent, setFileContent] = useState(exampleFile);

  const handleDiffChange = (diff: any) => {
    console.log('Detected Diff:', diff);
    // Here you can send diff to backend using fetch or WebSocket
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ textAlign: 'center', margin: '10px' }}>Monaco Diff Editor Demo</h2>
      <div style={{ flexGrow: 1 }}>
        <MonacoEditor
          filePath="example.tsx"
          originalValue={fileContent}   // DB version
          modifiedValue={fileContent}   // Editable version
          language="typescript"
          onDiffChange={handleDiffChange}
        />
      </div>
    </div>
  );
};

export default App;