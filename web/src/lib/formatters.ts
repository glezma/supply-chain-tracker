export function formatDate(timestamp: bigint | number | string): string {
    // Handle empty or zero timestamps to avoid 1969/1970 dates
    if (!timestamp || timestamp === BigInt(0) || timestamp == 0) {
        return 'Pending';
    }

    const date = new Date(Number(timestamp) * 1000);

    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short' // e.g. "EST" or "UTC"
    });
}
