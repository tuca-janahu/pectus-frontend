export interface Dev {
  id: number;
  name: string;
  role: string;
  type: 'professor' | 'aluno';
  foto: string;
  email?: string;
  github?: string;
  linkedin?: string;
}

export const DEVS_LIST: Dev[] = [
  // --- ALUNOS ---
  {
    id: 1,
    name: 'Andrei Rehem',
    role: 'Desenvolvedor / Engenharia da Computação',
    type: 'aluno',
    foto: 'https://via.placeholder.com/150', // Substitua pela foto do Andrei
    email: 'andrei@senaicimatec.com',
    github: 'https://github.com/andreirehem',
    linkedin: 'https://linkedin.com/in/andreirehem'
  },
  {
    id: 2,
    name: 'Artur Janahú',
    role: 'Desenvolvedor Back-end / Engenharia da Computação',
    type: 'aluno',
    foto: 'https://via.placeholder.com/150',
    email: 'artur@senaicimatec.com',
    github: 'https://github.com/aluno2',
    linkedin: 'https://linkedin.com/in/aluno2'
  },
  {
    id: 3,
    name: 'Cassio Sobreira',
    role: 'Desenvolvedor Front-end / Engenharia da Computação',
    type: 'aluno',
    foto: 'https://via.placeholder.com/150',
    email: 'cassio@senaicimatec.com',
    github: 'https://github.com/aluno3',
    linkedin: 'https://linkedin.com/in/aluno3'
  },
  {
    id: 4,
    name: 'Felipe de Souza Lucas',
    role: 'Gestão / Engenharia de Controle e Automação',
    type: 'aluno',
    foto: 'https://via.placeholder.com/150',
    email: 'felipe@senaicimatec.com',
    github: 'https://github.com/aluno4',
    linkedin: 'https://linkedin.com/in/aluno4'
  },
  {
    id: 5,
    name: 'Lucas Mineiro',
    role: 'Desenvolvedor Full-stack / Engenharia da Computação',
    type: 'aluno',
    foto: 'https://via.placeholder.com/150',
    email: 'aluno5@senaicimatec.com',
    github: 'https://github.com/aluno5',
    linkedin: 'https://linkedin.com/in/aluno5'
  },

  // --- PROFESSORES ORIENTADORES ---
  {
    id: 6,
    name: 'Prof. Guilherme Souza',
    role: 'Orientador de Gestão',
    type: 'professor',
    foto: 'https://via.placeholder.com/150'
  },
  {
    id: 7,
    name: 'Prof. Michell Thompson',
    role: 'Orientador de Gestão',
    type: 'professor',
    foto: 'https://via.placeholder.com/150'
  },
  {
    id: 8,
    name: 'Prof. Ariel Menezes',
    role: 'Orientador Técnico',
    type: 'professor',
    foto: 'https://via.placeholder.com/150'
  }
];