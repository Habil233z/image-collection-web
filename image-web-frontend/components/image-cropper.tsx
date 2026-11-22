"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

/**
 * Dependency-free image crop + resize editor.
 *
 * - Drag the box to move it, drag the handles to resize it.
 * - Pick an aspect ratio (Free / 1:1 / 4:3 / 3:4 / 16:9 / 9:16).
 * - Pick the output size (percent presets or exact width / height).
 * - "Apply" renders the result on a canvas and hands back a new File.
 */

type Crop = { x: number; y: number; w: number; h: number } // natural-pixel coordinates
type Dir = "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"

interface ImageCropperProps {
    /** Object URL (blob:) or same-origin URL of the image to edit. */
    src: string
    /** Original file name – used to name the output file. */
    fileName: string
    /** Original mime type – used to pick the output format. */
    mimeType: string
    applyLabel?: string
    onApply: (file: File) => void
    onCancel: () => void
    /** When provided, a "Use original" button is shown. */
    onSkip?: () => void
}

const ASPECTS: { label: string; value: number | null }[] = [
    { label: "Free", value: null },
    { label: "1:1", value: 1 },
    { label: "4:3", value: 4 / 3 },
    { label: "3:4", value: 3 / 4 },
    { label: "16:9", value: 16 / 9 },
    { label: "9:16", value: 9 / 16 },
]

const SCALE_PRESETS = [100, 75, 50, 25]
const MAX_OUTPUT_SIDE = 4096
const MIN_CROP_DISPLAY_PX = 24

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

function computeResize(
    start: Crop,
    dir: Dir,
    dx: number,
    dy: number,
    ratio: number | null,
    nw: number,
    nh: number,
    min: number
): Crop {
    if (dir === "move") {
        return {
            ...start,
            x: clamp(start.x + dx, 0, nw - start.w),
            y: clamp(start.y + dy, 0, nh - start.h),
        }
    }

    const hasW = dir.includes("w")
    const hasE = dir.includes("e")
    const hasN = dir.includes("n")
    const hasS = dir.includes("s")

    // ---------- free resize ----------
    if (ratio === null) {
        let l = start.x
        let t = start.y
        let r = start.x + start.w
        let b = start.y + start.h
        if (hasW) l = clamp(start.x + dx, 0, r - min)
        if (hasE) r = clamp(r + dx, l + min, nw)
        if (hasN) t = clamp(start.y + dy, 0, b - min)
        if (hasS) b = clamp(b + dy, t + min, nh)
        return { x: l, y: t, w: r - l, h: b - t }
    }

    // ---------- aspect-locked resize ----------
    const minW = Math.max(min, min * ratio)
    const isCorner = (hasW || hasE) && (hasN || hasS)

    if (isCorner) {
        const sx = hasE ? 1 : -1
        const sy = hasS ? 1 : -1
        const ax = sx > 0 ? start.x : start.x + start.w // fixed corner
        const ay = sy > 0 ? start.y : start.y + start.h
        const wFromX = start.w + sx * dx
        const wFromY = (start.h + sy * dy) * ratio
        let w = Math.abs(sx * dx) >= Math.abs(sy * dy) * ratio ? wFromX : wFromY
        const availX = sx > 0 ? nw - ax : ax
        const availY = sy > 0 ? nh - ay : ay
        w = clamp(w, minW, Math.max(minW, Math.min(availX, availY * ratio)))
        const h = w / ratio
        return {
            x: sx > 0 ? ax : ax - w,
            y: sy > 0 ? ay : ay - h,
            w,
            h,
        }
    }

    if (hasE || hasW) {
        const sx = hasE ? 1 : -1
        const ax = sx > 0 ? start.x : start.x + start.w
        const cy = start.y + start.h / 2
        const availX = sx > 0 ? nw - ax : ax
        const availY = 2 * Math.min(cy, nh - cy) * ratio
        const w = clamp(start.w + sx * dx, minW, Math.max(minW, Math.min(availX, availY)))
        const h = w / ratio
        return { x: sx > 0 ? ax : ax - w, y: cy - h / 2, w, h }
    }

    // n / s
    const sy = hasS ? 1 : -1
    const ay = sy > 0 ? start.y : start.y + start.h
    const cx = start.x + start.w / 2
    const availY = sy > 0 ? nh - ay : ay
    const availX = (2 * Math.min(cx, nw - cx)) / ratio
    const minH = minW / ratio
    const h = clamp(start.h + sy * dy, minH, Math.max(minH, Math.min(availY, availX)))
    const w = h * ratio
    return { x: cx - w / 2, y: sy > 0 ? ay : ay - h, w, h }
}

