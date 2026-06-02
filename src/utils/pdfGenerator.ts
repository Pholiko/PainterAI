import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateOfferPDF = (project: any, userProfile: any) => {
    const doc = new jsPDF();

    const primaryColor: [number, number, number] = [41, 128, 185]; // Blue

    // Header
    doc.setFontSize(20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(String(userProfile.companyName || "Painter AI Demo Co."), 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Email: ${userProfile.email}`, 14, 28);
    doc.text(`Datum: ${new Date().toLocaleDateString()}`, 14, 33);

    // Title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(`Angebot: ${project.name}`, 14, 45);

    // Customer Info (Mock if not present)
    doc.setFontSize(11);
    doc.text(`Kunde: ${project.clientName || "Max Mustermann"}`, 14, 52);

    // Helper to get correct JS format for jsPDF
    const getMpx = (dataUri: string) => dataUri.includes("png") ? "PNG" : dataUri.includes("webp") ? "WEBP" : "JPEG";

    if (project.originalImage) {
        try {
            doc.addImage(project.originalImage, getMpx(project.originalImage), 14, 60, 80, 50);
        } catch (e) {
            console.error("Error drawing originalImage", e);
        }
    }

    const secondImg = project.generatedImage || project.originalImage;
    if (secondImg) {
        try {
            doc.addImage(secondImg, getMpx(secondImg), 110, 60, 80, 50);
        } catch (e) {
            console.error("Error drawing generatedImage", e);
        }
    }

    let yPos = 120;

    // Analysis Data
    const analysis = typeof project.analysisData === 'string'
        ? JSON.parse(project.analysisData)
        : project.analysisData;

    if (analysis?.analysis?.calculation) {
        const calc = analysis.analysis.calculation;
        const details = analysis.analysis.details;

        // Scope of Work
        doc.setFontSize(14);
        doc.text("Leistungsbeschreibung", 14, yPos);
        yPos += 7;

        doc.setFontSize(10);
        doc.text(`Wandfläche: ${analysis.analysis.dimensions.area} m²`, 14, yPos);
        yPos += 5;
        doc.text(`Kondition: ${details?.condition || 'Standard'}`, 14, yPos);
        yPos += 5;

        if (details?.steps && Array.isArray(details.steps)) {
            doc.text("Vorbereitung:", 14, yPos);
            yPos += 5;
            details.steps.forEach((step: string) => {
                doc.text(`• ${step}`, 20, yPos);
                yPos += 5;
            });
        }

        yPos += 5;

        // Price Table
        // @ts-ignore
        autoTable(doc, {
            startY: yPos,
            head: [['Position', 'Menge', 'Einzelpreis', 'Gesamt']],
            body: [
                ['Material (Farbe)', `${calc.paintLiters} Liter`, `${calc.ratesUsed?.material?.toFixed(2)} €`, `${calc.materialCost?.toFixed(2)} €`],
                ['Arbeit (Stunden)', `${calc.laborHours?.toFixed(2)} Std`, `${calc.ratesUsed?.hourly?.toFixed(2)} €`, `${calc.laborCost?.toFixed(2)} €`],
                ['', '', 'Netto', `${calc.netPrice?.toFixed(2)} €`],
                ['', '', 'MwSt (19%)', `${calc.tax?.toFixed(2)} €`],
                ['', '', 'GESAMT', `${calc.totalPrice?.toFixed(2)} €`]
            ],
            theme: 'striped',
            headStyles: { fillColor: primaryColor }
        });

    } else {
        doc.text("Keine detaillierte Analyse vorhanden.", 14, yPos);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Dieses Angebot wurde automatisch mit Painter AI erstellt.", 14, pageHeight - 10);

    doc.save(`Angebot_${project.name}.pdf`);
};
