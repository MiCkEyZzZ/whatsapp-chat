import { useEffect, useState } from "react";

import { AuthFormProps } from "../types";

export default function AuthForm({ onLogin }: AuthFormProps) {
  const [idInstance, setIdInstance] = useState<string>("");
  const [apiToken, setApiToken] = useState<string>("");

  const handleLogin = () => {
    if (!idInstance || !apiToken) {
      console.log("Введите корректные данные!");
      return;
    }

    localStorage.setItem("idInstance", idInstance);
    localStorage.setItem("apiToken", apiToken);

    onLogin(idInstance, apiToken);
  };

  useEffect(() => {
    const savedId = localStorage.getItem("idInstance");
    const savedToken = localStorage.getItem("apiToken");

    if (savedId && savedToken) {
      setIdInstance(savedId);
      setApiToken(savedToken);
    }
  }, []);

  return (
    <div className="max-w-xlg mx-auto px-4 py-10 border rounded-lg shadow-lg">
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4">Authorization</h2>
      </div>

      <div className="flex flex-wrap flex-col md:flex-row items-center justify-center">
        <input
          placeholder="ID Instance"
          value={idInstance}
          onChange={(e) => setIdInstance(e.target.value)}
          className="mr-0 mb-5 md:mb-0 md:mr-3 px-5 py-2 border rounded-md"
        />
        <input
          placeholder="API Token"
          value={apiToken}
          onChange={(e) => setApiToken(e.target.value)}
          className="px-5 py-2 border rounded-md"
        />
      </div>

      <div className="w-full mt-5">
        <button onClick={handleLogin} className="mt-2 w-full">
          Login
        </button>
      </div>
    </div>
  );
}
