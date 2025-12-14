/**
 * 以隐藏的 <a> 节点触发浏览器下载。
 */
export async function downloadBlob(filename: string, blob: Blob): Promise<void> {
    const url = URL.createObjectURL(blob)
    try {
        triggerDownload(url, filename)
    } finally {
        URL.revokeObjectURL(url)
    }
}

/**
 * 直接以远程 URL 触发下载（由浏览器处理）。
 */
export function downloadUrl(filename: string, url: string): void {
    triggerDownload(url, filename)
}

function triggerDownload(url: string, filename: string) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}
