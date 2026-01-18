import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppView, Member, Announcement, Study, Cell, Track, PastorWord, Leader, Ministry } from './types';
import Sidebar from './components/Sidebar';
import { expandStudy } from './geminiService';
import { auth, db } from './firebaseConfig'; 
import { 
  Plus, Trash2, BookOpen, UserPlus, 
  Users, Music, Edit3, Download, FileText, Home, Save, Clock, MapPin, List, AlertTriangle, Video, Bell, ExternalLink, Youtube, X, Eye, MessageSquareQuote, FileSpreadsheet, FileBarChart, Filter, UserCheck, Briefcase,
  Sparkles, Loader2, CheckCircle, Radio, Cake, Calendar, MessageCircle, Upload, Church, Lock, LogIn, CloudOff
} from 'lucide-react';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  // --- AUTHENTICATION STATE ---
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Monitora o estado da autenticação
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser: any) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      console.error("Login error:", error);
      setLoginError("Credenciais inválidas. Verifique seu e-mail e senha.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // --- APP LOGIC & STATE ---
  const [currentView, setCurrentView] = useState<AppView>(AppView.CELL_REGISTRY);
  
  // Estados de Dados (Iniciando vazios, pois virão do Firebase)
  const [members, setMembers] = useState<Member[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [pastorWords, setPastorWords] = useState<PastorWord[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Estados de UI
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ view: AppView, id: string } | null>(null);
  const [viewingWord, setViewingWord] = useState<PastorWord | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'alert' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado temporário para arquivo PDF
  const [tempPdfFile, setTempPdfFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtros
  const [memberFilterCell, setMemberFilterCell] = useState<string>('all');
  const [leaderFilterMinistry, setLeaderFilterMinistry] = useState<string>('all');
  const [announcementFilterDate, setAnnouncementFilterDate] = useState<string>('');

  // Estados de Campos Pastorais
  const [pastorTheme, setPastorTheme] = useState('');
  const [pastorContent, setPastorContent] = useState('');

  // --- FIREBASE REALTIME LISTENERS ---
  useEffect(() => {
    if (!user) {
        setMembers([]); setCells([]); setAnnouncements([]); setStudies([]); 
        setTracks([]); setPastorWords([]); setLeaders([]); setMinistries([]);
        return;
    }

    setLoadingData(true);

    // Função auxiliar para criar listeners
    const subscribe = (collection: string, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
        return db.collection(collection).onSnapshot((snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setter(data);
        }, (error) => {
            console.error(`Erro ao carregar ${collection}:`, error);
            setNotification({ title: 'Erro de Conexão', message: `Falha ao sincronizar ${collection}.`, type: 'alert' });
        });
    };

    const unsubs = [
        subscribe('members', setMembers),
        subscribe('cells', setCells),
        subscribe('announcements', setAnnouncements),
        subscribe('studies', setStudies),
        subscribe('tracks', setTracks),
        subscribe('pastorWords', setPastorWords),
        subscribe('leaders', setLeaders),
        subscribe('ministries', setMinistries)
    ];

    setLoadingData(false);

    // Cleanup function para desligar os listeners quando o componente desmontar ou user mudar
    return () => {
        unsubs.forEach(unsub => unsub());
    };
  }, [user]);

  // --- NOTIFICAÇÃO DE ANIVERSARIANTES ---
  useEffect(() => {
    if (!user || loadingData) return; 

    const birthdayCheckTimer = setTimeout(() => {
      const today = new Date();
      const currentMonth = today.getMonth(); 
      const currentDay = today.getDate(); 

      const isBirthdayToday = (dateStr: string) => {
        if (!dateStr) return false;
        const parts = dateStr.split('-'); 
        if (parts.length !== 3) return false;
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return month === currentMonth && day === currentDay;
      };

      const birthdayFolks = [
        ...members.filter(m => isBirthdayToday(m.birthday)).map(m => m.name),
        ...leaders.filter(l => isBirthdayToday(l.birthday)).map(l => l.name)
      ];

      if (birthdayFolks.length > 0) {
        // Verifica se já mostramos hoje (opcional, aqui simplificado)
        const names = birthdayFolks.map(name => name.split(' ')[0]).join(', '); 
        setNotification({
          title: '🎉 Aniversariantes do Dia!',
          message: `Hoje é dia de festa! Parabéns para: ${names}.`,
          type: 'success'
        });
      }
    }, 3000); // Espera 3s após carga para verificar

    return () => clearTimeout(birthdayCheckTimer);
  }, [members, leaders, user, loadingData]);

  // Auto-fechar notificação
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000); 
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // --- HELPER FUNCTIONS ---
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return dateString;
  };

  const getCollectionName = (view: AppView): string => {
    switch (view) {
        case AppView.CELL_MEMBERS: return 'members';
        case AppView.CELL_REGISTRY: return 'cells';
        case AppView.LEADERS: return 'leaders';
        case AppView.MINISTRIES: return 'ministries';
        case AppView.STUDIES: return 'studies';
        case AppView.ANNOUNCEMENTS: return 'announcements';
        case AppView.MUSIC_PLAYER: return 'tracks';
        case AppView.PASTOR_WORD: return 'pastorWords';
        default: return '';
    }
  };

  const filteredMembers = useMemo(() => {
    if (memberFilterCell === 'all') return members;
    return members.filter(m => m.cellId === memberFilterCell);
  }, [members, memberFilterCell]);

  const filteredLeaders = useMemo(() => {
    if (leaderFilterMinistry === 'all') return leaders;
    return leaders.filter(l => l.ministryId === leaderFilterMinistry);
  }, [leaders, leaderFilterMinistry]);

  const filteredAnnouncements = useMemo(() => {
    if (!announcementFilterDate) return announcements;
    const parts = announcementFilterDate.split('-');
    if (parts.length === 3) {
        const [year, month, day] = parts;
        const searchString = `${day}/${month}/${year}`;
        return announcements.filter(a => a.date === searchString);
    }
    return announcements;
  }, [announcements, announcementFilterDate]);

  const exportToCSV = (type: 'members' | 'cells' | 'leaders' | 'ministries' | 'announcements') => {
    let csvContent = "";
    if (type === 'members') {
      csvContent = "Nome;Telefone;Aniversario;Celula;Funcao\n";
      members.forEach(m => {
        const cellName = cells.find(c => c.id === m.cellId)?.name || 'N/A';
        csvContent += `${m.name};${m.phone};${formatDate(m.birthday)};${cellName};${m.role}\n`;
      });
    } else if (type === 'cells') {
      csvContent = "Nome;Lider;Co-Lider;Endereco;Dia;Hora;Tipo\n";
      cells.forEach(c => {
        csvContent += `${c.name};${c.leader};${c.coLeader || ''};${c.address};${c.meetingDay};${c.meetingTime};${c.meetingType}\n`;
      });
    } else if (type === 'leaders') {
      csvContent = "Nome;Telefone;Aniversario;Ministerio;Funcao\n";
      leaders.forEach(l => {
        const ministryName = ministries.find(m => m.id === l.ministryId)?.name || 'N/A';
        csvContent += `${l.name};${l.phone};${formatDate(l.birthday)};${ministryName};${l.role}\n`;
      });
    } else if (type === 'ministries') {
      csvContent = "Nome;Lider Responsavel;Descricao\n";
      ministries.forEach(m => {
        const leaderName = leaders.find(l => l.id === m.leaderId)?.name || 'NÃO DEFINIDO';
        csvContent += `${m.name};${leaderName};${m.description}\n`;
      });
    } else if (type === 'announcements') {
      csvContent = "Data;Categoria;Titulo;Conteudo\n";
      announcements.forEach(a => {
        const safeContent = a.content ? a.content.replace(/\n/g, ' ') : '';
        csvContent += `${a.date};${a.category};${a.title};${safeContent}\n`;
      });
    }

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_${type}_irv.csv`);
    link.click();
    setNotification({ title: 'Download Iniciado', message: `Relatório de ${type} gerado.`, type: 'success' });
  };

  const printReport = (type: 'members' | 'cells' | 'leaders' | 'ministries' | 'announcements') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<html><body><h1>Relatório</h1><p>Funcionalidade de impressão simplificada para demonstração.</p></body></html>`); 
    printWindow.document.close();
    printWindow.print();
  };

  const handleSave = async (view: AppView, data: any) => {
    const collectionName = getCollectionName(view);
    if (!collectionName) return;

    setIsSaving(true);
    try {
        let finalData = { ...data };

        // Tratamento especial para Estudos e PDFs
        if (view === AppView.STUDIES) {
          if (tempPdfFile) {
            // Nota: Sem Firebase Storage, não podemos persistir o arquivo real na nuvem.
            // Aqui estamos criando uma URL local apenas para o funcionamento na sessão atual.
            // Em produção real, você faria upload para o Storage e salvaria a URL pública.
            const pdfUrl = URL.createObjectURL(tempPdfFile);
            finalData = { ...finalData, pdfUrl, pdfName: tempPdfFile.name };
          } else if (editingId) {
             // Mantém os dados antigos se não houve novo upload
             const oldStudy = studies.find(s => s.id === editingId);
             if (oldStudy) {
               finalData.pdfUrl = oldStudy.pdfUrl || '';
               finalData.pdfName = oldStudy.pdfName || '';
             }
          }
        }

        if (editingId) {
            await db.collection(collectionName).doc(editingId).update(finalData);
            setNotification({ title: 'Atualizado', message: 'Registro salvo com sucesso.', type: 'success' });
        } else {
            // Adiciona timestamp de criação se necessário, ou usa ID automático
            await db.collection(collectionName).add(finalData);
            setNotification({ title: 'Criado', message: 'Novo registro adicionado.', type: 'success' });
        }

        setEditingId(null);
        setIsAdding(false);
        setTempPdfFile(null);
    } catch (error) {
        console.error("Erro ao salvar:", error);
        setNotification({ title: 'Erro', message: 'Não foi possível salvar no banco de dados.', type: 'alert' });
    } finally {
        setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const { view, id } = itemToDelete;
    const collectionName = getCollectionName(view);

    if (collectionName) {
        try {
            await db.collection(collectionName).doc(id).delete();
            setNotification({ title: 'Removido', message: 'Registro excluído do banco de dados.', type: 'alert' });
        } catch (error) {
            console.error("Erro ao deletar:", error);
            setNotification({ title: 'Erro', message: 'Falha ao excluir o registro.', type: 'alert' });
        }
    }
    setItemToDelete(null);
  };

  const renderContent = () => {
    const commonFormClass = "bg-white p-6 rounded-3xl shadow-xl border-2 border-indigo-100 animate-in zoom-in-95 mb-8";
    const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-indigo-400 text-sm transition-all";
    const labelClass = "block text-xs font-black text-slate-400 uppercase mb-2 tracking-[0.1em]";

    switch (currentView) {
      case AppView.CELL_REGISTRY: return (
          <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">Células IRV</h2><p className="text-slate-500 font-medium">Gestão estratégica das comunidades.</p></div>
              <button type="button" onClick={() => { setEditingId(null); setIsAdding(true); }} className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 shadow-xl transition-all w-full md:w-auto justify-center"><Plus size={20} /> Nova Célula</button>
            </header>
            {(isAdding || editingId) && (<form className={commonFormClass} onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); handleSave(AppView.CELL_REGISTRY, Object.fromEntries(formData)); }}> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div> <label className={labelClass}>Nome da Célula</label> <input name="name" required className={inputClass} defaultValue={cells.find(c => c.id === editingId)?.name} /> </div> <div> <label className={labelClass}>Líder</label> <input name="leader" required className={inputClass} defaultValue={cells.find(c => c.id === editingId)?.leader} /> </div> <div> <label className={labelClass}>Co-Líder</label> <input name="coLeader" className={inputClass} defaultValue={cells.find(c => c.id === editingId)?.coLeader} placeholder="Opcional" /> </div> <div> <label className={labelClass}>Endereço ou Link Digital</label> <input name="address" required className={inputClass} defaultValue={cells.find(c => c.id === editingId)?.address} /> </div> <div> <label className={labelClass}>Dia</label> <select name="meetingDay" className={inputClass} defaultValue={cells.find(c => c.id === editingId)?.meetingDay}> <option>Segunda-feira</option> <option>Terça-feira</option> <option>Quarta-feira</option> <option>Quinta-feira</option> <option>Sexta-feira</option> <option>Sábado</option> <option>Domingo</option> </select> </div> <div> <label className={labelClass}>Hora</label> <input name="meetingTime" type="time" required className={inputClass} defaultValue={cells.find(c => c.id === editingId)?.meetingTime} /> </div> <div> <label className={labelClass}>Modalidade</label> <select name="meetingType" className={inputClass} defaultValue={cells.find(c => c.id === editingId)?.meetingType}> <option value="Presencial">Presencial</option> <option value="Online">Online</option> </select> </div> </div> <div className="flex justify-end gap-3 mt-10"> <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-6 py-3.5 font-bold text-slate-400">Cancelar</button> <button type="submit" disabled={isSaving} className="bg-indigo-600 text-white px-10 py-3.5 rounded-2xl font-black shadow-lg flex items-center gap-2"> {isSaving && <Loader2 className="animate-spin" size={16}/>} Salvar Célula </button> </div> </form>)}
            <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm"> <div className="w-full"> <table className="w-full text-left border-collapse"> <thead className="bg-slate-50 border-b border-slate-100"> <tr> <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Célula</th> <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Liderança</th> <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Local/Horário</th> <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Ações</th> </tr> </thead> <tbody className="divide-y divide-slate-50"> {cells.length === 0 ? ( <tr><td colSpan={4} className="p-10 text-center text-slate-300 font-black italic">Nenhuma célula cadastrada.</td></tr> ) : ( cells.map(cell => ( <tr key={cell.id} className="hover:bg-slate-50/50 transition-colors"> <td className="px-4 py-3 align-top"> <div className="font-black text-slate-900 text-sm">{cell.name}</div> <span className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide inline-flex items-center gap-1 w-fit ${cell.meetingType === 'Online' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}> {cell.meetingType === 'Online' ? <Video size={10}/> : <Home size={10}/>} {cell.meetingType} </span> </td> <td className="px-4 py-3 align-top"> <div className="text-xs font-bold text-indigo-600">{cell.leader}</div> {cell.coLeader && <div className="text-xs font-medium text-slate-400 mt-0.5">Co: {cell.coLeader}</div>} </td> <td className="px-4 py-3 align-top"> <div className="flex flex-col gap-1 text-xs font-medium text-slate-500"> <div className="flex items-start gap-1"><MapPin size={12} className="text-slate-400 shrink-0 mt-0.5"/> <span className="whitespace-normal leading-tight">{cell.address}</span></div> <div className="flex items-center gap-1"><Clock size={12} className="text-slate-400 shrink-0"/> <span>{cell.meetingDay} às {cell.meetingTime}</span></div> </div> </td> <td className="px-4 py-3 align-top text-right"> <div className="flex justify-end gap-1"> <button type="button" onClick={() => setEditingId(cell.id)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Edit3 size={16}/></button> <button type="button" onClick={() => setItemToDelete({ view: AppView.CELL_REGISTRY, id: cell.id })} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button> </div> </td> </tr> )) )} </tbody> </table> </div> </div>
          </div>
        );
      case AppView.CELL_MEMBERS:
        return ( <div className="space-y-6"> <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"> <div> <h2 className="text-3xl font-black text-slate-900">Membros da Célula</h2> <p className="text-slate-500 font-medium">Nossa família em crescimento espiritual.</p> </div> <div className="flex gap-2 w-full md:w-auto"> <div className="relative flex-1 md:w-64"> <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/> <select value={memberFilterCell} onChange={(e) => setMemberFilterCell(e.target.value)} className={`${inputClass} !pl-10 !py-2.5 !text-xs !font-bold !uppercase`} > <option value="all">Todas as Células</option> {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)} </select> </div> <button type="button" onClick={() => { setEditingId(null); setIsAdding(true); }} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-700 shadow-xl transition-all shrink-0"> <UserPlus size={20} /> Novo Membro </button> </div> </header> <div className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex justify-between items-center"> <span>Filtro Ativo: {memberFilterCell === 'all' ? 'Todos os Membros' : cells.find(c => c.id === memberFilterCell)?.name}</span> <span className="opacity-60">{filteredMembers.length} registros</span> </div> {(isAdding || editingId) && (<form className={`${commonFormClass} border-emerald-100`} onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); handleSave(AppView.CELL_MEMBERS, { ...Object.fromEntries(formData), joinedAt: editingId ? (members.find(m => m.id === editingId)?.joinedAt) : new Date().toLocaleDateString() }); }}> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div> <label className={labelClass}>Nome do Membro</label> <input name="name" required className={inputClass} defaultValue={members.find(m => m.id === editingId)?.name} /> </div> <div> <label className={labelClass}>Telefone</label> <input name="phone" required className={inputClass} defaultValue={members.find(m => m.id === editingId)?.phone} /> </div> <div> <label className={labelClass}>Aniversário</label> <input name="birthday" type="date" required className={inputClass} defaultValue={members.find(m => m.id === editingId)?.birthday} /> </div> <div> <label className={labelClass}>Vínculo de Célula</label> <select name="cellId" className={inputClass} defaultValue={members.find(m => m.id === editingId)?.cellId}> {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)} </select> </div> <div> <label className={labelClass}>Função / Papel</label> <select name="role" className={inputClass} defaultValue={members.find(m => m.id === editingId)?.role}> <option value="Membro">Membro</option> <option value="Líder">Líder de Célula</option> <option value="Co-Líder">Auxiliar / Co-Líder</option> <option value="Visitante">Visitante</option> </select> </div> </div> <div className="flex justify-end gap-3 mt-10"> <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-6 py-3.5 font-bold text-slate-400">Cancelar</button> <button type="submit" disabled={isSaving} className="bg-emerald-600 text-white px-10 py-3.5 rounded-2xl font-black"> {isSaving ? 'Salvando...' : 'Salvar Membro'} </button> </div> </form>)} <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm"> <div className="w-full"> <table className="w-full text-left"> <thead className="bg-slate-50 border-b border-slate-100"> <tr> <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Nome do Membro</th> <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Célula e Cargo</th> <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Ações</th> </tr> </thead> <tbody className="divide-y divide-slate-50"> {filteredMembers.length === 0 ? ( <tr><td colSpan={3} className="p-20 text-center text-slate-300 font-black italic uppercase">Nenhum registro nesta categoria</td></tr> ) : ( filteredMembers.map(member => ( <tr key={member.id} className="hover:bg-slate-50/50 transition-colors"> <td className="px-8 py-6"> <div className="font-black text-slate-900 text-lg">{member.name}</div> <div className="text-[11px] text-slate-400 flex gap-4 mt-1 font-bold"> <span>📱 {member.phone}</span> <span>🎂 {formatDate(member.birthday)}</span> </div> </td> <td className="px-8 py-6"> <div className="flex flex-col gap-1.5"> <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl w-fit"> {cells.find(c => c.id === member.cellId)?.name || 'N/A'} </span> <span className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">{member.role}</span> </div> </td> <td className="px-8 py-6 text-right"> <div className="flex justify-end gap-3"> <button type="button" onClick={() => setEditingId(member.id)} className="p-3 text-slate-300 hover:text-indigo-600 transition-colors"><Edit3 size={18}/></button> <button type="button" onClick={() => setItemToDelete({ view: AppView.CELL_MEMBERS, id: member.id })} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button> </div> </td> </tr> )) )} </tbody> </table> </div> </div> </div> );
      case AppView.LEADERS:
        return ( <div className="space-y-6"> <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"> <div> <h2 className="text-3xl font-black text-slate-900 tracking-tight">Cadastro de Líderes</h2> <p className="text-slate-500 font-medium">Base central de oficiais da igreja.</p> </div> <button type="button" onClick={() => { setEditingId(null); setIsAdding(true); }} className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-indigo-700 transition-all"> <Plus size={20} /> Novo Líder </button> </header> {(isAdding || editingId) && (<form className={commonFormClass} onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); handleSave(AppView.LEADERS, { ...Object.fromEntries(formData), joinedAt: editingId ? (leaders.find(l => l.id === editingId)?.joinedAt) : new Date().toLocaleDateString() }); }}> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div> <label className={labelClass}>Nome Completo</label> <input name="name" required className={inputClass} defaultValue={leaders.find(l => l.id === editingId)?.name} /> </div> <div> <label className={labelClass}>Telefone</label> <input name="phone" required className={inputClass} defaultValue={leaders.find(l => l.id === editingId)?.phone} /> </div> <div> <label className={labelClass}>Data de Aniversário</label> <input name="birthday" type="date" required className={inputClass} defaultValue={leaders.find(l => l.id === editingId)?.birthday} /> </div> <div className="md:col-span-1"> <label className={labelClass}>Função Hierárquica</label> <input name="role" required className={inputClass} defaultValue={leaders.find(l => l.id === editingId)?.role} placeholder="Ex: Pastor, Diácono, Presbítero..." /> </div> </div> <div className="flex justify-end gap-3 mt-10"> <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-6 py-3.5 font-bold text-slate-400">Cancelar</button> <button type="submit" disabled={isSaving} className="bg-indigo-600 text-white px-10 py-3.5 rounded-2xl font-black shadow-lg"> {isSaving ? 'Salvando...' : 'Salvar Líder'} </button> </div> </form>)} <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm"> <div className="w-full"> <table className="w-full text-left"> <thead className="bg-slate-50 border-b border-slate-100"> <tr> <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Líder</th> <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Informações de Contato</th> <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Ações</th> </tr> </thead> <tbody className="divide-y divide-slate-50"> {leaders.length === 0 ? ( <tr><td colSpan={3} className="p-20 text-center text-slate-300 font-black italic">Nenhum líder cadastrado no sistema.</td></tr> ) : ( leaders.map(l => ( <tr key={l.id} className="hover:bg-slate-50/50 transition-colors"> <td className="px-8 py-6"> <div className="font-black text-slate-900 text-lg">{l.name}</div> <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{l.role}</span> </td> <td className="px-8 py-6"> <div className="text-xs text-slate-400 font-bold flex flex-col gap-1"> <span className="flex items-center gap-2">📱 {l.phone}</span> <span className="flex items-center gap-2">🎂 {formatDate(l.birthday)}</span> </div> </td> <td className="px-8 py-6 text-right"> <div className="flex justify-end gap-3"> <button type="button" onClick={() => setEditingId(l.id)} className="p-3 text-slate-300 hover:text-indigo-600 transition-colors"><Edit3 size={18}/></button> <button type="button" onClick={() => setItemToDelete({ view: AppView.LEADERS, id: l.id })} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button> </div> </td> </tr> )) )} </tbody> </table> </div> </div> </div> );
      case AppView.MINISTRIES:
        return ( <div className="space-y-6"> <header className="flex justify-between items-center mb-8"> <div> <h2 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Ministérios</h2> <p className="text-slate-500 font-medium">Defina departamentos e atribua líderes oficiais.</p> </div> <button type="button" onClick={() => { setEditingId(null); setIsAdding(true); }} className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-indigo-700 transition-all"> <Plus size={20} /> Adicionar Ministério </button> </header> {(isAdding || editingId) && (<form className={commonFormClass} onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); handleSave(AppView.MINISTRIES, Object.fromEntries(formData)); }}> <div className="space-y-6"> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div> <label className={labelClass}>Nome do Ministério</label> <input name="name" required className={inputClass} defaultValue={ministries.find(m => m.id === editingId)?.name} placeholder="Ex: Louvor, Mídia, Infantil..." /> </div> <div> <label className={labelClass}>Líder Responsável</label> <select name="leaderId" className={inputClass} defaultValue={ministries.find(m => m.id === editingId)?.leaderId}> <option value="">Selecione um líder cadastrado...</option> {leaders.length === 0 ? ( <option value="" disabled>Nenhum líder cadastrado</option> ) : ( leaders.map(l => ( <option key={l.id} value={l.id}>{l.name}</option> )) )} </select> </div> </div> <div> <label className={labelClass}>Descrição</label> <textarea name="description" required className={`${inputClass} h-32 rounded-3xl`} defaultValue={ministries.find(m => m.id === editingId)?.description} placeholder="Metas do departamento..."></textarea> </div> </div> <div className="flex justify-end gap-3 mt-10"> <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-6 py-3.5 font-bold text-slate-400">Cancelar</button> <button type="submit" disabled={isSaving} className="bg-indigo-600 text-white px-10 py-3.5 rounded-2xl font-black shadow-lg"> {isSaving ? 'Salvando...' : 'Salvar Ministério'} </button> </div> </form>)} <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm"> <table className="w-full text-left"> <thead className="bg-slate-50 border-b border-slate-100"> <tr> <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Departamento</th> <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Líder Responsável</th> <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Gerenciar</th> </tr> </thead> <tbody className="divide-y divide-slate-50"> {ministries.length === 0 ? ( <tr><td colSpan={3} className="p-20 text-center text-slate-300 font-black italic uppercase">Nenhum ministério configurado</td></tr> ) : ( ministries.map(m => ( <tr key={m.id} className="hover:bg-slate-50/50 transition-colors"> <td className="px-8 py-6"> <div className="font-black text-slate-900 text-lg flex items-center gap-3"> <Briefcase className="text-indigo-600" size={18} /> {m.name} </div> </td> <td className="px-8 py-6"> <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 w-fit px-4 py-1.5 rounded-full"> <UserCheck size={14} /> {leaders.find(l => l.id === m.leaderId)?.name || <span className="text-slate-300">LÍDER NÃO VINCULADO</span>} </div> </td> <td className="px-8 py-6 text-right"> <div className="flex justify-end gap-3"> <button type="button" onClick={() => setEditingId(m.id)} className="p-3 text-slate-300 hover:text-indigo-600 transition-colors"><Edit3 size={18}/></button> <button type="button" onClick={() => setItemToDelete({ view: AppView.MINISTRIES, id: m.id })} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button> </div> </td> </tr> )) )} </tbody> </table> </div> </div> );
      case AppView.BIRTHDAYS: {
         const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
         const today = new Date();
         const currentMonth = today.getMonth();
         const currentDay = today.getDate();

         const getDayFromStr = (dateStr: string) => {
           if (!dateStr) return 0;
           const parts = dateStr.split('-');
           return parseInt(parts[2], 10);
         };

         const allBirthdays = [
           ...members.map(m => ({ ...m, type: 'Membro', origin: cells.find(c => c.id === m.cellId)?.name || 'Sem Célula' })),
           ...leaders.map(l => ({ ...l, type: 'Líder', origin: ministries.find(min => min.id === l.ministryId)?.name || 'Sem Ministério' }))
         ].filter(p => {
           if (!p.birthday) return false;
           const parts = p.birthday.split('-');
           if(parts.length !== 3) return false;
           const month = parseInt(parts[1], 10) - 1;
           return month === currentMonth;
         }).sort((a, b) => getDayFromStr(a.birthday) - getDayFromStr(b.birthday));

         return ( <div className="space-y-8"> <header className="text-center mb-10"> <div className="inline-flex items-center justify-center p-4 bg-pink-50 text-pink-500 rounded-full mb-4 shadow-lg shadow-pink-100"> <Cake size={40} /> </div> <h2 className="text-4xl font-black text-slate-900 tracking-tight">Aniversariantes de {monthNames[currentMonth]}</h2> <p className="text-slate-500 font-medium mt-2">Celebre a vida da nossa comunidade!</p> </header> <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm"> <div className="w-full"> <table className="w-full text-left"> <thead className="bg-slate-50 border-b border-slate-100"> <tr> <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center w-24">Dia</th> <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Aniversariante</th> <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Tipo</th> <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Ação</th> </tr> </thead> <tbody className="divide-y divide-slate-50"> {allBirthdays.length === 0 ? ( <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-black italic uppercase">Nenhum aniversariante neste mês</td></tr> ) : ( allBirthdays.map((person, index) => { const day = getDayFromStr(person.birthday); const isToday = day === currentDay; return ( <tr key={`${person.id}-${index}`} className={`transition-colors ${isToday ? 'bg-pink-50/50' : 'hover:bg-slate-50/50'}`}> <td className="px-8 py-6 text-center"> <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black mx-auto ${isToday ? 'bg-pink-500 text-white shadow-lg shadow-pink-300' : 'bg-slate-100 text-slate-500'}`}> {day} </div> </td> <td className="px-8 py-6"> <div className="font-black text-slate-900 text-lg">{person.name}</div> {isToday && <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest animate-pulse">É Hoje! 🎉</span>} </td> <td className="px-8 py-6"> <div className="text-sm font-medium text-slate-500">{person.type} • {person.origin}</div> </td> <td className="px-8 py-6 text-right"> <a href={`https://wa.me/55${person.phone.replace(/\D/g, '')}?text=Olá ${person.name}, parabéns pelo seu aniversário!`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-emerald-100 transition-colors" > <MessageCircle size={16} /> Parabenizar </a> </td> </tr> ); }) )} </tbody> </table> </div> </div> </div> );
      }
      case AppView.REPORTS:
         const reportTypes2 = [ { id: 'members', label: 'Membros', desc: 'Lista completa de membros e visitantes', icon: <Users size={20}/> }, { id: 'cells', label: 'Células', desc: 'Registro de encontros e locais', icon: <Home size={20}/> }, { id: 'leaders', label: 'Líderes', desc: 'Cadastro de liderança oficial', icon: <UserCheck size={20}/> }, { id: 'ministries', label: 'Ministérios', desc: 'Departamentos e responsáveis', icon: <Briefcase size={20}/> }, { id: 'announcements', label: 'Avisos', desc: 'Histórico de avisos e eventos', icon: <Bell size={20}/> } ];
         return ( <div className="space-y-8"> <header className="text-center"> <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Relatórios da Liderança</h2> <p className="text-slate-500 font-medium">Dados consolidados.</p> </header> <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm"> <table className="w-full text-left"> <thead className="bg-slate-50 border-b border-slate-100"> <tr> <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Tipo</th> <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Descrição</th> <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Ações</th> </tr> </thead> <tbody className="divide-y divide-slate-50"> {reportTypes2.map((report) => ( <tr key={report.id} className="hover:bg-slate-50/50 transition-colors"> <td className="px-8 py-6"> <div className="flex items-center gap-4"> <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">{report.icon}</div> <span className="font-black text-slate-900 text-lg">{report.label}</span> </div> </td> <td className="px-8 py-6"><span className="text-sm font-medium text-slate-500">{report.desc}</span></td> <td className="px-4 py-6 text-right whitespace-nowrap"> <div className="flex justify-end gap-2"> <button onClick={() => exportToCSV(report.id as any)} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 transition-colors text-xs uppercase whitespace-nowrap"><FileSpreadsheet size={16}/> Excel</button> <button onClick={() => printReport(report.id as any)} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors text-xs uppercase whitespace-nowrap"><FileBarChart size={16}/> PDF</button> </div> </td> </tr> ))} </tbody> </table> </div> </div> );
      case AppView.STUDIES:
        return ( <div className="space-y-6"> <header className="flex justify-between items-center mb-8"> <div> <h2 className="text-3xl font-black text-slate-900 tracking-tight">Estudos Bíblicos</h2> <p className="text-slate-500 font-medium">Material de apoio em PDF.</p> </div> <button type="button" onClick={() => { setEditingId(null); setIsAdding(true); setTempPdfFile(null); }} className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-indigo-700 transition-all"> <Plus size={20} /> Novo Estudo </button> </header> {(isAdding || editingId) && (<form className={commonFormClass} onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); handleSave(AppView.STUDIES, Object.fromEntries(formData)); }}> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div> <label className={labelClass}>Título do Estudo</label> <input name="title" required className={inputClass} defaultValue={studies.find(s => s.id === editingId)?.title} /> </div> <div> <label className={labelClass}>Data do Estudo</label> <input name="date" type="date" required className={inputClass} defaultValue={studies.find(s => s.id === editingId)?.date} /> </div> <div> <label className={labelClass}>Referência Bíblica</label> <input name="reference" required className={inputClass} defaultValue={studies.find(s => s.id === editingId)?.reference} placeholder="Ex: João 3:16" /> </div> <div> <label className={labelClass}>Sugestão de Louvor</label> <input name="suggestedPraise" className={inputClass} defaultValue={studies.find(s => s.id === editingId)?.suggestedPraise} placeholder="Ex: Bondade de Deus" /> </div> <div className="md:col-span-2"> <label className={labelClass}>Arquivo PDF (Roteiro)</label> <div className="relative"> <input type="file" accept="application/pdf" ref={fileInputRef} onChange={(e) => { if (e.target.files && e.target.files[0]) { setTempPdfFile(e.target.files[0]); } }} className="hidden" id="pdf-upload" /> <label htmlFor="pdf-upload" className="w-full bg-slate-50 border border-slate-200 border-dashed rounded-2xl px-4 py-3.5 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors text-sm font-medium text-slate-500"> <Upload size={18} /> {tempPdfFile ? tempPdfFile.name : (editingId && studies.find(s => s.id === editingId)?.pdfName) ? studies.find(s => s.id === editingId)?.pdfName : "Clique para selecionar PDF (Salvo Localmente)"} </label> </div> <p className="text-[10px] text-slate-400 mt-2 italic">* O PDF ficará disponível apenas nesta sessão. Para persistência global, é necessário ativar o Storage.</p> </div> </div> <div className="flex justify-end gap-3 mt-10"> <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); setTempPdfFile(null); }} className="px-6 py-3.5 font-bold text-slate-400">Cancelar</button> <button type="submit" disabled={isSaving} className="bg-indigo-600 text-white px-10 py-3.5 rounded-2xl font-black shadow-lg"> {isSaving ? 'Salvando...' : 'Salvar Estudo'} </button> </div> </form>)} <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm"> <div className="w-full"> <table className="w-full text-left border-collapse"> <thead className="bg-slate-50 border-b border-slate-100"> <tr> <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest w-24">Data</th> <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Estudo</th> <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Ref.</th> <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Louvor</th> <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Ações</th> </tr> </thead> <tbody className="divide-y divide-slate-50"> {studies.length === 0 ? ( <tr><td colSpan={5} className="p-10 text-center text-slate-300 font-black italic">Nenhum estudo cadastrado.</td></tr> ) : ( studies.map(study => ( <tr key={study.id} className="hover:bg-slate-50/50 transition-colors"> <td className="px-4 py-3 align-top"> <span className="text-xs font-bold text-slate-400">{formatDate(study.date)}</span> </td> <td className="px-4 py-3 align-top"> <div className="font-black text-slate-900 text-sm flex items-center gap-2"><BookOpen size={14} className="text-indigo-600 shrink-0"/>{study.title}</div> {study.pdfName && <div className="mt-1 flex items-center gap-1 text-[10px] text-red-500 font-bold bg-red-50 w-fit px-2 py-0.5 rounded">PDF ANEXADO</div>} </td> <td className="px-4 py-3 align-top"> <div className="text-xs font-bold text-indigo-500 bg-indigo-50 w-fit px-2 py-0.5 rounded italic">{study.reference}</div> </td> <td className="px-4 py-3 align-top"> <div className="flex items-center gap-1 text-xs font-medium text-slate-500"><Music size={12} className="text-slate-400"/> {study.suggestedPraise || '-'}</div> </td> <td className="px-4 py-3 align-top text-right"> <div className="flex justify-end gap-1"> {study.pdfUrl ? ( <a href={study.pdfUrl} download={study.pdfName || 'estudo.pdf'} className="p-2 text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-all" title="Baixar PDF"><Download size={14}/></a> ) : <span className="p-2 text-slate-300" title="Sem PDF"><CloudOff size={14}/></span>} <button type="button" onClick={() => setEditingId(study.id)} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-xl transition-colors"><Edit3 size={14}/></button> <button type="button" onClick={() => setItemToDelete({ view: AppView.STUDIES, id: study.id })} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-xl transition-colors"><Trash2 size={14}/></button> </div> </td> </tr> )) )} </tbody> </table> </div> </div> </div> );
      case AppView.ANNOUNCEMENTS:
         return ( <div className="space-y-6"> <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"> <div> <h2 className="text-3xl font-black text-slate-900 tracking-tight">Quadro de Avisos</h2> <p className="text-slate-500 font-medium">Comunicação oficial.</p> </div> <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto"> <input type="date" placeholder="Filtrar data..." value={announcementFilterDate} onChange={(e) => setAnnouncementFilterDate(e.target.value)} className={`${inputClass} !py-3.5 !w-full md:!w-48`} /> <button type="button" onClick={() => { setEditingId(null); setIsAdding(true); }} className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:bg-indigo-700 transition-all"> <Plus size={20} /> Novo Aviso </button> </div> </header> {(isAdding || editingId) && (<form className={commonFormClass} onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); handleSave(AppView.ANNOUNCEMENTS, { ...Object.fromEntries(formData), date: new Date().toLocaleDateString() }); }}> <div className="space-y-6"> <div> <label className={labelClass}>Título do Aviso</label> <input name="title" required className={inputClass} defaultValue={announcements.find(a => a.id === editingId)?.title} /> </div> <div> <label className={labelClass}>Categoria</label> <select name="category" className={inputClass} defaultValue={announcements.find(a => a.id === editingId)?.category}> <option value="Aviso">Aviso Geral</option> <option value="Evento">Evento</option> <option value="Celebração">Celebração</option> </select> </div> <div> <label className={labelClass}>Conteúdo</label> <textarea name="content" required className={`${inputClass} h-32 rounded-3xl`} defaultValue={announcements.find(a => a.id === editingId)?.content}></textarea> </div> </div> <div className="flex justify-end gap-3 mt-10"> <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-6 py-3.5 font-bold text-slate-400">Cancelar</button> <button type="submit" disabled={isSaving} className="bg-indigo-600 text-white px-10 py-3.5 rounded-2xl font-black shadow-lg"> {isSaving ? 'Salvando...' : 'Salvar Aviso'} </button> </div> </form>)} <div className="flex flex-col gap-3"> {filteredAnnouncements.length === 0 ? ( <div className="p-20 text-center text-slate-300 font-black italic">Nenhum aviso encontrado.</div> ) : ( filteredAnnouncements.map(ann => { const parts = ann.date.split('/'); const day = parts[0] || 'DD'; const month = parts[1] || 'MM'; const year = parts[2] || 'YYYY'; return ( <div key={ann.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 hover:border-indigo-100 transition-all shadow-sm"> <div className="shrink-0 text-center w-16 p-2 bg-slate-50 rounded-xl border border-slate-100"> <div className="text-[10px] font-black uppercase text-slate-400">{month}/{year}</div> <div className="text-xl font-black text-slate-900">{day}</div> </div> <div className="flex-1 min-w-0"> <div className="flex items-center gap-2 mb-1"> <h3 className="font-black text-slate-900 text-lg truncate">{ann.title}</h3> <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide shrink-0 ${ann.category === 'Evento' ? 'bg-emerald-50 text-emerald-600' : ann.category === 'Celebração' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>{ann.category}</span> </div> <p className="text-sm text-slate-500 line-clamp-1 truncate">{ann.content}</p> </div> <div className="flex gap-1 shrink-0"> <button onClick={() => setViewingAnnouncement(ann)} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all" title="Ver completo"><Eye size={18}/></button> <button onClick={() => setEditingId(ann.id)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Edit3 size={18}/></button> <button onClick={() => setItemToDelete({ view: AppView.ANNOUNCEMENTS, id: ann.id })} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button> </div> </div> ); }) )} </div> </div> );
      case AppView.PASTOR_WORD:
        return ( <div className="space-y-6"> <header className="mb-8"> <h2 className="text-3xl font-black text-slate-900 tracking-tight">Palavra Pastoral</h2> <p className="text-slate-500 font-medium">Compartilhe sua mensagem semanal.</p> </header> <div className={commonFormClass}> <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Edit3 className="text-indigo-500"/> Adicionar Nova Palavra</h3> <div className="space-y-4"> <div> <label className={labelClass}>Tema / Título</label> <input value={pastorTheme} onChange={(e) => setPastorTheme(e.target.value)} className={inputClass} placeholder="Ex: Esperança em tempos difíceis" /> </div> <div> <label className={labelClass}>Mensagem</label> <textarea value={pastorContent} onChange={(e) => setPastorContent(e.target.value)} className={`${inputClass} h-48 rounded-3xl mb-4`} placeholder="Escreva sua mensagem aqui..." /> </div> <div className="flex justify-end"> <button onClick={async () => { if (!pastorTheme || !pastorContent) return; await handleSave(AppView.PASTOR_WORD, { theme: pastorTheme, content: pastorContent, date: new Date().toLocaleDateString() }); setPastorContent(''); setPastorTheme(''); }} disabled={!pastorTheme || !pastorContent || isSaving} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50" > {isSaving ? 'Enviando...' : 'Salvar Mensagem'} </button> </div> </div> </div> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {pastorWords.map(word => ( <div key={word.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => setViewingWord(word)}> <div className="flex justify-between items-start mb-4"> <span className="text-xs font-bold text-slate-400">{word.date}</span> <button onClick={(e) => { e.stopPropagation(); setItemToDelete({ view: AppView.PASTOR_WORD, id: word.id }); }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button> </div> <h4 className="font-black text-lg text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{word.theme}</h4> <p className="text-sm text-slate-500 line-clamp-3">{word.content}</p> </div> ))} </div> </div> );
      case AppView.MUSIC_PLAYER:
        return ( <div className="space-y-6"> <header className="flex justify-between items-center mb-8"> <div> <h2 className="text-3xl font-black text-slate-900 tracking-tight">Repertório de Louvor</h2> <p className="text-slate-500 font-medium">Setlist e referências.</p> </div> <button type="button" onClick={() => { setEditingId(null); setIsAdding(true); }} className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-indigo-700 transition-all"> <Plus size={20} /> Nova Música </button> </header> {(isAdding || editingId) && (<form className={commonFormClass} onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); handleSave(AppView.MUSIC_PLAYER, Object.fromEntries(formData)); }}> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div> <label className={labelClass}>Título da Música</label> <input name="title" required className={inputClass} defaultValue={tracks.find(t => t.id === editingId)?.title} /> </div> <div> <label className={labelClass}>Artista / Banda</label> <input name="artist" required className={inputClass} defaultValue={tracks.find(t => t.id === editingId)?.artist} /> </div> <div> <label className={labelClass}>Link Spotify</label> <input name="spotifyUrl" className={inputClass} defaultValue={tracks.find(t => t.id === editingId)?.spotifyUrl} placeholder="https://open.spotify.com/..." /> </div> <div> <label className={labelClass}>Link YouTube</label> <input name="youtubeUrl" className={inputClass} defaultValue={tracks.find(t => t.id === editingId)?.youtubeUrl} placeholder="https://youtube.com/..." /> </div> </div> <div className="flex justify-end gap-3 mt-10"> <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-6 py-3.5 font-bold text-slate-400">Cancelar</button> <button type="submit" disabled={isSaving} className="bg-indigo-600 text-white px-10 py-3.5 rounded-2xl font-black shadow-lg"> {isSaving ? 'Salvando...' : 'Salvar Música'} </button> </div> </form>)} <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm"> <div className="divide-y divide-slate-50"> {tracks.length === 0 ? ( <div className="p-20 text-center text-slate-300 font-black italic">Nenhuma música cadastrada.</div> ) : ( tracks.map(track => ( <div key={track.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group"> <div className="flex items-center gap-4"> <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm"> <Music size={20} /> </div> <div> <div className="font-black text-slate-900 text-lg">{track.title}</div> <div className="text-sm font-medium text-slate-500">{track.artist}</div> </div> </div> <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"> {track.spotifyUrl && ( <a href={track.spotifyUrl} target="_blank" rel="noreferrer" className="p-2 text-green-600 bg-green-50 rounded-xl hover:bg-green-100 transition-colors" title="Abrir no Spotify"> <ExternalLink size={18} /> </a> )} {track.youtubeUrl && ( <a href={track.youtubeUrl} target="_blank" rel="noreferrer" className="p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors" title="Ver no YouTube"> <Youtube size={18} /> </a> )} <div className="w-px h-6 bg-slate-200 mx-2"></div> <button onClick={() => setEditingId(track.id)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Edit3 size={18}/></button> <button onClick={() => setItemToDelete({ view: AppView.MUSIC_PLAYER, id: track.id })} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button> </div> </div> )) )} </div> </div> </div> );
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center text-white">
        <Loader2 size={48} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl max-w-md w-full border border-slate-200">
           <div className="flex flex-col items-center mb-8">
              <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/30 mb-6">
                 <Church className="text-white" size={40} />
              </div>
              <h1 className="text-3xl font-black text-indigo-950 tracking-tight text-center">Liderança IRV</h1>
              <p className="text-slate-500 font-medium text-center mt-2">Acesso restrito à liderança.</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-6">
              <div>
                 <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-[0.1em]">Email</label>
                 <input 
                   type="email" 
                   required
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-400 font-medium transition-all"
                   placeholder="seu@email.com"
                 />
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-[0.1em]">Senha</label>
                 <div className="relative">
                   <input 
                     type="password" 
                     required
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-400 font-medium transition-all"
                     placeholder="••••••••"
                   />
                   <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                 </div>
              </div>

              {loginError && (
                <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl flex items-center gap-2">
                   <AlertTriangle size={18} /> {loginError}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoggingIn}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? <Loader2 className="animate-spin" /> : <><LogIn size={20} /> Entrar</>}
              </button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-100 min-h-screen font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout} />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen scroll-smooth relative">
         <div className="max-w-7xl mx-auto pb-20">
           <div className="md:hidden flex items-center justify-between mb-6">
              <h1 className="font-black text-xl tracking-tighter italic text-indigo-900">Liderança IRV</h1>
              <button className="p-2 bg-indigo-600 text-white rounded-lg"><List size={20}/></button>
           </div>
           
           {renderContent()}
         </div>
      </main>

      {/* MODALS - Delete Confirmation */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-black text-center text-slate-900 mb-2">Confirmar Exclusão</h3>
              <p className="text-slate-500 text-center text-sm mb-6">Tem certeza que deseja remover este item do Banco de Dados? Ação irreversível.</p>
              <div className="flex gap-3">
                 <button onClick={() => setItemToDelete(null)} className="flex-1 py-3 font-bold text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                 <button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all">Excluir</button>
              </div>
           </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-md animate-in slide-in-from-right duration-300 border ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-white border-slate-100 text-slate-900'}`}>
           <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
             {notification.title.includes('Aniversariantes') ? <Cake size={20}/> : (notification.type === 'success' ? <CheckCircle size={20}/> : <Bell size={20}/>)}
           </div>
           <div>
             <h4 className="font-black text-sm">{notification.title}</h4>
             <p className="text-xs opacity-80 mt-0.5">{notification.message}</p>
           </div>
           <button onClick={() => setNotification(null)} className="text-current opacity-40 hover:opacity-100"><X size={16}/></button>
        </div>
      )}

      {/* Viewing Word Modal */}
      {viewingWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl text-indigo-600"><MessageSquareQuote size={20}/></div>
                    <div>
                       <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Palavra Pastoral</p>
                       <h3 className="font-black text-xl text-indigo-900">{viewingWord.theme}</h3>
                    </div>
                 </div>
                 <button onClick={() => setViewingWord(null)} className="p-2 bg-white/50 hover:bg-white rounded-xl transition-colors text-indigo-900"><X size={20}/></button>
              </div>
              <div className="p-8 overflow-y-auto max-h-[60vh]">
                 <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg font-serif">{viewingWord.content}</p>
                 <p className="mt-8 text-right text-xs font-black text-slate-300 uppercase tracking-widest">Gerado em {viewingWord.date}</p>
              </div>
           </div>
        </div>
      )}

      {/* Viewing Announcement Modal */}
      {viewingAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                 <div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wide ${viewingAnnouncement.category === 'Evento' ? 'bg-emerald-100 text-emerald-700' : viewingAnnouncement.category === 'Celebração' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {viewingAnnouncement.category}
                    </span>
                    <h3 className="font-black text-2xl text-slate-900 mt-3 leading-tight">{viewingAnnouncement.title}</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">{viewingAnnouncement.date}</p>
                 </div>
                 <button onClick={() => setViewingAnnouncement(null)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900"><X size={20}/></button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                 <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{viewingAnnouncement.content}</p>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                 <button onClick={() => setViewingAnnouncement(null)} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all">Entendido</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default App;