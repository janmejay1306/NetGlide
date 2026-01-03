import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, ChevronDown, Sparkles, Code, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const AI_AGENTS = [
  { id: 'general', name: 'General Assistant', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
  { id: 'grammar', name: 'Grammar Expert', icon: FileText, color: 'from-blue-500 to-cyan-500' },
  { id: 'code', name: 'Code Helper', icon: Code, color: 'from-green-500 to-emerald-500' },
];

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('general');
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'ai'; text: string; agent: string }>>([]);

  const currentAgent = AI_AGENTS.find((a) => a.id === selectedAgent) || AI_AGENTS[0];

  const handleSend = () => {
    if (!message.trim()) return;

    const userMessage = { role: 'user' as const, text: message, agent: selectedAgent };
    setConversation((prev) => [...prev, userMessage]);

    // Simulated AI response
    setTimeout(() => {
      const responses = {
        general: "I'm here to help with general questions and tasks!",
        grammar: "Let me check that grammar for you...",
        code: "I can help you debug and write better code!",
      };
      setConversation((prev) => [
        ...prev,
        { role: 'ai', text: responses[selectedAgent as keyof typeof responses], agent: selectedAgent },
      ]);
    }, 500);

    setMessage('');
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-r ${currentAgent.color} shadow-lg hover:shadow-xl transition-shadow`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Bot className="w-6 h-6 text-white" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-96 h-[500px] rounded-2xl bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-purple-500/30 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className={`p-4 bg-gradient-to-r ${currentAgent.color} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <currentAgent.icon className="w-5 h-5 text-white" />
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="bg-white/20 border-white/30 text-white w-48 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-purple-500/30 text-white">
                    {AI_AGENTS.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id} className="hover:bg-white/10">
                        <div className="flex items-center gap-2">
                          <agent.icon className="w-4 h-4" />
                          {agent.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Conversation */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {conversation.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                  <currentAgent.icon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Start a conversation with {currentAgent.name}</p>
                </div>
              ) : (
                conversation.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                          : 'bg-white/10 text-gray-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-black/20">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={`Ask ${currentAgent.name}...`}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
                <Button
                  onClick={handleSend}
                  className={`bg-gradient-to-r ${currentAgent.color}`}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
