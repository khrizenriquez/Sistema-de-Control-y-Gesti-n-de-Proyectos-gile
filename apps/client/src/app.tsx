import { Route, Switch } from 'wouter-preact';
import { LoginPage } from './interface/pages/LoginPage';
import { RegisterPage } from './interface/pages/RegisterPage';
import { DashboardPage } from './interface/pages/DashboardPage';
import { BoardPage } from './interface/pages/BoardPage';
import { ProfilePage } from './interface/pages/ProfilePage';
import { BoardsPage } from './interface/pages/BoardsPage';
import { BoardSettingsPage } from './interface/pages/BoardSettingsPage';
import { CreateBoardPage } from './interface/pages/CreateBoardPage';
import './style.css'

export function App() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/boards" component={BoardsPage} />
      <Route path="/boards/new" component={CreateBoardPage} />
      <Route path="/boards/:id" component={BoardPage} />
      <Route path="/boards/:id/settings" component={BoardSettingsPage} />
    </Switch>
  );
}
