export interface Dev {
    id: number
    name: string
    role: string
    type: 'professor' | 'aluno' 
    foto: string
    email?: string
    github?: string
    linkedin?: string
}

export const DEVS_LIST: Dev[] = [
    {
        id: 1,
        name: 'Andrei Rehem',
        role: 'Developer',
        type: 'aluno',
        foto: '/images/john-doe.jpg',
        email: 'john.doe@example.com',
        github: 'https://github.com/johndoe',
        linkedin: 'https://linkedin.com/in/johndoe'
    }
]