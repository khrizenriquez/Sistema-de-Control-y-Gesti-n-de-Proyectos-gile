import { Route, Switch } from 'wouter-preact';
import { LoginPage } from './interface/pages/LoginPage';
import { RegisterPage } from './interface/pages/RegisterPage';
import { DashboardPage } from './interface/pages/DashboardPage';
import { BoardPage } from './interface/pages/BoardPage';
import { ProfilePage } from './interface/pages/ProfilePage';
import './style.css'

export function App() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/board" component={BoardPage} />
      <Route path="/profile" component={ProfilePage} />
    </Switch>
  );
}
