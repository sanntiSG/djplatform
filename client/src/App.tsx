import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Header } from './components/ui/Header.js'
import { Toast } from './components/ui/Toast.js'
import { useToastStore } from './store/useToastStore.js'
import { RequireAuth } from './components/auth/RequireAuth.js'
import { NotificationPermissionModal } from './components/notifications/NotificationPermissionModal.js'
import { useNotificationsPermission } from './hooks/useNotificationsPermission.js'
import Landing from './pages/Landing.js'
import Login from './pages/Login.js'
import Register from './pages/Register.js'
import Me from './pages/Me.js'
import NotFound from './pages/NotFound.js'
import ProfileSetup from './pages/ProfileSetup.js'
import ProfileEdit from './pages/ProfileEdit.js'
import PublicProfile from './pages/PublicProfile.js'
import EventsFeed from './pages/EventsFeed.js'
import EventNew from './pages/EventNew.js'
import EventDetail from './pages/EventDetail.js'
import Profiles from './pages/Profiles.js'
import AdminLayout from './pages/admin/AdminLayout.js'
import AdminDashboard from './pages/admin/AdminDashboard.js'
import AdminProfiles from './pages/admin/AdminProfiles.js'
import AdminEvents from './pages/admin/AdminEvents.js'
import AdminUsers from './pages/admin/AdminUsers.js'
import AdminGenres from './pages/admin/AdminGenres.js'
import AdminProfileTypes from './pages/admin/AdminProfileTypes.js'
import AdminNotifications from './pages/admin/AdminNotifications.js'
import GenreDetail from './pages/GenreDetail.js'
import ChangePassword from './pages/ChangePassword.js'
import MainFeed from './pages/MainFeed.js'
import Notifications from './pages/Notifications.js'

const HIDE_HEADER_PATHS = ['/auth/login', '/auth/register', '/auth/change-password']

function ToastRenderer() {
  const { message, variant, dismiss } = useToastStore()
  if (!message) return null
  return <Toast message={message} variant={variant} onDismiss={dismiss} />
}

function NotificationsGate() {
  const { open, handleActivate, handleDismiss } = useNotificationsPermission()
  return (
    <NotificationPermissionModal
      open={open}
      onActivate={handleActivate}
      onDismiss={handleDismiss}
    />
  )
}

export default function App() {
  const { pathname } = useLocation()
  const showHeader = !HIDE_HEADER_PATHS.includes(pathname)

  // Global Scroll-to-Top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      {showHeader && <Header />}
      <ToastRenderer />
      <NotificationsGate />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/change-password" element={<ChangePassword />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/p/:id" element={<PublicProfile />} />
        <Route path="/g/:slug" element={<GenreDetail />} />
        <Route path="/feed" element={<MainFeed />} />
        <Route path="/events" element={<EventsFeed />} />
        <Route path="/events/:id" element={<EventDetail />} />

        <Route path="/me" element={<RequireAuth><Me /></RequireAuth>} />
        <Route path="/me/notificaciones" element={<RequireAuth><Notifications /></RequireAuth>} />
        <Route path="/profile/setup" element={<RequireAuth><ProfileSetup /></RequireAuth>} />
        <Route path="/profile/edit" element={<RequireAuth><ProfileEdit /></RequireAuth>} />
        <Route path="/events/new" element={<RequireAuth><EventNew /></RequireAuth>} />

        <Route
          path="/admin"
          element={<RequireAuth adminOnly><AdminLayout /></RequireAuth>}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="profiles" element={<AdminProfiles />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="genres" element={<AdminGenres />} />
          <Route path="profile-types" element={<AdminProfileTypes />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
