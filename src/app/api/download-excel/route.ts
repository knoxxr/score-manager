import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint to download files from external URLs (e.g. Google Sheets)
 * This avoids CORS issues when downloading from the client side.
 */
export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json()
        
        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 })
        }

        let downloadUrl = url.trim()
        let isGoogleSheets = false

        // Google Sheets: use gviz CSV export (works without auth for public sheets)
        const sheetsMatch = downloadUrl.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
        if (sheetsMatch) {
            const fileId = sheetsMatch[1]
            const gidMatch = downloadUrl.match(/gid=(\d+)/)
            const gid = gidMatch ? gidMatch[1] : '0'
            // Use gviz endpoint which works for public sheets without auth
            downloadUrl = `https://docs.google.com/spreadsheets/d/${fileId}/gviz/tq?tqx=out:csv&gid=${gid}`
            isGoogleSheets = true
        }

        // Google Drive file
        const driveMatch = downloadUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
        if (driveMatch) {
            const fileId = driveMatch[1]
            downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
        }

        const response = await fetch(downloadUrl, {
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })

        if (!response.ok) {
            return NextResponse.json(
                { error: `파일 다운로드 실패: HTTP ${response.status}. 공유 설정을 확인해주세요.` },
                { status: response.status }
            )
        }

        if (isGoogleSheets) {
            // Return CSV text directly for Google Sheets
            const csvText = await response.text()
            return NextResponse.json({ data: csvText, format: 'csv' })
        } else {
            // Return binary as base64 for regular Excel files
            const arrayBuffer = await response.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const base64 = buffer.toString('base64')
            return NextResponse.json({ data: base64, format: 'xlsx' })
        }
    } catch (error: any) {
        return NextResponse.json(
            { error: `다운로드 실패: ${error.message}` },
            { status: 500 }
        )
    }
}
