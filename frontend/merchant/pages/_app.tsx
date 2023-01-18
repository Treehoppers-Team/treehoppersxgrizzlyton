import Footer from '@/components/footer'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Navbar from '../components/navBar'

export default function App({ Component, pageProps }: AppProps) {
  return <>
    <Navbar/>
    <Component {...pageProps} />
    <Footer/>
  </>
}
