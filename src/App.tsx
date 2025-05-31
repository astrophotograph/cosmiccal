import GridRectangle from './components/GridRectangle';

function App() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <main className="flex-grow mx-auto py-6 px-3 flex justify-center items-center">
        <div className="bg-gray-800/80 backdrop-blur-lg rounded-xl p-4 shadow-xl w-full max-w-4xl">
          <GridRectangle width={800} height={800} />
        </div>
      </main>
      <footer className="w-full py-3 bg-gray-800 text-gray-400 text-center text-xs">
        <p>© {currentYear} the authors. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
