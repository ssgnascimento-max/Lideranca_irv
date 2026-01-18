
export enum AppView {
  STUDIES = 'studies',
  PASTOR_WORD = 'pastor_word',
  ANNOUNCEMENTS = 'announcements',
  CELL_MEMBERS = 'cell_members',
  CELL_REGISTRY = 'cell_registry',
  MUSIC_PLAYER = 'music_player',
  REPORTS = 'reports',
  LEADERS = 'leaders',
  MINISTRIES = 'ministries',
  BIRTHDAYS = 'birthdays'
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  birthday: string;
  cellId: string;
  role: 'Líder' | 'Co-Líder' | 'Membro' | 'Visitante';
  joinedAt: string;
}

export interface Leader {
  id: string;
  name: string;
  phone: string;
  birthday: string;
  ministryId: string;
  role: string;
  joinedAt: string;
}

export interface Ministry {
  id: string;
  name: string;
  description: string;
  leaderId?: string;
}

export interface Cell {
  id: string;
  name: string;
  leader: string;
  coLeader?: string; // Novo campo
  address: string;
  meetingDay: string;
  meetingTime: string;
  meetingType: 'Presencial' | 'Online';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'Evento' | 'Aviso' | 'Celebração';
}

export interface Study {
  id: string;
  title: string;
  reference: string;
  suggestedPraise: string;
  date: string; // Novo campo de data
  pdfUrl?: string; // URL do blob para leitura
  pdfName?: string; // Nome do arquivo
  summary?: string; // Mantido como opcional para legado ou notas curtas
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
}

export interface PastorWord {
  id: string;
  theme: string;
  content: string;
  date: string;
}
