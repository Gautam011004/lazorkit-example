import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LazorkitProvider } from '@lazorkit/wallet'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
  <LazorkitProvider paymasterConfig={{paymasterUrl: "https://kora.devnet.lazorkit.com"}}>
    <App />
  </LazorkitProvider>
  </StrictMode>,
)
