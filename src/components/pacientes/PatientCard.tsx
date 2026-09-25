import { IconChevronRight } from '../icons';

interface PatientCardProps {
  nome: string;
  idade: number;
  fichas: number;
  iniciais: string;
  corAvatarBg?: string; 
  corAvatarFg?: string;
}

export function PatientCard({ 
  nome, 
  idade, 
  fichas, 
  iniciais, 
  corAvatarBg = "bg-tm-avatar-sky-bg", 
  corAvatarFg = "text-tm-avatar-sky-fg" 
}: PatientCardProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-tm-surface rounded-tm-card shadow-tm-card hover:shadow-tm-card-hover border border-tm-border cursor-pointer transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 flex items-center justify-center rounded-full font-tm-display font-bold text-tm-lg ${corAvatarBg} ${corAvatarFg}`}>
          {iniciais}
        </div>
        
        <div>
          <h3 className="font-tm-body font-semibold text-tm-fg text-tm-base">{nome}</h3>
          <p className="font-tm-body text-tm-sm text-tm-fg-muted">
            {idade} anos • {fichas} {fichas === 1 ? 'ficha' : 'fichas'}
          </p>
        </div>
      </div>
      
      <IconChevronRight className="text-tm-fg-subtle" size={20} />
    </div>
  );
}