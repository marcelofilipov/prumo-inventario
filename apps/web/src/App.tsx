import { Route, Routes } from 'react-router-dom'
import './App.css'
import { HomePage } from './routes/HomePage'
import { LoginPage } from './routes/LoginPage'
import { ProtectedRoute } from './routes/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
      </Route>
    </Routes>
  )
}

export default App
