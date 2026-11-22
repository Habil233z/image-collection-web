const EXT_BY_TYPE: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/avif": "avif",
}

function slugify(text: string): string {
    return (
        text
            .toLowerCase()
            .normalize("NFKD")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60) || "image"
    )
}

function extFromUrl(url: string): string | null {
    const match = url.split("?")[0].match(/\.([a-zA-Z0-9]{2,5})$/)
    return match ? match[1].toLowerCase() : null
}

export async function downloadImage(url: string, title: string): Promise<void> {
    const base = slugify(title)

    try {
        const res = await fetch(url, { mode: "cors" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const blob = await res.blob()

        const ext = EXT_BY_TYPE[blob.type] || extFromUrl(url) || "png"
        const objectUrl = URL.createObjectURL(blob)

        const a = document.createElement("a")
        a.href = objectUrl
        a.download = `${base}.${ext}`
        document.body.appendChild(a)
        a.click()
        a.remove()

        setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000)
    } catch (err) {
        console.warn("Blob download failed, falling back to ?download=", err)
        const ext = extFromUrl(url) || "png"
        const sep = url.includes("?") ? "&" : "?"
        window.location.href = `${url}${sep}download=${encodeURIComponent(`${base}.${ext}`)}`
    }
}
