export interface AuthData {
  id: string;
  token: string;
}

export interface Message {
  sender: string;
  text: string;
}

export interface Chat {
  phoneNumber: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface AuthFormProps {
  onLogin: (idInstance: string, apiToken: string) => void;
}
