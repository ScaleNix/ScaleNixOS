import { useState, useMemo } from 'react';
import { useThemeStore } from '../../store/themeStore';

const QUOTES = [
  { text: 'Le seul moyen de faire du bon travail est d\'aimer ce que vous faites.', author: 'Steve Jobs' },
  { text: 'La simplicite est la sophistication supreme.', author: 'Leonard de Vinci' },
  { text: 'L\'imagination est plus importante que le savoir.', author: 'Albert Einstein' },
  { text: 'Le succes c\'est d\'aller d\'echec en echec sans perdre son enthousiasme.', author: 'Winston Churchill' },
  { text: 'La vie est ce qui arrive quand vous etes occupe a faire d\'autres plans.', author: 'John Lennon' },
  { text: 'Soyez le changement que vous voulez voir dans le monde.', author: 'Gandhi' },
  { text: 'La seule facon de faire, c\'est de faire.', author: 'Amelia Earhart' },
  { text: 'Il n\'y a qu\'une facon d\'echouer, c\'est d\'abandonner avant d\'avoir reussi.', author: 'Olivier Lockert' },
  { text: 'La creativite, c\'est l\'intelligence qui s\'amuse.', author: 'Albert Einstein' },
  { text: 'Celui qui deplace une montagne commence par deplacer de petites pierres.', author: 'Confucius' },
  { text: 'Le meilleur moment pour planter un arbre etait il y a 20 ans. Le deuxieme meilleur moment est maintenant.', author: 'Proverbe chinois' },
  { text: 'Ce n\'est pas parce que les choses sont difficiles que nous n\'osons pas, c\'est parce que nous n\'osons pas qu\'elles sont difficiles.', author: 'Seneque' },
  { text: 'La connaissance s\'acquiert par l\'experience, tout le reste n\'est que de l\'information.', author: 'Albert Einstein' },
  { text: 'Le courage n\'est pas l\'absence de peur, mais la capacite de vaincre ce qui fait peur.', author: 'Nelson Mandela' },
  { text: 'Un voyage de mille lieues commence toujours par un premier pas.', author: 'Lao Tseu' },
];

export function QuoteWidget() {
  const colors = useThemeStore((s) => s.colors);
  const dayIndex = useMemo(() => Math.floor(Date.now() / 86400000) % QUOTES.length, []);
  const [idx, setIdx] = useState(dayIndex);
  const q = QUOTES[idx];

  return (
    <div
      className="flex h-full w-full flex-col justify-between rounded-xl px-5 py-4 backdrop-blur-md select-none"
      style={{ background: `${colors.surface}cc`, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
    >
      <div className="text-lg leading-none" style={{ color: colors.textSecondary }}>❝</div>
      <p className="text-sm italic leading-relaxed">{q.text}</p>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium" style={{ color: colors.accent }}>— {q.author}</span>
        <button
          onClick={() => setIdx((i) => (i + 1) % QUOTES.length)}
          className="rounded px-1.5 py-0.5 text-[10px] hover:bg-white/10"
          style={{ color: colors.textSecondary }}
          title="Citation suivante"
        >
          ↻
        </button>
      </div>
    </div>
  );
}
