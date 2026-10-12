import React from 'react';
import { DEVS_LIST } from './DevsList';

export function DevsPage() {
  const alunos = DEVS_LIST.filter(dev => dev.type === 'aluno');
  const professores = DEVS_LIST.filter(dev => dev.type === 'professor');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Seção dos Alunos */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
          Equipe de Desenvolvimento
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {alunos.map(dev => (
            <div 
              key={dev.id} 
              className="bg-white rounded-xl shadow-md border border-gray-100 p-4 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
            >
              <img 
                src={dev.foto} 
                alt={dev.name} 
                className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-blue-500"
              />
              <h3 className="font-semibold text-gray-900 text-lg">{dev.name}</h3>
              <p className="text-xs font-medium text-blue-600 mb-2">{dev.role}</p>
              
              {dev.email && (
                <p className="text-xs text-gray-500 mb-3 truncate w-full" title={dev.email}>
                  {dev.email}
                </p>
              )}

              <div className="mt-auto flex gap-3 text-xs text-blue-500 pt-2 border-t w-full justify-center">
                {dev.github && (
                  <a href={dev.github} target="_blank" rel="noreferrer" className="hover:underline">
                    GitHub
                  </a>
                )}
                {dev.linkedin && (
                  <a href={dev.linkedin} target="_blank" rel="noreferrer" className="hover:underline">
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Seção dos Professores */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
          Orientadores
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {professores.map(prof => (
            <div 
              key={prof.id} 
              className="bg-white rounded-xl shadow-md border border-gray-100 p-4 flex flex-col items-center text-center"
            >
              <img 
                src={prof.foto} 
                alt={prof.name} 
                className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-gray-300"
              />
              <h3 className="font-semibold text-gray-900 text-base">{prof.name}</h3>
              <p className="text-xs text-gray-600">{prof.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// Exportações adicionais para evitar qualquer erro de importação nas rotas
export { DevsPage as Devs };
export default DevsPage;