import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import MessagePage from './Components/MessagePage'
import { AuthoProvider } from './Components/AuthProvider'
import { FetchInvite } from './Components/NotiContext';


//All of these are async so they need to wait untill they are all loaded
const SecondPage   = lazy(() => import('./Components/SecondPage'));
const TaskPage     = lazy(() => import('./Components/TaskPage'));
const Tasks        = lazy(() => import('./Components/Tasks'));
const Calendar     = lazy(() => import('./Components/Calendar'));
const Analytics    = lazy(() => import('./Components/Analytics'));
const Notifications = lazy(() => import('./Components/Notifications'));


function App() {

  return (
    <Suspense fallback={null}>
      <Routes>

        <Route path="/" element={<MessagePage />} />

        <Route path="/TaskPage/:id" element={
          <AuthoProvider>
            <TaskPage />
          </AuthoProvider>
        } />

        <Route path="/SecondPage" element={
          <AuthoProvider>
            <FetchInvite>
              <SecondPage />
            </FetchInvite>
          </AuthoProvider>
        } />

        <Route path="/Tasks" element={
          <AuthoProvider>
            <Tasks />
          </AuthoProvider>
        } />

        <Route path="/Calendar" element={
          <AuthoProvider>
            <Calendar />
          </AuthoProvider>
        } />

        <Route path="/Analytics" element={
          <AuthoProvider>
            <Analytics />
          </AuthoProvider>
        } />

        <Route path="/Notifications" element={
          <AuthoProvider>
            <Notifications />
          </AuthoProvider>
        } />

   

      </Routes>
    </Suspense>
  )
}

export default App
