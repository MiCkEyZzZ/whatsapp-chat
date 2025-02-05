import { useState } from "react";

import "./App.css";
import { AuthData } from "./types";
import AuthForm from "./components/AuthForm";
import Chat from "./components/Chat";

function App() {
  const [authData, setAuthData] = useState<AuthData | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {!authData ? (
        <AuthForm
          onLogin={(id: string, token: string) => setAuthData({ id, token })}
        />
      ) : (
        <Chat authData={authData} />
      )}
    </div>
  );
}

export default App;