/** Largest crop with the given ratio that fits inside the image, centred on `around`. */
function fitRatio(ratio: number, nw: number, nh: number, around: Crop): Crop {
    let w = Math.min(around.w, around.h * ratio)
    let h = w / ratio
    // If the current box is smaller than it could be in the other dimension, grow to fit the image.
    if (h > nh) {
        h = nh
        w = h * ratio
    }
    if (w > nw) {
        w = nw
        h = w / ratio
    }
    const cx = around.x + around.w / 2
    const cy = around.y + around.h / 2
    return {
        x: clamp(cx - w / 2, 0, nw - w),
        y: clamp(cy - h / 2, 0, nh - h),
        w,
        h,
    }
}

function outputFormat(mimeType: string): { type: string; ext: string } {
    if (mimeType === "image/jpeg" || mimeType === "image/jpg") return { type: "image/jpeg", ext: "jpg" }
    if (mimeType === "image/webp") return { type: "image/webp", ext: "webp" }
    // PNG, GIF, SVG, BMP, … -> PNG (lossless, supports transparency)
    return { type: "image/png", ext: "png" }
}

const HANDLES: { dir: Dir; className: string; cursor: string }[] = [
    { dir: "nw", className: "-top-2 -left-2", cursor: "nwse-resize" },
    { dir: "n", className: "-top-2 left-1/2 -translate-x-1/2", cursor: "ns-resize" },
    { dir: "ne", className: "-top-2 -right-2", cursor: "nesw-resize" },
    { dir: "e", className: "top-1/2 -right-2 -translate-y-1/2", cursor: "ew-resize" },
    { dir: "se", className: "-bottom-2 -right-2", cursor: "nwse-resize" },
    { dir: "s", className: "-bottom-2 left-1/2 -translate-x-1/2", cursor: "ns-resize" },
    { dir: "sw", className: "-bottom-2 -left-2", cursor: "nesw-resize" },
    { dir: "w", className: "top-1/2 -left-2 -translate-y-1/2", cursor: "ew-resize" },
]

