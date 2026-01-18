
import React from 'react';
import { AppView } from '../types';
import { 
  BookOpen, 
  MessageSquareQuote, 
  Bell, 
  Users, 
  Music,
  Church,
  Home,
  FileBarChart,
  UserCheck,
  Briefcase,
  Cake,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onLogout }) => {
  const menuItems = [
    { id: AppView.CELL_REGISTRY, label: 'Células', icon: <Home size={20} /> },
    { id: AppView.CELL_MEMBERS, label: 'Membros', icon: <Users size={20} /> },
    { id: AppView.LEADERS, label: 'Líderes', icon: <UserCheck size={20} /> },
    { id: AppView.BIRTHDAYS, label: 'Aniversariantes', icon: <Cake size={20} /> },
    { id: AppView.MINISTRIES, label: 'Ministérios', icon: <Briefcase size={20} /> },
    { id: AppView.STUDIES, label: 'Estudos', icon: <BookOpen size={20} /> },
    { id: AppView.PASTOR_WORD, label: 'Palavra do Pastor', icon: <MessageSquareQuote size={20} /> },
    { id: AppView.ANNOUNCEMENTS, label: 'Avisos', icon: <Bell size={20} /> },
    { id: AppView.MUSIC_PLAYER, label: 'Louvor', icon: <Music size={20} /> },
    { id: AppView.REPORTS, label: 'Relatórios', icon: <FileBarChart size={20} /> },
  ];

  return (
    <aside className="w-64 bg-indigo-950 text-white h-screen fixed left-0 top-0 hidden md:flex flex-col shadow-2xl z-40">
      <div className="p-6 flex items-center gap-3 border-b border-indigo-900/50">
        <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
          <Church className="text-white" size={24} />
        </div>
        <h1 className="font-black text-xl tracking-tighter italic">Liderança IRV</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 mt-4 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
              currentView === item.id 
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 scale-[1.02]' 
                : 'text-indigo-200 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-bold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-indigo-900/50 space-y-4">
        <div className="bg-white/5 p-4 rounded-2xl text-[10px] text-indigo-300 uppercase tracking-[0.2em] font-black text-center">
          Gestão Pastoral
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 font-bold text-sm"
        >
          <LogOut size={18} />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
