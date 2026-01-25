
export const GRADES = [
    { value: 1, label: '중1' },
    { value: 2, label: '중2' },
    { value: 3, label: '중3' },
    { value: 4, label: '고1' },
    { value: 5, label: '고2' },
    { value: 6, label: '고3' },
]

export function formatGrade(grade: number): string {
    const found = GRADES.find(g => g.value === grade)
    return found ? found.label : `${grade}학년`
}
