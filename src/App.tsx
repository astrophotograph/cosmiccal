import './App.css'
import { YearCalendar } from './components/YearCalendar'

function App() {
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <main className="flex-grow container place-content-center px-10">
        <div className="bg-gray-800/80 backdrop-blur-lg rounded-xl p-4 shadow-xl">
          <YearCalendar/>
        </div>
      </main>
      <footer className="w-full py-3 bg-gray-800 text-gray-400 text-center text-xs">
        <p>© {currentYear} the authors. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
