import { Link } from 'react-router-dom'
import "../css/Navbar.css"

export function NavBar() {
  return (
    <nav className='navbar'>
      <div className='navbar-brand'>
        <Link to='/Anime-Site'>Anime Finder</Link>
      </div>
      <div className='navbar-links'>
        <Link to='/Anime-Site' className='nav-link'>Home</Link>
        <Link to='/favorites' className='nav-link'>Favorites</Link>
      </div>
    </nav>
  )
}
