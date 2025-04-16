import './App.css';

function App() {
  return (
    <>
      <h1>Root Application</h1>
      <p>This is the main entry point. Choose an application:</p>
      <nav>
        <ul>
          <li>
            <a href="/app-a/">App A</a>
          </li>
          <li>
            <a href="/app-b/">App B</a>
          </li>
          <li>
            <a href="/app-c/">App C</a>
          </li>
        </ul>
      </nav>
      <hr />
      <p>
        <em>(Below is the default Vite + React template content)</em>
      </p>
      {/* Original Vite content can remain below or be removed */}
      {/* ... original Vite + React template ... */}
    </>
  );
}

export default App;
