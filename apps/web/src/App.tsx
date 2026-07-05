import { Route, Routes } from 'react-router-dom'
import './App.css'
import { AppLayout } from './routes/AppLayout'
import { HomePage } from './routes/HomePage'
import { ItemFormPage } from './routes/itens/ItemFormPage'
import { ItensListPage } from './routes/itens/ItensListPage'
import { LoginPage } from './routes/LoginPage'
import { ProtectedRoute } from './routes/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/itens" element={<ItensListPage />} />
          <Route path="/itens/novo" element={<ItemFormPage />} />
          <Route path="/itens/:id/editar" element={<ItemFormPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
