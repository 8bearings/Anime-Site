import './css/App.css'
import { Favorites } from './pages/Favorites'
import { Home } from './pages/Home'
import { NavBar } from './components/NavBar'
import { ShowProvider } from './contexts/ShowContext'
import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <ShowProvider>
      <NavBar />
      <main className='main-content'>
        <Routes>
          <Route path='/Anime-Site' element={<Home />} />
          <Route path='/favorites' element={<Favorites />} />
        </Routes>
      </main>
    </ShowProvider>
  )
}

export default App
