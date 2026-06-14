import './App.css'
import AppRouter from './router'
import ToastContainer from './components/common/ToastContainer'
import { SocketProvider } from './context/SocketContext'

function App() {
  return (
    <SocketProvider>
      <AppRouter />
      <ToastContainer />
    </SocketProvider>
  )
}

export default App
