import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, Code, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const AI_AGENTS = [
  { id: 'general', name: 'General Assistant', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
  { id: 'grammar', name: 'Grammar Expert', icon: FileText, color: 'from-blue-500 to-cyan-500' },
  { id: 'code', name: 'Code Helper', icon: Code, color: 'from-green-500 to-emerald-500' },
];

export function AIAssistant({ geminiApiKey }: { geminiApiKey?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('general');
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'model'; text: string; agent: string }>>([]);

  const currentAgent = AI_AGENTS.find((a) => a.id === selectedAgent) || AI_AGENTS[0];

  const handleSend = async () => {
    if (!message.trim()) return;

    if (!geminiApiKey) {
      setConversation((prev) => [
        ...prev,
        { role: 'user', text: message, agent: selectedAgent },
        { role: 'model', text: "Please enter your free Google Gemini API Key in the Settings -> AI Assistant tab to enable me!", agent: selectedAgent },
      ]);
      setMessage('');
      return;
    }

    const userMessage = { role: 'user' as const, text: message, agent: selectedAgent };
    const currentChat = [...conversation, userMessage];
    setConversation(currentChat);
    setMessage('');
    setIsTyping(true);

    try {
      // Build Google Gemini API payload from conversation history (only using messages for current agent)
      const agentHistory = currentChat.filter(msg => msg.agent === selectedAgent).slice(-10); // keep last 10
      const contents = agentHistory.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));

      // System instruction injection (prefix the user's latest message with it since Gemini Flash doesn't natively support system role via REST without dedicated system_instruction field)
      const systemPromptMap: Record<string, string> = {
        general: "You are a highly helpful, concise, and friendly AI assistant.",
        grammar: "You are a strict grammar expert. Correct the user's grammar, explain what was wrong, and rewrite it perfectly.",
        code: "You are a senior software engineer. Provide extremely concise, highly accurate code snippets without fluff.",
      };
      const systemInstruction = systemPromptMap[selectedAgent];
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            ...contents.slice(0, -1),
            { role: 'user', parts: [{ text: `SYSTEM INSTRUCTION: ${systemInstruction}\n\nUSER MESSAGE: ${contents[contents.length - 1].parts[0].text}` }] }
          ]
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
      
      setConversation((prev) => [
        ...prev,
        { role: 'model', text: aiText, agent: selectedAgent },
      ]);
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      setConversation((prev) => [
        ...prev,
        { role: 'model', text: `API Error: ${error.message}. Please check your API key in Settings.`, agent: selectedAgent },
      ]);
    } finally {
      setIsTyping(false);
    }
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
            className="fixed bottom-24 right-6 z-50 w-96 h-[500px] rounded-3xl bg-black/40 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className={`p-4 bg-gradient-to-r ${currentAgent.color} bg-opacity-20 backdrop-blur-md flex items-center justify-between border-b border-white/5`}>
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
              {conversation.filter(c => c.agent === selectedAgent).length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                  <currentAgent.icon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Start a conversation with {currentAgent.name}</p>
                </div>
              ) : (
                conversation.filter(c => c.agent === selectedAgent).map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 px-4 rounded-2xl whitespace-pre-wrap ${msg.role === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md'
                        : 'bg-white/10 text-gray-100 shadow-md backdrop-blur-md border border-white/5'
                        }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))
              )}
              {isTyping && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/5 flex gap-1.5 items-center">
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 rounded-full bg-gray-400" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 rounded-full bg-gray-400" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 rounded-full bg-gray-400" />
                  </div>
                </motion.div>
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
                  disabled={!message.trim() || isTyping}
                  className={`bg-gradient-to-r ${currentAgent.color} shadow-lg hover:shadow-xl transition-all disabled:opacity-50`}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {!geminiApiKey && (
                <p className="text-xs text-red-400 mt-2 text-center">Missing Gemini API Key. Click Settings ⚙️ to add.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
