import { Link, useLocation } from 'react-router-dom'
import '../css/Navbar.css'
import { NavBarProps } from '../types/interfaces'

export function NavBar({ onRefresh }: NavBarProps) {
  const location = useLocation()

  const handleClick = (e: React.MouseEvent) => {
    if (location.pathname === '/Anime-Site') {
      e.preventDefault()
      onRefresh()
    }
  }

  return (
    <nav className='navbar'>
      <div className='navbar-brand'>
        <Link to='/Anime-Site' onClick={handleClick}>
          Anime Finder
        </Link>
      </div>
      <div className='navbar-links'>
        <Link to='/Anime-Site' onClick={handleClick} className='nav-link'>
          Home
        </Link>
        <Link to='/favorites' className='nav-link'>
          Favorites
        </Link>
      </div>
    </nav>
  )
}
