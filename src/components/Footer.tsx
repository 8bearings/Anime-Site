import React from 'react'
import '../css/Footer.css'

export const Footer: React.FC = () => {
  return (
    <footer className='footer'>
      <div className='footer-content'>
        <p>© 2025 Anime Finder</p>
        <p className='bottom-footer'>
          Powered by{' '}
          <a
            href='https://jikan.moe/'
            target='_blank'
            rel='noopener noreferrer'
          >
            Jikan API
          </a>
        </p>
      </div>
    </footer>
  )
}
