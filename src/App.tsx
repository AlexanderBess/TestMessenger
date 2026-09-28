import { useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Messenger } from './components/Messenger';
import type { Credentials } from './types';
import { clearCredentials, loadCredentials, saveCredentials } from './utils/storage';

export default function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(loadCredentials);

  if (!credentials) {
    return (
      <LoginScreen
        onLogin={(value) => {
          saveCredentials(value);
          setCredentials(value);
        }}
      />
    );
  }

  return (
    <Messenger
      key={credentials.idInstance}
      credentials={credentials}
      onLogout={() => {
        clearCredentials();
        setCredentials(null);
      }}
    />
  );
}
