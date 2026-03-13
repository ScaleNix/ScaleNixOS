import { useState, useMemo } from 'react';
import { useThemeStore } from '../store/themeStore';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  department: string;
  title: string;
  location: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  avatar: string;
}

const DEPARTMENTS = ['Direction', 'Developpement', 'Infrastructure', 'Design', 'Support', 'Commercial', 'RH', 'Securite', 'Data', 'Produit'];

const USERS: User[] = [
  { id: '1', firstName: 'Malik', lastName: 'Benmekki', email: 'malik@scalenix.fr', phone: '+33 1 42 68 53 01', mobile: '+33 6 12 34 56 78', department: 'Direction', title: 'CEO & Fondateur', location: 'Paris - Siege', status: 'online', avatar: 'MB' },
  { id: '2', firstName: 'Alice', lastName: 'Dupont', email: 'alice@scalenix.fr', phone: '+33 1 42 68 53 10', mobile: '+33 6 23 45 67 89', department: 'Developpement', title: 'Lead Developer', location: 'Paris - Siege', status: 'online', avatar: 'AD' },
  { id: '3', firstName: 'Bob', lastName: 'Martin', email: 'bob@scalenix.fr', phone: '+33 1 42 68 53 11', mobile: '+33 6 34 56 78 90', department: 'Infrastructure', title: 'Administrateur Systeme', location: 'Paris - Siege', status: 'away', avatar: 'BM' },
  { id: '4', firstName: 'Claire', lastName: 'Leroy', email: 'claire@scalenix.fr', phone: '+33 1 42 68 53 12', mobile: '+33 6 45 67 89 01', department: 'Design', title: 'UX/UI Designer Senior', location: 'Lyon - Agence', status: 'online', avatar: 'CL' },
  { id: '5', firstName: 'David', lastName: 'Moreau', email: 'david@scalenix.fr', phone: '+33 1 42 68 53 13', mobile: '+33 6 56 78 90 12', department: 'Infrastructure', title: 'DevOps Engineer', location: 'Paris - Siege', status: 'busy', avatar: 'DM' },
  { id: '6', firstName: 'Sophie', lastName: 'Bernard', email: 'sophie@scalenix.fr', phone: '+33 1 42 68 53 14', mobile: '+33 6 67 89 01 23', department: 'Commercial', title: 'Directrice Commerciale', location: 'Paris - Siege', status: 'online', avatar: 'SB' },
  { id: '7', firstName: 'Thomas', lastName: 'Petit', email: 'thomas@scalenix.fr', phone: '+33 1 42 68 53 15', mobile: '+33 6 78 90 12 34', department: 'Developpement', title: 'Developpeur Backend', location: 'Nantes - Remote', status: 'online', avatar: 'TP' },
  { id: '8', firstName: 'Emma', lastName: 'Rousseau', email: 'emma@scalenix.fr', phone: '+33 1 42 68 53 16', mobile: '+33 6 89 01 23 45', department: 'Developpement', title: 'Developpeur Frontend', location: 'Paris - Siege', status: 'away', avatar: 'ER' },
  { id: '9', firstName: 'Lucas', lastName: 'Garcia', email: 'lucas@scalenix.fr', phone: '+33 1 42 68 53 17', mobile: '+33 6 90 12 34 56', department: 'Developpement', title: 'Developpeur Full-Stack', location: 'Bordeaux - Remote', status: 'online', avatar: 'LG' },
  { id: '10', firstName: 'Julie', lastName: 'Fournier', email: 'julie@scalenix.fr', phone: '+33 1 42 68 53 18', mobile: '+33 6 01 23 45 67', department: 'Produit', title: 'Product Owner', location: 'Paris - Siege', status: 'online', avatar: 'JF' },
  { id: '11', firstName: 'Antoine', lastName: 'Durand', email: 'antoine@scalenix.fr', phone: '+33 1 42 68 53 19', mobile: '+33 6 11 22 33 44', department: 'Securite', title: 'RSSI', location: 'Paris - Siege', status: 'busy', avatar: 'ADu' },
  { id: '12', firstName: 'Camille', lastName: 'Bonnet', email: 'camille@scalenix.fr', phone: '+33 1 42 68 53 20', mobile: '+33 6 22 33 44 55', department: 'RH', title: 'Responsable RH', location: 'Paris - Siege', status: 'online', avatar: 'CB' },
  { id: '13', firstName: 'Hugo', lastName: 'Mercier', email: 'hugo@scalenix.fr', phone: '+33 1 42 68 53 21', mobile: '+33 6 33 44 55 66', department: 'Data', title: 'Data Engineer', location: 'Toulouse - Remote', status: 'online', avatar: 'HM' },
  { id: '14', firstName: 'Lea', lastName: 'Lambert', email: 'lea@scalenix.fr', phone: '+33 1 42 68 53 22', mobile: '+33 6 44 55 66 77', department: 'Support', title: 'Responsable Support', location: 'Paris - Siege', status: 'online', avatar: 'LL' },
  { id: '15', firstName: 'Nathan', lastName: 'Girard', email: 'nathan@scalenix.fr', phone: '+33 1 42 68 53 23', mobile: '+33 6 55 66 77 88', department: 'Infrastructure', title: 'Ingenieur Cloud', location: 'Paris - Siege', status: 'away', avatar: 'NG' },
  { id: '16', firstName: 'Manon', lastName: 'Andre', email: 'manon@scalenix.fr', phone: '+33 1 42 68 53 24', mobile: '+33 6 66 77 88 99', department: 'Design', title: 'UI Designer', location: 'Lyon - Agence', status: 'online', avatar: 'MA' },
  { id: '17', firstName: 'Maxime', lastName: 'Lemoine', email: 'maxime@scalenix.fr', phone: '+33 1 42 68 53 25', mobile: '+33 6 77 88 99 00', department: 'Developpement', title: 'Developpeur Mobile', location: 'Paris - Siege', status: 'offline', avatar: 'ML' },
  { id: '18', firstName: 'Chloe', lastName: 'Roux', email: 'chloe@scalenix.fr', phone: '+33 1 42 68 53 26', mobile: '+33 6 88 99 00 11', department: 'Commercial', title: 'Chargee de Clientele', location: 'Marseille - Remote', status: 'online', avatar: 'CR' },
  { id: '19', firstName: 'Alexandre', lastName: 'Simon', email: 'alexandre@scalenix.fr', phone: '+33 1 42 68 53 27', mobile: '+33 6 99 00 11 22', department: 'Developpement', title: 'Architecte Logiciel', location: 'Paris - Siege', status: 'online', avatar: 'AS' },
  { id: '20', firstName: 'Ines', lastName: 'Morel', email: 'ines@scalenix.fr', phone: '+33 1 42 68 53 28', mobile: '+33 6 10 20 30 40', department: 'Data', title: 'Data Scientist', location: 'Paris - Siege', status: 'busy', avatar: 'IM' },
  { id: '21', firstName: 'Paul', lastName: 'Laurent', email: 'paul@scalenix.fr', phone: '+33 1 42 68 53 29', mobile: '+33 6 20 30 40 50', department: 'Direction', title: 'Directeur Technique (CTO)', location: 'Paris - Siege', status: 'online', avatar: 'PL' },
  { id: '22', firstName: 'Sarah', lastName: 'Michel', email: 'sarah@scalenix.fr', phone: '+33 1 42 68 53 30', mobile: '+33 6 30 40 50 60', department: 'Produit', title: 'UX Researcher', location: 'Lyon - Agence', status: 'away', avatar: 'SM' },
  { id: '23', firstName: 'Romain', lastName: 'Lefebvre', email: 'romain@scalenix.fr', phone: '+33 1 42 68 53 31', mobile: '+33 6 40 50 60 70', department: 'Securite', title: 'Pentester', location: 'Paris - Siege', status: 'online', avatar: 'RL' },
  { id: '24', firstName: 'Marine', lastName: 'David', email: 'marine@scalenix.fr', phone: '+33 1 42 68 53 32', mobile: '+33 6 50 60 70 80', department: 'RH', title: 'Chargee de Recrutement', location: 'Paris - Siege', status: 'online', avatar: 'MD' },
  { id: '25', firstName: 'Kevin', lastName: 'Bertrand', email: 'kevin@scalenix.fr', phone: '+33 1 42 68 53 33', mobile: '+33 6 60 70 80 90', department: 'Support', title: 'Technicien Support N2', location: 'Lille - Remote', status: 'online', avatar: 'KB' },
  { id: '26', firstName: 'Laura', lastName: 'Robert', email: 'laura@scalenix.fr', phone: '+33 1 42 68 53 34', mobile: '+33 6 70 80 90 01', department: 'Commercial', title: 'Responsable Partenariats', location: 'Paris - Siege', status: 'offline', avatar: 'LR' },
  { id: '27', firstName: 'Julien', lastName: 'Richard', email: 'julien@scalenix.fr', phone: '+33 1 42 68 53 35', mobile: '+33 6 80 90 01 12', department: 'Infrastructure', title: 'DBA PostgreSQL', location: 'Paris - Siege', status: 'online', avatar: 'JR' },
  { id: '28', firstName: 'Elise', lastName: 'Dubois', email: 'elise@scalenix.fr', phone: '+33 1 42 68 53 36', mobile: '+33 6 91 02 13 24', department: 'Direction', title: 'Directrice Financiere (CFO)', location: 'Paris - Siege', status: 'online', avatar: 'ED' },
  { id: '29', firstName: 'Theo', lastName: 'Guerin', email: 'theo@scalenix.fr', phone: '+33 1 42 68 53 37', mobile: '+33 6 02 13 24 35', department: 'Developpement', title: 'QA Engineer', location: 'Strasbourg - Remote', status: 'away', avatar: 'TG' },
  { id: '30', firstName: 'Oceane', lastName: 'Muller', email: 'oceane@scalenix.fr', phone: '+33 1 42 68 53 38', mobile: '+33 6 13 24 35 46', department: 'Design', title: 'Motion Designer', location: 'Lyon - Agence', status: 'online', avatar: 'OM' },
  { id: '31', firstName: 'Quentin', lastName: 'Lefevre', email: 'quentin@scalenix.fr', phone: '+33 1 42 68 53 39', mobile: '+33 6 24 35 46 57', department: 'Data', title: 'ML Engineer', location: 'Paris - Siege', status: 'online', avatar: 'QL' },
  { id: '32', firstName: 'Charlotte', lastName: 'Martinez', email: 'charlotte@scalenix.fr', phone: '+33 1 42 68 53 40', mobile: '+33 6 35 46 57 68', department: 'Produit', title: 'Scrum Master', location: 'Paris - Siege', status: 'busy', avatar: 'CM' },
];

