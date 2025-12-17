import { useEffect, useState, useRef } from "react";
import { gql } from "@apollo/client";
import { useAuthStore } from "../../stores/useAuthStore";
import { useMutation, useQuery } from "@apollo/client/react";

interface User {
  id: string;
  username: string;
  __typename?: string;
}

interface Message {
  id: string;
  text: string;
  sender: User;
  __typename?: string;
}

interface ChatWindowProps {
  chatId: string;
}

interface SendMessageResponse {
  sendMessage: Message;
}

const GET_MESSAGES = gql`
  query GetMessages($chatId: ID!) {
    getMessages(chatId: $chatId) {
      id
      text
      sender {
        id
        username
      }
    }
  }
`;

const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      text
      sender {
        id
        username
      }
    }
  }
`;

const MESSAGE_SENT = gql`
  subscription MessageSent($chatId: ID!) {
    messageSent(chatId: $chatId) {
      id
      text
      sender {
        id
        username
      }
    }
  }
`;

export default function ChatWindow({ chatId }: ChatWindowProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [messageText, setMessageText] = useState("");

  const { data, loading, subscribeToMore } = useQuery<{ getMessages: Message[] }>(
    GET_MESSAGES,
    { variables: { chatId }, skip: !chatId }
  );

  const [sendMessage] = useMutation<SendMessageResponse>(SEND_MESSAGE);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [data]);

  
 useEffect(() => {
  if (!chatId || !subscribeToMore) return;

  const unsubscribe = subscribeToMore<{ messageSent: Message }, { chatId: string }>({
    document: MESSAGE_SENT,
    variables: { chatId },
    updateQuery: (prev, { subscriptionData }) => {
      if (!subscriptionData?.data?.messageSent) return prev as { getMessages: Message[] };

      const newMessage: Message = subscriptionData.data.messageSent;

  
      const prevMessages: Message[] = (prev.getMessages ?? []).filter(
        (m): m is Message => m !== undefined
      );

      return {
        getMessages: [...prevMessages, newMessage],
      };
    },
  });

  return () => unsubscribe();
}, [chatId, subscribeToMore]);



  const handleSend = async () => {
  if (!messageText.trim() || !currentUser) return;

  await sendMessage({
  variables: { input: { chatId, text: messageText } },
  optimisticResponse: {
    sendMessage: {
      id: "temp-id-" + Math.random(),
      text: messageText,
      sender: {
        id: currentUser.id,
        username: currentUser.username,
        __typename: "User",
      },
      __typename: "Message",
    },
  },
 
});

  setMessageText("");
};

  if (loading) return <div className="p-4 text-black">Загрузка сообщений...</div>;

  const messages = data?.getMessages || [];

  return (
    <div className="flex-1 flex flex-col bg-gray-50 p-4 rounded-lg shadow-md h-full">
      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {messages.length === 0 ? (
  <div className="text-center text-gray-700 mt-10">
    Начните общение с другом — чат пуст
  </div>
) : (
  messages.map((msg, index) => (
    <div
      key={`${msg.id}-${index}`} // уникальный ключ
      className={`flex ${msg.sender.id === currentUser?.id ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`px-3 py-2 rounded-lg max-w-xs ${
          msg.sender.id === currentUser?.id
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-black"
        }`}
      >
        <p className="font-semibold text-sm">{msg.sender.username}</p>
        <p className="text-sm">{msg.text}</p>
      </div>
    </div>
  ))
)}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Введите сообщение..."
          className="flex-1 px-3 py-2 border rounded-lg text-black"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Отправить
        </button>
      </div>
    </div>
  );
}
