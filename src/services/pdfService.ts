import jsPDF from "jspdf"
import "jspdf-autotable"
import html2canvas from "html2canvas"

export const pdfService = {
  exportHtmlToPdf: async (elementId: string, fileName: string, isLandscape = false) => {
    const element = document.getElementById(elementId)
    if (!element) return

    const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false })
    const imgData = canvas.toDataURL("image/png")
    
    const pdf = new jsPDF({
      orientation: isLandscape ? "landscape" : "portrait",
      unit: "mm",
      format: "a4"
    })
    
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    
    // If the content is taller than A4 page, it might get cut off or stretch.
    // For single page slips, it's fine. For multi-page, use react-to-print or jspdf-autotable
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
    pdf.save(`${fileName}.pdf`)
  },
  
  exportTableToPdf: (columns: string[], data: any[][], fileName: string, title?: string, isLandscape = false) => {
    const doc = new jsPDF({
      orientation: isLandscape ? "landscape" : "portrait"
    })
    
    if (title) {
      doc.setFontSize(14)
      doc.text(title, 14, 15)
    }
    
    // @ts-ignore - jspdf-autotable adds autoTable to jsPDF instance
    doc.autoTable({
      head: [columns],
      body: data,
      startY: title ? 25 : 10,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    })
    
    doc.save(`${fileName}.pdf`)
  }
}