const STATUS_DOT: Record<string, string> = {
  online: '#22c55e',
  away: '#f59e0b',
  busy: '#ef4444',
  offline: '#64748b',
};

const STATUS_LABEL: Record<string, string> = {
  online: 'En ligne',
  away: 'Absent',
  busy: 'Occupe',
  offline: 'Hors ligne',
};

export function Directory() {
  const colors = useThemeStore((s) => s.colors);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filtered = useMemo(() => {
    let list = USERS;
    if (selectedDept) list = list.filter((u) => u.department === selectedDept);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        `${u.firstName} ${u.lastName} ${u.email} ${u.title} ${u.department}`.toLowerCase().includes(q),
      );
    }
    return list;
  }, [search, selectedDept]);

  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const u of USERS) counts[u.department] = (counts[u.department] || 0) + 1;
    return counts;
  }, []);

  const onlineCount = USERS.filter((u) => u.status === 'online').length;

  return (
    <div className="flex h-full" style={{ background: colors.surface, color: colors.textPrimary }}>
      {/* Sidebar */}
      <div className="flex w-52 shrink-0 flex-col border-r" style={{ borderColor: colors.border }}>
        <div className="p-3">
          <input
            className="w-full rounded-lg bg-white/10 px-3 py-1.5 text-xs outline-none placeholder:opacity-40"
            style={{ color: colors.textPrimary }}
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
          {USERS.length} collaborateurs · {onlineCount} en ligne
        </div>

        <div className="flex-1 overflow-y-auto px-1" style={{ scrollbarWidth: 'thin' }}>
          <button
            onClick={() => setSelectedDept(null)}
            className={`mb-0.5 w-full rounded-lg px-3 py-1.5 text-left text-xs ${!selectedDept ? 'font-semibold' : ''}`}
            style={!selectedDept ? { background: `${colors.accent}22`, color: colors.accent } : { color: colors.textSecondary }}
          >
            Tous ({USERS.length})
          </button>
          {DEPARTMENTS.filter((d) => deptCounts[d]).map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept === selectedDept ? null : dept)}
              className={`mb-0.5 w-full rounded-lg px-3 py-1.5 text-left text-xs ${dept === selectedDept ? 'font-semibold' : ''}`}
              style={dept === selectedDept ? { background: `${colors.accent}22`, color: colors.accent } : { color: colors.textSecondary }}
            >
              {dept} ({deptCounts[dept]})
            </button>
          ))}
        </div>
      </div>

      {/* User list */}
      <div className="flex flex-1 flex-col">
        <div className="border-b px-4 py-2 text-xs font-semibold" style={{ borderColor: colors.border, color: colors.textSecondary }}>
          {selectedDept || 'Tous les departements'} — {filtered.length} resultat{filtered.length !== 1 ? 's' : ''}
        </div>
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {filtered.map((u) => (
            <div
              key={u.id}
              className={`flex items-center gap-3 border-b px-4 py-2.5 cursor-pointer hover:bg-white/5 ${selectedUser?.id === u.id ? 'bg-white/5' : ''}`}
              style={{ borderColor: `${colors.border}66` }}
              onClick={() => setSelectedUser(u)}
            >
              <div className="relative">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: `${colors.accent}33`, color: colors.accent }}
                >
                  {u.avatar.slice(0, 2)}
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2"
                  style={{ background: STATUS_DOT[u.status], borderColor: colors.surface }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{u.firstName} {u.lastName}</div>
                <div className="truncate text-[11px]" style={{ color: colors.textSecondary }}>{u.title}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[10px]" style={{ color: colors.textSecondary }}>{u.department}</div>
                <div className="text-[10px]" style={{ color: STATUS_DOT[u.status] }}>{STATUS_LABEL[u.status]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selectedUser && (
        <div className="flex w-64 shrink-0 flex-col border-l p-4" style={{ borderColor: colors.border }}>
          <div className="flex flex-col items-center gap-2 pb-4">
            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold"
              style={{ background: `${colors.accent}33`, color: colors.accent }}
            >
              {selectedUser.avatar.slice(0, 2)}
              <div
                className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2"
                style={{ background: STATUS_DOT[selectedUser.status], borderColor: colors.surface }}
              />
            </div>
            <div className="text-center">
              <div className="text-sm font-bold">{selectedUser.firstName} {selectedUser.lastName}</div>
              <div className="text-[11px]" style={{ color: colors.accent }}>{selectedUser.title}</div>
              <div className="text-[10px]" style={{ color: STATUS_DOT[selectedUser.status] }}>{STATUS_LABEL[selectedUser.status]}</div>
            </div>
          </div>

          <div className="space-y-3">
            <InfoRow icon="📧" label="Email" value={selectedUser.email} />
            <InfoRow icon="📞" label="Telephone" value={selectedUser.phone} />
            <InfoRow icon="📱" label="Mobile" value={selectedUser.mobile} />
            <InfoRow icon="🏢" label="Departement" value={selectedUser.department} />
            <InfoRow icon="📍" label="Localisation" value={selectedUser.location} />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              className="flex-1 rounded-lg py-1.5 text-xs font-medium"
              style={{ background: colors.accent, color: '#fff' }}
            >
              💬 Message
            </button>
            <button
              className="flex-1 rounded-lg py-1.5 text-xs font-medium border"
              style={{ borderColor: colors.border, color: colors.textSecondary }}
            >
              📧 Email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const colors = useThemeStore((s) => s.colors);
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color: colors.textSecondary }}>
        {icon} {label}
      </div>
      <div className="text-xs mt-0.5">{value}</div>
    </div>
  );
}
