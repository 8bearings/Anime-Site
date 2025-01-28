// import { useState } from 'react'
import './css/App.css'
import { Favorites } from './pages/Favorites'
// import { ShowCard } from './components/ShowCard'
import { Home } from './pages/Home'
import { NavBar } from './components/NavBar'
import { Routes, Route } from 'react-router-dom'

function App() {



  return (
<div>
  <NavBar />
<main className='main-content'>
  <Routes>
    <Route path='/' element= {<Home/>}/>
    <Route path='/favorites' element= {<Favorites/>}/>
  </Routes>
</main>
</div>
  )
}

export default App
