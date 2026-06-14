import './css/App.css'
import { Favorites } from './pages/Favorites'
import { Home } from './pages/Home'
import { AnimeDetail } from './pages/AnimeDetail'
import { NavBar } from './components/NavBar'
import { ShowProvider } from './contexts/ShowContext'
import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'

function App() {
  const [refreshKey, setRefreshKey] = useState<number>(0)

  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1)
  }

  return (
    <ShowProvider>
      <NavBar onRefresh={handleRefresh} />
      <main className='main-content'>
        <Routes>
          <Route path='/' element={<Home key={refreshKey} />} />
          <Route path='/favorites' element={<Favorites />} />
          <Route path='/anime/:id' element={<AnimeDetail />} />
        </Routes>
      </main>
    </ShowProvider>
  )
}

export default App
