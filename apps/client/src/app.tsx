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
import './style.css'

// Componente para rutas que requieren autenticación y tienen el Layout
const AuthRoute = ({ component: Component, ...rest }: { component: FunctionComponent<any>, path: string }) => {
  return (
    <Route
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
        <AuthRoute path="/dashboard" component={DashboardPage} />
        <AuthRoute path="/profile" component={ProfilePage} />
        <AuthRoute path="/boards" component={BoardsPage} />
        <AuthRoute path="/boards/new" component={CreateBoardPage} />
        <AuthRoute path="/boards/calendar" component={BoardCalendarPage} />
        <AuthRoute path="/boards/:id" component={BoardPage} />
        <AuthRoute path="/boards/:id/settings" component={BoardSettingsPage} />
        <AuthRoute path="/boards/:id/calendar" component={BoardCalendarPage} />
        <AuthRoute path="/teams" component={TeamsPage} />
        <AuthRoute path="/teams/:id" component={TeamPage} />
        <AuthRoute path="/teams/:id/:tab" component={TeamPage} />
        <AuthRoute path="/notifications" component={NotificationsPage} />
      </Switch>
    </div>
  );
}
