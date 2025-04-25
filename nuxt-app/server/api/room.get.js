export default defineEventHandler(async (event) => {
    // In einer echten Anwendung würden diese Daten aus einer Datenbank kommen
    return [
        {
            id: 1,
            name: "Jemia",
            capacity: 30,
            location: "Heinrich Lübcke Strasse",
            features: ["Beamer", "Whiteboard", "Mikrofone"],
            description: "Ideal für kleinere Team-Meetings und Präsentationen."
        },
        // Weitere Räume...
    ]
})