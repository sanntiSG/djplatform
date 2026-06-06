import { lazy, Suspense } from 'react'
import { Route, useLocation } from 'react-router-dom'
import { Header } from './components/ui/Header.js'
import { TransitionProvider } from './components/transition/TransitionProvider.js'
import { Toast } from './components/ui/Toast.js'
import { useToastStore } from './store/useToastStore.js'
import { RequireAuth } from './components/auth/RequireAuth.js'
import { NotificationPermissionModal } from './components/notifications/NotificationPermissionModal.js'
import { InstallPwaPrompt } from './components/notifications/InstallPwaPrompt.js'
import { useNotificationsPermission } from './hooks/useNotificationsPermission.js'
import { useNotificationsSocket } from './hooks/useNotificationsSocket.js'
import { useAuthStore } from './store/useAuthStore.js'

// Paginas criticas de primer load — sin lazy (son pequeñas o la ruta de entrada)
import Landing from './pages/Landing.js'
import Login from './pages/Login.js'
import Register from './pages/Register.js'
import NotFound from './pages/NotFound.js'

// Paginas principales frecuentes — lazy para no bloquear el bundle inicial
const MainFeed       = lazy(() => import('./pages/MainFeed.js'))
const EventsFeed     = lazy(() => import('./pages/EventsFeed.js'))
const EventDetail    = lazy(() => import('./pages/EventDetail.js'))
const Profiles       = lazy(() => import('./pages/Profiles.js'))
const PublicProfile  = lazy(() => import('./pages/PublicProfile.js'))
const GenreDetail    = lazy(() => import('./pages/GenreDetail.js'))
const Opportunities  = lazy(() => import('./pages/Opportunities.js'))
const OpportunityDetail = lazy(() => import('./pages/OpportunityDetail.js'))
const Activity       = lazy(() => import('./pages/Activity.js'))
const Trending        = lazy(() => import('./pages/Trending.js'))
const Projects        = lazy(() => import('./pages/Projects.js'))
const ProjectDetail   = lazy(() => import('./pages/ProjectDetail.js'))
const ProjectNew      = lazy(() => import('./pages/ProjectNew.js'))
const ProjectEdit     = lazy(() => import('./pages/ProjectEdit.js'))

// Paginas de usuario autenticado — solo se cargan cuando el usuario las visita
const Me                      = lazy(() => import('./pages/Me.js'))
const Notifications           = lazy(() => import('./pages/Notifications.js'))
const MessagesInbox           = lazy(() => import('./pages/messages/Inbox.js'))
const MessagesConversation    = lazy(() => import('./pages/messages/Conversation.js'))
const ProfileSetup            = lazy(() => import('./pages/ProfileSetup.js'))
const ProfileEdit             = lazy(() => import('./pages/ProfileEdit.js'))
const EventNew                = lazy(() => import('./pages/EventNew.js'))
const OpportunityNew          = lazy(() => import('./pages/OpportunityNew.js'))
const Biblioteca              = lazy(() => import('./pages/Biblioteca.js'))
const RecomendacionesCanciones = lazy(() => import('./pages/RecomendacionesCanciones.js'))
const RecomendacionesArtistas  = lazy(() => import('./pages/RecomendacionesArtistas.js'))
const ChangePassword          = lazy(() => import('./pages/ChangePassword.js'))

// Panel admin — completamente separado del bundle de usuarios normales
const AdminLayout       = lazy(() => import('./pages/admin/AdminLayout.js'))
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard.js'))
const AdminProfiles     = lazy(() => import('./pages/admin/AdminProfiles.js'))
const AdminEvents       = lazy(() => import('./pages/admin/AdminEvents.js'))
const AdminUsers        = lazy(() => import('./pages/admin/AdminUsers.js'))
const AdminGenres       = lazy(() => import('./pages/admin/AdminGenres.js'))
const AdminProfileTypes = lazy(() => import('./pages/admin/AdminProfileTypes.js'))
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications.js'))
const AdminSystem       = lazy(() => import('./pages/admin/AdminSystem.js'))

const HIDE_HEADER_PATHS = ['/auth/login', '/auth/register', '/auth/change-password']

function ToastRenderer() {
  const { message, variant, dismiss } = useToastStore()
  if (!message) return null
  return <Toast message={message} variant={variant} onDismiss={dismiss} />
}

function NotificationSocketMount() {
  useNotificationsSocket()
  return null
}

function NotificationsGate() {
  const { user } = useAuthStore()
  const { open, handleActivate, handleDismiss, showInstallPrompt, setShowInstallPrompt } = useNotificationsPermission()
  return (
    <>
      {user && <NotificationSocketMount />}
      <NotificationPermissionModal
        open={open}
        onActivate={handleActivate}
        onDismiss={handleDismiss}
      />
      {showInstallPrompt && (
        <InstallPwaPrompt onClose={() => setShowInstallPrompt(false)} />
      )}
    </>
  )
}

// Fallback minimo mientras el chunk lazy se carga — evita flash de pantalla en blanco
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
    </div>
  )
}

export default function App() {
  const { pathname } = useLocation()
  const showHeader = !HIDE_HEADER_PATHS.includes(pathname)

  return (
    <>
      {showHeader && <Header />}
      <ToastRenderer />
      <NotificationsGate />
      <Suspense fallback={<PageLoader />}>
        <TransitionProvider>
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
          <Route path="/actividad" element={<Activity />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/proyectos" element={<Projects />} />
          <Route path="/proyectos/:id" element={<ProjectDetail />} />
          <Route path="/proyectos/nueva" element={<RequireAuth><ProjectNew /></RequireAuth>} />
          <Route path="/proyectos/:id/editar" element={<RequireAuth><ProjectEdit /></RequireAuth>} />
          <Route path="/oportunidades" element={<Opportunities />} />
          <Route path="/oportunidades/:id" element={<OpportunityDetail />} />
          <Route path="/oportunidades/nueva" element={<RequireAuth><OpportunityNew /></RequireAuth>} />

          <Route path="/biblioteca" element={<RequireAuth><Biblioteca /></RequireAuth>} />
          <Route path="/recomendaciones/canciones" element={<RequireAuth><RecomendacionesCanciones /></RequireAuth>} />
          <Route path="/recomendaciones/artistas" element={<RequireAuth><RecomendacionesArtistas /></RequireAuth>} />
          <Route path="/me" element={<RequireAuth><Me /></RequireAuth>} />
          <Route path="/me/notificaciones" element={<RequireAuth><Notifications /></RequireAuth>} />
          <Route path="/me/mensajes" element={<RequireAuth><MessagesInbox /></RequireAuth>} />
          <Route path="/me/mensajes/:id" element={<RequireAuth><MessagesConversation /></RequireAuth>} />
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
            <Route path="system" element={<AdminSystem />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </TransitionProvider>
      </Suspense>
    </>
  )
}
