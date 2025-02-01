import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route } from "react-router-dom";
import './index.css'
import App from './App.jsx'
import ShortForm from './ShortForm.jsx';
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<App />} ></Route>
      <Route path="/short-form" element={<ShortForm/>} />
      </>

  ))
createRoot(document.getElementById('root')).render(
  <StrictMode>
     <RouterProvider router={router} />
  </StrictMode>,
)
