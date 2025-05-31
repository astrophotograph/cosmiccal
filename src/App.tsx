import './App.css'
import YearCalendar from './components/YearCalendar'

function App() {
  const currentYear = new Date().getFullYear()

  return (
    <div className="h-screen w-screen min-h-screen bg-gray-900 flex flex-col">
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 shadow-xl">
          <YearCalendar/>
        </div>
      </main>
      <footer className="w-full py-4 bg-gray-800 text-gray-400 text-center text-sm">
        <p>© {currentYear} the authors. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
