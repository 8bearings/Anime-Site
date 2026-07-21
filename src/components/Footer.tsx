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
            href='https://tenrai.org/'
            target='_blank'
            rel='noopener noreferrer'
          >
            Tenrai API
          </a>
        </p>
      </div>
    </footer>
  )
}
