
import { Member, Announcement, Study, Track, Cell } from './types';

export const INITIAL_MEMBERS: Member[] = [
  { id: '1', name: 'João Silva', phone: '(11) 98888-7777', role: 'Líder', joinedAt: '2023-01-15', birthday: '1985-05-10', cellId: '1' },
  { id: '2', name: 'Maria Santos', phone: '(11) 97777-6666', role: 'Co-Líder', joinedAt: '2023-02-20', birthday: '1990-08-15', cellId: '1' },
];

export const INITIAL_CELLS: Cell[] = [
  { id: '1', name: 'Célula Boas Novas', leader: 'João Silva', coLeader: 'Maria Santos', address: 'Rua das Flores, 123', meetingDay: 'Quarta-feira', meetingTime: '20:00', meetingType: 'Presencial' },
  { id: '2', name: 'Célula Esperança', leader: 'Marcos Oliveira', coLeader: '', address: 'Meet.google.com/abc-def', meetingDay: 'Terça-feira', meetingTime: '19:30', meetingType: 'Online' },
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', title: 'Culto de Jovens', content: 'Neste sábado às 19h teremos o nosso especial de jovens.', date: '2024-05-25', category: 'Evento' },
];

export const INITIAL_STUDIES: Study[] = [
  { 
    id: '1', 
    title: 'O Fruto do Espírito', 
    reference: 'Gálatas 5:22-23', 
    suggestedPraise: 'Bondade de Deus - Isaías Saad',
    date: '2024-05-20',
    pdfName: 'exemplo_dummy.pdf',
    // Usando um PDF público de exemplo para garantir que o visualizador funcione no teste inicial
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' 
  },
];

export const MOCK_TRACKS: Track[] = [
  { id: '1', title: 'Bondade de Deus', artist: 'Isaías Saad', spotifyUrl: 'https://open.spotify.com', youtubeUrl: 'https://youtube.com' },
  { id: '2', title: 'A Casa é Sua', artist: 'Casa Worship', spotifyUrl: 'https://open.spotify.com', youtubeUrl: 'https://youtube.com' },
];
