'use client'

import { useState } from 'react'
import { uploadStudentsExcel } from '@/app/actions'


export default function StudentExcelUploader() {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            await uploadStudentsExcel(formData)
            alert('학생 등록이 완료되었습니다.')
            // Reset
            setFile(null)
            if (document.getElementById('excel-input')) {
                (document.getElementById('excel-input') as HTMLInputElement).value = ''
            }
        } catch (e) {
            console.error(e)
            alert('업로드 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'))
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="card" style={{ marginTop: '1rem', border: '1px dashed #cbd5e1' }}>
            <h4>엑셀 일괄 등록</h4>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                <input
                    id="excel-input"
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="input"
                />
                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="btn btn-primary"
                    style={{ whiteSpace: 'nowrap' }}
                >
                    {uploading ? '업로드 중...' : '엑셀 업로드'}
                </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                * 엑셀 파일은 "반명", "학생명", "학교명", "카드번호" 헤더를 포함해야 합니다.
            </p>
        </div>
    )
}
