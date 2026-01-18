
import React from 'react';
import { Member, Announcement } from '../types';
import { Users, Calendar, Megaphone, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  members: Member[];
  announcements: Announcement[];
}

const Dashboard: React.FC<DashboardProps> = ({ members, announcements }) => {
  const stats = [
    { label: 'Total Membros', value: members.length, icon: <Users className="text-blue-600" />, color: 'bg-blue-50' },
    { label: 'Avisos Ativos', value: announcements.length, icon: <Megaphone className="text-amber-600" />, color: 'bg-amber-50' },
    { label: 'Eventos Mês', value: 4, icon: <Calendar className="text-emerald-600" />, color: 'bg-emerald-50' },
    { label: 'Crescimento', value: '+12%', icon: <TrendingUp className="text-indigo-600" />, color: 'bg-indigo-50' },
  ];

  const chartData = [
    { name: 'Jan', members: 45 },
    { name: 'Fev', members: 52 },
    { name: 'Mar', members: 48 },
    { name: 'Abr', members: 61 },
    { name: 'Mai', members: members.length + 60 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className={`${stat.color} p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between`}>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
            <div className="p-3 bg-white rounded-xl shadow-sm">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6">Crescimento da Célula</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="members" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <h3 className="text-lg font-bold mb-4">Últimos Avisos</h3>
          <div className="space-y-4">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-4 rounded-xl border border-slate-50 bg-slate-50/50">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-indigo-600 uppercase">{ann.category}</span>
                  <span className="text-[10px] text-slate-400">{ann.date}</span>
                </div>
                <h4 className="font-semibold text-slate-900 text-sm">{ann.title}</h4>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
