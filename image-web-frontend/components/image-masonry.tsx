/* eslint-disable @next/next/no-img-element */
import Link from "next/link"

export interface MasonryImage {
    id: number
    title: string
    image_url: string
    username?: string
}

export default function ImageMasonry({
    images,
    badge,
}: {
    images: MasonryImage[]
    badge?: (image: any) => React.ReactNode
}) {
    return (
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4">
            {images.map((image, i) => {
                const label = badge?.(image)
                return (
                    <Link
                        key={image.id}
                        href={`/image/${image.id}`}
                        className="tile-in group relative block mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-white/50 shadow-md hover:shadow-2xl hover:shadow-sky-900/25 hover:-translate-y-1 transition duration-300"
                        style={{ animationDelay: `${Math.min(i, 20) * 35}ms` }}
                    >
                        <img src={image.image_url} alt={image.title} loading="lazy" className="block w-full h-auto transition duration-500 group-hover:scale-[1.04]" />
                        {label && (
                            <span className="absolute top-2 left-2 max-w-[85%] truncate rounded-full bg-white/90 text-sky-700 text-xs font-semibold px-2.5 py-1 shadow-sm">
                                {label}
                            </span>
                        )}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-sky-950/75 via-sky-950/30 to-transparent px-3 pt-10 pb-2.5 opacity-0 group-hover:opacity-100 transition duration-300">
                            <p className="text-white text-sm font-semibold truncate">{image.title}</p>
                            {image.username && <p className="text-white/80 text-xs truncate">by {image.username}</p>}
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}
