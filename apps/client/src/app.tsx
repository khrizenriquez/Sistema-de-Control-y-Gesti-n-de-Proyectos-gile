import { Route, Switch } from 'wouter-preact';
import { LoginPage } from './interface/pages/LoginPage';
import { RegisterPage } from './interface/pages/RegisterPage';
import './app.css'

export function App() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
    </Switch>
  );
}
