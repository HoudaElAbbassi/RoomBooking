export default defineEventHandler(async (event) => {
    // Daten würden normalerweise aus einer Datenbank geholt werden
    return [
        {
            id: 1,
            roomId: 1,
            title: "Team-Meeting",
            description: "Wöchentliches Team-Meeting",
            contactName: "Max Mustermann",
            date: "2025-04-24",
            timeSlot: "09:00"
        },
        // Weitere Buchungen...
    ]
})