import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

import { AuthData, Message } from "../types";
import { API_URL } from "../consts";

export default function Chat({ authData }: { authData: AuthData | null }) {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [chatList, setChatList] = useState<string[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>(
    {},
  );
  const [newMessages, setNewMessages] = useState<Record<string, number>>({});
  const [isChatRead, setIsChatRead] = useState<Record<string, boolean>>({});
  const processedNotifications = useRef(new Set<string>());
  const chatRef = useRef<HTMLDivElement | null>(null);

  const handleAddChat = () => {
    if (!phoneNumber.match(/^7\d{10}$/)) {
      console.log("Введите в формате 79001234567");
      return;
    }

    if (!chatList.includes(phoneNumber)) {
      setChatList([...chatList, phoneNumber]);
    }

    setPhoneNumber("");
  };

  const sendMessage = async () => {
    if (!selectedChat || !message) return;

    try {
      await axios.post(
        `${API_URL}/waInstance${authData?.id}/sendMessage/${authData?.token}`,
        {
          chatId: `${selectedChat}@c.us`,
          message: message,
        },
      );

      setChatMessages((prev) => ({
        ...prev,
        [selectedChat]: [
          ...(prev[selectedChat] || []),
          { sender: "You", text: message },
        ],
      }));

      setMessage("");
    } catch (error) {
      console.error("Ошибка при отправке сообщения", error);
    }
  };

  const fetchMessages = useCallback(async () => {
    try {
      while (true) {
        const response = await axios.get(
          `${API_URL}/waInstance${authData?.id}/receiveNotification/${authData?.token}`,
        );

        if (!response.data) break;

        const receiptId = response.data.receiptId;
        const newMsg =
          response.data.body?.messageData?.textMessageData?.textMessage;
        const sender = response.data.body?.senderData?.sender?.replace(
          "@c.us",
          "",
        );

        if (!receiptId || processedNotifications.current.has(receiptId)) {
          await axios.delete(
            `${API_URL}/waInstance${authData?.id}/deleteNotification/${authData?.token}/${receiptId}`,
          );
          continue;
        }

        if (newMsg && sender) {
          setChatMessages((prev) => ({
            ...prev,
            [sender]: [
              ...(prev[sender] || []),
              { sender: "Client", text: newMsg },
            ],
          }));

          // Увеличиваем индикатор новых сообщений только если чат не выбран или не был прочитан
          if (sender !== selectedChat || !isChatRead[sender]) {
            setNewMessages((prev) => ({
              ...prev,
              [sender]: (prev[sender] || 0) + 1,
            }));
          }
        }

        processedNotifications.current.add(receiptId);

        await axios.delete(
          `${API_URL}/waInstance${authData?.id}/deleteNotification/${authData?.token}/${receiptId}`,
        );
      }
    } catch (error) {
      console.error("Ошибка при получении сообщений:", error);
    }
  }, [selectedChat, authData, isChatRead]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Прокрутка в самый низ при изменении сообщений
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages, selectedChat]); // Срабатывает при изменении сообщений или при смене чата

  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleChatSelect = (chat: string) => {
    setSelectedChat(chat);
    // Сбрасываем индикатор новых сообщений при входе в чат
    setNewMessages((prev) => ({ ...prev, [chat]: 0 }));
    // Устанавливаем флаг, что чат прочитан
    setIsChatRead((prev) => ({ ...prev, [chat]: true }));
  };

  const handleChatLeave = () => {
    if (selectedChat && isChatRead[selectedChat]) {
      // Если чат был прочитан, сбрасываем индикатор новых сообщений
      setNewMessages((prev) => ({ ...prev, [selectedChat]: 0 }));
    }
    setSelectedChat(null);
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded-lg shadow-lg bg-white">
      {!selectedChat ? (
        <>
          <h2 className="text-xl font-bold mb-4 text-black">WhatsApp Chat</h2>
          <input
            placeholder="Введите номер (без +)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full text-sm mt-2 px-5 py-3 text-black bg-gray-100 rounded-md"
          />
          <button onClick={handleAddChat} className="text-sm mt-2 w-full">
            New chat
          </button>
          <div className="mt-4">
            {chatList.length === 0 ? (
              <p className="text-gray-500">No chats</p>
            ) : (
              chatList.map((chat) => (
                <div
                  key={chat}
                  className="mt-2 bg-white hover:bg-gray-200 cursor-pointer rounded-md"
                  onClick={() => handleChatSelect(chat)}
                >
                  <div className="flex flex-row items-center px-4 py-4 text-gray-500 border hover:border-gray-200 rounded-md">
                    <div className="w-6 h-6 bg-zinc-600 rounded-full"></div>
                    <div className="text-sm ml-5">{chat}</div>
                    {newMessages[chat] > 0 && (
                      <div className="ml-auto bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                        {newMessages[chat]}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold mb-4 text-black">
            Chat for {selectedChat}
          </h2>

          <div
            ref={chatRef}
            className="border p-2 h-64 overflow-auto bg-gray-100 rounded-lg"
          >
            {(chatMessages[selectedChat] || []).map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-2 my-1 rounded-lg ${
                  msg.sender === "You"
                    ? "bg-blue-500 text-white text-right ml-auto"
                    : "bg-gray-300 text-left mr-auto"
                } max-w-xs`}
              >
                <strong>{msg.sender}:</strong> {msg.text}
              </motion.div>
            ))}
          </div>

          <input
            placeholder="Type a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full text-sm mt-2 px-5 py-5 text-black bg-gray-100 rounded-md"
          />
          <button onClick={sendMessage} className="mt-5 w-full">
            Send
          </button>

          <button onClick={handleChatLeave} className="mt-2 w-full bg-gray-400">
            Back
          </button>
        </>
      )}
    </div>
  );
}
