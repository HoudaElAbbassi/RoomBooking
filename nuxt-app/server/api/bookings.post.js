export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    // Validierung
    if (!body.roomId || !body.date || !body.timeSlot || !body.title || !body.contactName) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Fehlende Pflichtfelder'
        })
    }

    // In einer echten Anwendung würde hier die Buchung in einer Datenbank gespeichert werden
    // Für dieses Beispiel geben wir einfach eine neue ID zurück
    return {
        id: Date.now(),
        ...body
    }
})