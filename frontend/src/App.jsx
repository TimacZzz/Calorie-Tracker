import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [count, setCount] = useState(0);
  const [health, setHealth] = useState("");

  useEffect(() => {
    axios.get('/api/health')
      .then(res => setHealth(res.data.status));
  }, [])

  return (
    <h1 className="text-3xl font-bold underline">{health}</h1>
  );
}

export default App;
