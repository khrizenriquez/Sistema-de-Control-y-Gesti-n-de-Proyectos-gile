import { Route, Switch } from 'wouter-preact';
import { LoginPage } from './interface/pages/LoginPage';
import { RegisterPage } from './interface/pages/RegisterPage';
import { DashboardPage } from './interface/pages/DashboardPage';
import { BoardPage } from './interface/pages/BoardPage';
import { ProfilePage } from './interface/pages/ProfilePage';
import { BoardsPage } from './interface/pages/BoardsPage';
import { BoardSettingsPage } from './interface/pages/BoardSettingsPage';
import { CreateBoardPage } from './interface/pages/CreateBoardPage';
import { BoardCalendarPage } from './interface/pages/BoardCalendarPage';
import { TeamsPage } from './interface/pages/TeamsPage';
import { TeamPage } from './interface/pages/TeamPage';
import { NotificationsPage } from './interface/pages/NotificationsPage';
import { Layout } from './interface/components/Layout';
import { FunctionComponent } from 'preact';
import { ProtectedRoute } from './interface/components/ProtectedRoute';
import { EnvWarning } from './components/EnvWarning';
import AdminUsersPage from './pages/AdminUsersPage';
import { ProjectsPage } from './interface/pages/ProjectsPage';
import { ProjectDetailPage } from './interface/pages/ProjectDetailPage';
import { ProjectMembersPage } from './interface/pages/ProjectMembersPage';
import './style.css'

// Componente para rutas que requieren autenticación y tienen el Layout
const AuthRouteWithLayout = ({ component: Component, ...rest }: { component: FunctionComponent<any>, path: string }) => {
  return (
    <ProtectedRoute
      {...rest}
      component={(props: any) => (
        <Layout>
          <Component {...props} />
        </Layout>
      )}
    />
  );
};

export function App() {
  return (
    <div className="min-h-screen">
      <Switch>
        {/* Rutas públicas sin Layout */}
        <Route path="/" component={LoginPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        
        {/* Rutas protegidas con Layout */}
        <AuthRouteWithLayout path="/dashboard" component={DashboardPage} />
        <AuthRouteWithLayout path="/profile" component={ProfilePage} />
        <AuthRouteWithLayout path="/boards" component={BoardsPage} />
        <AuthRouteWithLayout path="/boards/new" component={CreateBoardPage} />
        <AuthRouteWithLayout path="/boards/calendar" component={BoardCalendarPage} />
        <AuthRouteWithLayout path="/boards/:id" component={BoardPage} />
        <AuthRouteWithLayout path="/boards/:id/settings" component={BoardSettingsPage} />
        <AuthRouteWithLayout path="/boards/:id/calendar" component={BoardCalendarPage} />
        <AuthRouteWithLayout path="/teams" component={TeamsPage} />
        <AuthRouteWithLayout path="/teams/:id" component={TeamPage} />
        <AuthRouteWithLayout path="/teams/:id/:tab" component={TeamPage} />
        <AuthRouteWithLayout path="/notifications" component={NotificationsPage} />
        <AuthRouteWithLayout path="/admin/users" component={AdminUsersPage} />
        <AuthRouteWithLayout path="/projects" component={ProjectsPage} />
        <AuthRouteWithLayout path="/projects/:id" component={ProjectDetailPage} />
        <AuthRouteWithLayout path="/projects/:id/members" component={ProjectMembersPage} />
      </Switch>
      
      {/* Componente de utilidad */}
      <EnvWarning />
    </div>
  );
}
