import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Blockchain from './models/Blockchain.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Blockchain/>
  </StrictMode>,
)
