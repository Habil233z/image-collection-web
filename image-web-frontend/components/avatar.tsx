export default function Avatar({
    src,
    alt = "Avatar",
    className = "h-10 w-10",
}: {
    src?: string | null
    alt?: string
    className?: string
}) {
    return (
        <img
            src={src || "/user.png"}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/user.png" }}
            alt={alt}
            className={`${className} shrink-0 rounded-full object-cover bg-white ring-2 ring-white shadow-sm`}
        />
    )
}