export default function ImageCropper({
    src,
    fileName,
    mimeType,
    applyLabel = "Apply",
    onApply,
    onCancel,
    onSkip,
}: ImageCropperProps) {
    const imgRef = useRef<HTMLImageElement | null>(null)
    const stageRef = useRef<HTMLDivElement | null>(null)
    const drag = useRef<{ dir: Dir; startX: number; startY: number; crop: Crop } | null>(null)

    const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
    const [displayWidth, setDisplayWidth] = useState<number>(0)
    const [crop, setCrop] = useState<Crop | null>(null)
    const [aspect, setAspect] = useState<number | null>(null)
    const [aspectLabel, setAspectLabel] = useState<string>("Free")
    const [scale, setScale] = useState<number>(100) // output size as % of the cropped area
    const [loadError, setLoadError] = useState<boolean>(false)
    const [busy, setBusy] = useState<boolean>(false)

    const format = useMemo(() => outputFormat(mimeType), [mimeType])

    // ---- load / measure -------------------------------------------------
    const measure = useCallback(() => {
        if (imgRef.current) setDisplayWidth(imgRef.current.clientWidth)
    }, [])

    function handleLoad() {
        const img = imgRef.current
        if (!img) return
        setNatural({ w: img.naturalWidth, h: img.naturalHeight })
        setCrop({ x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight })
        setScale(100)
        setAspect(null)
        setAspectLabel("Free")
        measure()
    }

    useEffect(() => {
        const img = imgRef.current
        if (!img) return
        const observer = new ResizeObserver(measure)
        observer.observe(img)
        return () => observer.disconnect()
    }, [measure, src])

    // reset when a different image is supplied
    useEffect(() => {
        setNatural(null)
        setCrop(null)
        setLoadError(false)
    }, [src])

    const factor = natural && displayWidth ? displayWidth / natural.w : 0 // display px per natural px

    // ---- output size ----------------------------------------------------
    const maxScale = crop ? Math.max(1, Math.floor((MAX_OUTPUT_SIDE / Math.max(crop.w, crop.h)) * 100)) : 100
    const effectiveScale = Math.min(scale, maxScale)
    const outW = crop ? Math.max(1, Math.round((crop.w * effectiveScale) / 100)) : 0
    const outH = crop ? Math.max(1, Math.round((crop.h * effectiveScale) / 100)) : 0

    function setOutWidth(value: number) {
        if (!crop || !Number.isFinite(value) || value <= 0) return
        setScale(clamp((value / crop.w) * 100, 1, maxScale))
    }

    function setOutHeight(value: number) {
        if (!crop || !Number.isFinite(value) || value <= 0) return
        setScale(clamp((value / crop.h) * 100, 1, maxScale))
    }

    // ---- pointer handling -----------------------------------------------
    function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
        if (!crop || !factor) return
        const target = (e.target as HTMLElement).closest("[data-dir]") as HTMLElement | null
        if (!target) return
        e.preventDefault()
        drag.current = {
            dir: target.dataset.dir as Dir,
            startX: e.clientX,
            startY: e.clientY,
            crop,
        }
        stageRef.current?.setPointerCapture(e.pointerId)
    }

    function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
        const d = drag.current
        if (!d || !natural || !factor) return
        const dx = (e.clientX - d.startX) / factor
        const dy = (e.clientY - d.startY) / factor
        const min = Math.min(MIN_CROP_DISPLAY_PX / factor, natural.w, natural.h)
        setCrop(computeResize(d.crop, d.dir, dx, dy, aspect, natural.w, natural.h, min))
    }

    function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
        if (drag.current) {
            drag.current = null
            stageRef.current?.releasePointerCapture(e.pointerId)
        }
    }

    // ---- toolbar actions ------------------------------------------------
    function chooseAspect(label: string, value: number | null) {
        setAspectLabel(label)
        setAspect(value)
        if (value !== null && natural && crop) {
            setCrop(fitRatio(value, natural.w, natural.h, crop))
        }
    }

    function resetCrop() {
        if (!natural) return
        setCrop({ x: 0, y: 0, w: natural.w, h: natural.h })
        setAspect(null)
        setAspectLabel("Free")
        setScale(100)
    }

    function apply() {
        const img = imgRef.current
        if (!img || !crop) return
        setBusy(true)

        const canvas = document.createElement("canvas")
        canvas.width = outW
        canvas.height = outH
        const ctx = canvas.getContext("2d")
        if (!ctx) {
            setBusy(false)
            alert("Your browser could not process this image.")
            return
        }
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, outW, outH)

        canvas.toBlob(
            (blob) => {
                setBusy(false)
                if (!blob) {
                    alert("Failed to export the image.")
                    return
                }
                const base = fileName.replace(/\.[^.]+$/, "") || "image"
                onApply(new File([blob], `${base}.${format.ext}`, { type: format.type, lastModified: Date.now() }))
            },
            format.type,
            0.92
        )
    }

    const box = crop && factor
        ? { left: crop.x * factor, top: crop.y * factor, width: crop.w * factor, height: crop.h * factor }
        : null

    const isReady = !!natural && !!crop

    return (
        <div className="flex flex-col gap-4 w-full text-gray-800">
            {/* Stage */}
            <div className="flex justify-center items-center bg-gray-900/90 rounded-2xl p-3 min-h-40">
                {loadError ? (
                    <p className="text-sm text-red-300 py-10">Could not load this image for editing.</p>
                ) : (
                    <div
                        ref={stageRef}
                        className="relative inline-block overflow-hidden select-none touch-none"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            ref={imgRef}
                            src={src}
                            alt="Image to crop"
                            draggable={false}
                            onLoad={handleLoad}
                            onError={() => setLoadError(true)}
                            className="block max-w-full max-h-[50vh] w-auto h-auto pointer-events-none"
                        />

                        {box && (
                            <div
                                data-dir="move"
                                className="absolute border border-white cursor-move"
                                style={{
                                    left: box.left,
                                    top: box.top,
                                    width: box.width,
                                    height: box.height,
                                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                                }}
                            >
                                {/* rule-of-thirds guides */}
                                <div className="absolute inset-0 pointer-events-none opacity-40">
                                    <div className="absolute left-1/3 top-0 bottom-0 border-l border-white" />
                                    <div className="absolute left-2/3 top-0 bottom-0 border-l border-white" />
                                    <div className="absolute top-1/3 left-0 right-0 border-t border-white" />
                                    <div className="absolute top-2/3 left-0 right-0 border-t border-white" />
                                </div>
                                {HANDLES.map((h) => (
                                    <div
                                        key={h.dir}
                                        data-dir={h.dir}
                                        className={`absolute w-4 h-4 rounded-sm bg-white border border-sky-500 shadow ${h.className}`}
                                        style={{ cursor: h.cursor }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isReady && (
                <>
                    {/* Aspect ratio */}
                    <div className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">Crop shape</span>
                        <div className="flex flex-wrap gap-2">
                            {ASPECTS.map((a) => (
                                <button
                                    key={a.label}
                                    type="button"
                                    onClick={() => chooseAspect(a.label, a.value)}
                                    className={`px-3 py-1 rounded-full text-sm border transition ${
                                        aspectLabel === a.label
                                            ? "bg-neutral-900 text-white border-neutral-900"
                                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                    }`}
                                >
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Resize */}
                    <div className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">Output size</span>
                        <div className="flex flex-wrap items-center gap-2">
                            {SCALE_PRESETS.map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setScale(p)}
                                    className={`px-3 py-1 rounded-full text-sm border transition ${
                                        Math.round(effectiveScale) === p
                                            ? "bg-neutral-900 text-white border-neutral-900"
                                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                    }`}
                                >
                                    {p}%
                                </button>
                            ))}
                            <div className="flex items-center gap-1.5 ml-auto">
                                <input
                                    type="number"
                                    min={1}
                                    max={MAX_OUTPUT_SIDE}
                                    value={outW}
                                    onChange={(e) => setOutWidth(Number(e.target.value))}
                                    aria-label="Output width in pixels"
                                    className="w-20 text-black border border-gray-200 rounded-lg text-sm px-2 py-1 bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                                />
                                <span className="text-gray-500 text-sm">×</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={MAX_OUTPUT_SIDE}
                                    value={outH}
                                    onChange={(e) => setOutHeight(Number(e.target.value))}
                                    aria-label="Output height in pixels"
                                    className="w-20 text-black border border-gray-200 rounded-lg text-sm px-2 py-1 bg-gray-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                                />
                                <span className="text-gray-500 text-sm">px</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400">
                            Original: {natural!.w} × {natural!.h}px · Width and height stay in proportion.
                            {mimeType === "image/gif" && " Animated GIFs become a still PNG."}
                        </p>
                    </div>
                </>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="rounded-full px-5 border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                    Cancel
                </Button>
                {isReady && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={resetCrop}
                        className="rounded-full px-5 border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                        Reset
                    </Button>
                )}
                {onSkip && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onSkip}
                        className="rounded-full px-5 border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                        Use original
                    </Button>
                )}
                <Button
                    type="button"
                    onClick={apply}
                    disabled={!isReady || busy}
                    className="rounded-full px-6 bg-neutral-900 hover:bg-black text-white disabled:opacity-50"
                >
                    {busy ? "Processing..." : applyLabel}
                </Button>
            </div>
        </div>
    )
}
