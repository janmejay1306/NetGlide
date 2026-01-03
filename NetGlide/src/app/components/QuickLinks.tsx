import { motion } from 'motion/react';
import { Search, Youtube, Github, MessageCircle, Twitter, BookOpen } from 'lucide-react';

const DEFAULT_LINKS = [
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: Search, color: 'from-orange-500 to-red-500' },
  { name: 'Wikipedia', url: 'https://wikipedia.org', icon: BookOpen, color: 'from-gray-600 to-gray-800' },
  { name: 'YouTube', url: 'https://youtube.com', icon: Youtube, color: 'from-red-500 to-red-700' },
  { name: 'GitHub', url: 'https://github.com', icon: Github, color: 'from-gray-700 to-black' },
  { name: 'Reddit', url: 'https://reddit.com', icon: MessageCircle, color: 'from-orange-600 to-red-600' },
  { name: 'X/Twitter', url: 'https://x.com', icon: Twitter, color: 'from-blue-400 to-blue-600' },
];

const PROFESSION_LINKS = {
  student: [
    { name: 'Khan Academy', url: 'https://khanacademy.org', icon: BookOpen, color: 'from-green-500 to-emerald-600' },
    { name: 'Coursera', url: 'https://coursera.org', icon: BookOpen, color: 'from-blue-500 to-blue-700' },
    { name: 'Stack Overflow', url: 'https://stackoverflow.com', icon: MessageCircle, color: 'from-orange-500 to-orange-700' },
  ],
  finance: [
    { name: 'Bloomberg', url: 'https://bloomberg.com', icon: BookOpen, color: 'from-yellow-600 to-orange-600' },
    { name: 'Yahoo Finance', url: 'https://finance.yahoo.com', icon: BookOpen, color: 'from-purple-600 to-indigo-600' },
    { name: 'MarketWatch', url: 'https://marketwatch.com', icon: BookOpen, color: 'from-green-600 to-teal-600' },
  ],
  fashion: [
    { name: 'Vogue', url: 'https://vogue.com', icon: BookOpen, color: 'from-pink-500 to-rose-600' },
    { name: 'Pinterest', url: 'https://pinterest.com', icon: Search, color: 'from-red-500 to-red-700' },
    { name: 'Instagram', url: 'https://instagram.com', icon: Search, color: 'from-pink-600 to-purple-600' },
  ],
  business: [
    { name: 'LinkedIn', url: 'https://linkedin.com', icon: Search, color: 'from-blue-600 to-blue-800' },
    { name: 'Forbes', url: 'https://forbes.com', icon: BookOpen, color: 'from-gray-700 to-gray-900' },
    { name: 'HBR', url: 'https://hbr.org', icon: BookOpen, color: 'from-blue-700 to-indigo-800' },
  ],
  consultant: [
    { name: 'McKinsey', url: 'https://mckinsey.com', icon: BookOpen, color: 'from-blue-600 to-cyan-700' },
    { name: 'Deloitte', url: 'https://deloitte.com', icon: BookOpen, color: 'from-green-600 to-teal-700' },
    { name: 'LinkedIn', url: 'https://linkedin.com', icon: Search, color: 'from-blue-600 to-blue-800' },
  ],
  tech: [
    { name: 'GitHub', url: 'https://github.com', icon: Github, color: 'from-gray-700 to-black' },
    { name: 'Stack Overflow', url: 'https://stackoverflow.com', icon: MessageCircle, color: 'from-orange-500 to-orange-700' },
    { name: 'Dev.to', url: 'https://dev.to', icon: BookOpen, color: 'from-purple-600 to-indigo-700' },
  ],
  government: [
    { name: 'USA.gov', url: 'https://usa.gov', icon: BookOpen, color: 'from-blue-700 to-blue-900' },
    { name: 'FedRAMP', url: 'https://fedramp.gov', icon: BookOpen, color: 'from-indigo-600 to-purple-700' },
    { name: 'Data.gov', url: 'https://data.gov', icon: Search, color: 'from-cyan-600 to-blue-700' },
  ],
  policy: [
    { name: 'Brookings', url: 'https://brookings.edu', icon: BookOpen, color: 'from-blue-700 to-indigo-800' },
    { name: 'RAND', url: 'https://rand.org', icon: BookOpen, color: 'from-gray-700 to-gray-900' },
    { name: 'Policy Forum', url: 'https://policyforum.net', icon: BookOpen, color: 'from-purple-600 to-pink-700' },
  ],
};

interface QuickLinksProps {
  profession?: string;
  onNavigate: (url: string) => void;
}

export function QuickLinks({ profession, onNavigate }: QuickLinksProps) {
  const professionLinks = profession && profession in PROFESSION_LINKS 
    ? PROFESSION_LINKS[profession as keyof typeof PROFESSION_LINKS] 
    : [];
  
  const links = [...DEFAULT_LINKS, ...professionLinks];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
      {links.map((link, idx) => (
        <motion.button
          key={link.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate(link.url)}
          className={`p-6 rounded-2xl bg-gradient-to-br ${link.color} shadow-lg hover:shadow-xl transition-all backdrop-blur-sm border border-white/10 group`}
        >
          <link.icon className="w-8 h-8 mx-auto mb-2 text-white group-hover:scale-110 transition-transform" />
          <p className="text-sm text-white">{link.name}</p>
        </motion.button>
      ))}
    </div>
  );
}
