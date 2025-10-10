// App.tsx
import  { useState, useEffect } from 'react';
import MonacoEditor from './components/MonacoEditor3';

const App = () => {
  const [code, setCode] = useState<string>('');
  const [fileName, setFileName] = useState<string>('example.ts');
  const [patches, setPatches] = useState('');

  const fetchFile=async()=>{
    const response=await fetch(`http://localhost:8082/api/get-file/${fileName}`);
    const data=await response.json();
    setCode(data.content)
  }
  // Fetch the file content on load
  useEffect(() => {
fetchFile()
  }, [fileName]);

  const handleChange = (value: string, patchText: string) => {
    setCode(value);
    setPatches(patchText);
  };

  const sendPatchesToBackend = async () => {
    try {
      const response = await fetch('http://localhost:8082/api/apply-patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: fileName,
          patches: patches,
        }),
      });
      // const result = await response.text();
      alert('Patches applied successfully!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to apply patches.');
    }
  };

  return (
    <div style={{width:'100vw',marginTop:'0',height:'100vh'}}>
      <h4 className="text-2xl font-bold">Diff-Match-Patch Demo</h4>
      <div className="mb-4">
        <label className="block mb-2">File Name:</label>
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
        />
      </div>
      <MonacoEditor
        filePath={fileName}
        value={code}
        onChange={handleChange}
      />
      <div className="mt-4">
        <h6>Generated Patches:</h6>
        <textarea
          
          value={patches}
          readOnly
        />
      </div>
      <button
        onClick={sendPatchesToBackend}
      >
        Apply Patches to Backend
      </button>
    </div>
  );
};

export default App;
