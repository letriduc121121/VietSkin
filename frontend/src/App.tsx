import { AuthProvider } from '@/app/providers/AuthProvider';
import AppRouter from '@/app/router';
import ChatbotWidget from '@/features/chatbot/components/ChatbotWidget';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <ChatbotWidget />
    </AuthProvider>
  );
}
