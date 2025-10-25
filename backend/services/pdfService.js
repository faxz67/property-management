const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const FrenchBillTemplate = require('./frenchBillTemplate');

class PDFService {
  /**
   * Generate a PDF receipt for a bill
   * @param {Object} bill - Bill object with tenant, property, and admin data
   * @returns {Buffer} PDF buffer
   */
  static async generateReceipt(bill) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Header
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('RENT RECEIPT', { align: 'center' });

        doc.moveDown(0.5);

        // Company/Property Management Info
        doc.fontSize(12)
           .font('Helvetica')
           .text('Property Management System', { align: 'center' });

        doc.moveDown(1);

        // Receipt Details
        const receiptDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Receipt Details', { underline: true });

        doc.moveDown(0.3);

        // Receipt table
        const tableData = [
          ['Receipt Number:', `#${bill.id}`],
          ['Date:', receiptDate],
          ['Month:', bill.month],
          ['Due Date:', new Date(bill.due_date).toLocaleDateString('en-US')],
          ['Status:', bill.status],
          ['', ''], // Empty row
          ['Tenant Information:', ''],
          ['Name:', bill.tenant.name],
          ['Email:', bill.tenant.email || 'N/A'],
          ['Phone:', bill.tenant.phone || 'N/A'],
          ['', ''], // Empty row
          ['Property Information:', ''],
          ['Property:', bill.property.title],
          ['Address:', bill.property.address],
          ['City:', bill.property.city],
          ['', ''], // Empty row
          ['Payment Details:', ''],
          ['Amount:', `$${parseFloat(bill.amount).toFixed(2)}`],
          ['Description:', bill.description || 'Monthly rent payment']
        ];

        // Draw table
        let yPosition = doc.y;
        const rowHeight = 20;
        const col1Width = 150;
        const col2Width = 300;

        tableData.forEach((row, index) => {
          if (row[0] === '' && row[1] === '') {
            // Empty row
            yPosition += 10;
            return;
          }

          // Draw row background
          if (row[0].includes('Information:') || row[0].includes('Details:')) {
            doc.rect(50, yPosition, 500, rowHeight)
               .fill('#f0f0f0');
          }

          // Draw text
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .text(row[0], 60, yPosition + 5, { width: col1Width });

          doc.font('Helvetica')
             .text(row[1], 60 + col1Width, yPosition + 5, { width: col2Width });

          yPosition += rowHeight;
        });

        // Move to bottom for signature
        doc.moveTo(50, yPosition + 20)
           .lineTo(550, yPosition + 20)
           .stroke();

        doc.fontSize(10)
           .font('Helvetica')
           .text('Signature', 50, yPosition + 30);

        doc.text('Date: _______________', 300, yPosition + 30);

        // Footer
        doc.fontSize(8)
           .text('This is a computer-generated receipt. No signature required.', 
                 { align: 'center', y: doc.page.height - 100 });

        doc.text(`Generated on ${new Date().toLocaleString()}`, 
                 { align: 'center', y: doc.page.height - 80 });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate a PDF for multiple bills (summary report)
   * @param {Array} bills - Array of bill objects
   * @param {Object} admin - Admin object
   * @returns {Buffer} PDF buffer
   */
  static async generateBillsSummary(bills, admin) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Header
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('BILLS SUMMARY REPORT', { align: 'center' });

        doc.moveDown(0.5);

        doc.fontSize(12)
           .font('Helvetica')
           .text(`Generated for: ${admin.name}`, { align: 'center' });

        doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });

        doc.moveDown(1);

        // Summary statistics
        const totalBills = bills.length;
        const totalAmount = bills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
        const pendingBills = bills.filter(bill => bill.status === 'PENDING').length;
        const paidBills = bills.filter(bill => bill.status === 'PAID').length;
        const overdueBills = bills.filter(bill => bill.status === 'OVERDUE').length;

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Summary Statistics', { underline: true });

        doc.moveDown(0.3);

        const summaryData = [
          ['Total Bills:', totalBills.toString()],
          ['Total Amount:', `$${totalAmount.toFixed(2)}`],
          ['Pending Bills:', pendingBills.toString()],
          ['Paid Bills:', paidBills.toString()],
          ['Overdue Bills:', overdueBills.toString()]
        ];

        let yPosition = doc.y;
        const rowHeight = 20;
        const col1Width = 150;
        const col2Width = 100;

        summaryData.forEach((row) => {
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .text(row[0], 60, yPosition + 5, { width: col1Width });

          doc.font('Helvetica')
             .text(row[1], 60 + col1Width, yPosition + 5, { width: col2Width });

          yPosition += rowHeight;
        });

        doc.moveDown(1);

        // Bills table
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Bills Details', { underline: true });

        doc.moveDown(0.3);

        // Table headers
        const headers = ['ID', 'Tenant', 'Property', 'Amount', 'Month', 'Status', 'Due Date'];
        const colWidths = [40, 100, 120, 60, 80, 60, 80];

        yPosition = doc.y;
        let xPosition = 50;

        // Draw header background
        doc.rect(50, yPosition, 500, 25)
           .fill('#e0e0e0');

        headers.forEach((header, index) => {
          doc.fontSize(9)
             .font('Helvetica-Bold')
             .text(header, xPosition + 5, yPosition + 8, { width: colWidths[index] });
          xPosition += colWidths[index];
        });

        yPosition += 30;

        // Draw bills data
        bills.forEach((bill, index) => {
          if (yPosition > doc.page.height - 100) {
            doc.addPage();
            yPosition = 50;
          }

          const rowData = [
            bill.id.toString(),
            bill.tenant.name,
            bill.property.title,
            `$${parseFloat(bill.amount).toFixed(2)}`,
            bill.month,
            bill.status,
            new Date(bill.due_date).toLocaleDateString()
          ];

          xPosition = 50;
          rowData.forEach((cell, cellIndex) => {
            doc.fontSize(8)
               .font('Helvetica')
               .text(cell, xPosition + 5, yPosition + 5, { width: colWidths[cellIndex] });
            xPosition += colWidths[cellIndex];
          });

          yPosition += 20;
        });

        // Footer
        doc.fontSize(8)
           .text('This is a computer-generated report.', 
                 { align: 'center', y: doc.page.height - 100 });

        doc.text(`Generated on ${new Date().toLocaleString()}`, 
                 { align: 'center', y: doc.page.height - 80 });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate a PDF bill (French format)
   * @param {Object} bill - Bill object with tenant, property, and admin data
   * @returns {string} PDF file path
   */
  static async generateBillPDF(bill) {
    return new Promise((resolve, reject) => {
      try {
        // Generate French bill content
        const frenchContent = FrenchBillTemplate.generateBillContent(bill);
        
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: 'Facture de Loyer',
            Author: 'Système de Gestion Immobilière',
            Subject: `Facture ${bill.month}`,
            Creator: 'Property Management System'
          }
        });

        // Create temporary file path
        const fileName = `bill_${bill.id}_${bill.month}_${Date.now()}.pdf`;
        const filePath = path.join(__dirname, '../uploads/bills', fileName);
        
        // Ensure temp directory exists
        const outDir = path.dirname(filePath);
        if (!require('fs').existsSync(outDir)) {
          require('fs').mkdirSync(outDir, { recursive: true });
        }

        // Create write stream
        const stream = require('fs').createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text(frenchContent.title, { align: 'center' });

        doc.moveDown(0.3);

        doc.fontSize(14)
           .font('Helvetica')
           .text(frenchContent.subtitle, { align: 'center' });

        doc.moveDown(1);

        // Landlord Information (Bailleur)
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('Nom, prénom du bailleur', 60, doc.y);
        
        doc.fontSize(10)
           .font('Helvetica')
           .text(frenchContent.landlordInfo.name || 'Adresse du bailleur', 60, doc.y);

        doc.moveDown(1);

        // Tenant Information (Locataire) - aligned to right
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('Nom, prénom du locataire', 350, doc.y - 40);
        
        doc.fontSize(10)
           .font('Helvetica')
           .text(frenchContent.tenantInfo.name, 350, doc.y - 25);
        
        doc.text('Adresse postale', 350, doc.y - 10);

        doc.moveDown(2);

        // Payment date (aligned right)
        const paymentDateText = frenchContent.paymentInfo.paymentDate;
        doc.fontSize(10)
           .font('Helvetica')
           .text(paymentDateText, 350, doc.y);

        doc.moveDown(1);

        // Property Address (Adresse de la location)
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('Adresse de la location :', 60, doc.y, { underline: true });

        doc.moveDown(0.3);

        doc.fontSize(10)
           .font('Helvetica')
           .text(frenchContent.propertyInfo.fullAddress, 60, doc.y);

        doc.moveDown(1.5);

        // Payment declaration text
        doc.fontSize(10)
           .font('Helvetica')
           .text(
             `Je soussigné ... (nom du bailleur) propriétaire du logement désigné ci-dessus, déclare avoir reçu de Monsieur / Madame (nom du locataire), la somme de ... euros (montant reçu écrit en chiffres), au titre du paiement du loyer et des charges pour la période de location du ... (début de la mensualité) au ... (échéance de la mensualité) et lui en donne quittance, sous réserve de tous mes droits.`,
             60, 
             doc.y,
             { width: 480, align: 'justify' }
           );

        doc.moveDown(1.5);

        // Payment Details (Détail du règlement)
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('Détail du règlement :', 60, doc.y, { underline: true });

        doc.moveDown(0.5);

        let yPosition = doc.y;
        const rowHeight = 18;
        const col1Width = 250;
        const col2Width = 150;

        // Loyer
        frenchContent.billDetails.items.forEach((item) => {
          doc.fontSize(10)
             .font('Helvetica')
             .text(`${item.description} :`, 80, yPosition, { width: col1Width });

          doc.text(`${item.amount} euros`, 80 + col1Width, yPosition, { width: col2Width, align: 'right' });

          yPosition += rowHeight;
        });

        // Empty row for (le cas échéant, contribution aux économies d'énergies)
        doc.fontSize(9)
           .font('Helvetica-Oblique')
           .text('(le cas échéant, contribution aux économies d\'énergies) :', 80, yPosition, { width: col1Width });
        doc.text('....... euros', 80 + col1Width, yPosition, { width: col2Width, align: 'right' });

        yPosition += rowHeight + 5;

        // Total
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('Total :', 80, yPosition, { width: col1Width });

        doc.text(`${frenchContent.billDetails.total.amount} euros`, 80 + col1Width, yPosition, { width: col2Width, align: 'right' });

        doc.moveDown(2);

        // Date de paiement
        yPosition = doc.y + 20;
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Date du paiement : le ...... / ...... / 20......`, 80, yPosition);

        doc.moveDown(1.5);

        // Signature
        doc.fontSize(10)
           .font('Helvetica-Oblique')
           .text(frenchContent.footer.signature, 350, doc.y);

        doc.moveDown(4);

        // Footer note
        doc.fontSize(7)
           .font('Helvetica')
           .text(frenchContent.footer.note, 60, doc.page.height - 120, { 
             width: 480, 
             align: 'center',
             lineGap: 2
           });

        // Handle stream end
        stream.on('finish', () => {
          resolve(filePath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stream a PDF bill directly to HTTP response (avoids temp files)
   * @param {Object} res - Express response
   * @param {Object} bill - Bill object with associations
   */
  static streamBillPDF(res, bill) {
    // Generate French bill content
    const frenchContent = FrenchBillTemplate.generateBillContent(bill);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: 'Quittance de Loyer',
        Author: 'Système de Gestion Immobilière',
        Subject: `Quittance ${bill.month}`,
        Creator: 'Property Management System'
      }
    });

    // Set headers before piping
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="quittance-${bill.id}-${bill.month}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Pipe directly to response
    doc.pipe(res);

    // Professional Header with border
    doc.rect(40, 40, 515, 80).stroke('#333333');
    
    // Main Title
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text(frenchContent.title, 50, 60, { align: 'center', width: 495 });

    // Subtitle
    doc.fontSize(16)
       .font('Helvetica')
       .fillColor('#34495e')
       .text(frenchContent.subtitle, 50, 95, { align: 'center', width: 495 });

    doc.moveDown(2);

    // Bill Information Section
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('INFORMATIONS DE LA QUITTANCE', 50, doc.y);

    doc.moveDown(0.5);

    // Bill info in a professional table format
    const billInfo = [
      ['Numéro de quittance:', frenchContent.billInfo.billNumber],
      ['Date de la quittance:', frenchContent.billInfo.billDate],
      ['Date d\'échéance:', frenchContent.billInfo.dueDate],
      ['Période de loyer:', frenchContent.billInfo.month]
    ];

    let yPosition = doc.y;
    const rowHeight = 20;
    const col1Width = 150;
    const col2Width = 300;

    // Draw table background
    doc.rect(50, yPosition - 5, 495, billInfo.length * rowHeight + 10)
       .fillAndStroke('#f8f9fa', '#dee2e6');

    billInfo.forEach((row, index) => {
      const rowY = yPosition + (index * rowHeight);
      
      // Label
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#495057')
         .text(row[0], 60, rowY + 5, { width: col1Width });

      // Value
      doc.font('Helvetica')
         .fillColor('#212529')
         .text(row[1], 60 + col1Width, rowY + 5, { width: col2Width });
    });

    doc.y = yPosition + (billInfo.length * rowHeight) + 20;

    // Two-column layout for tenant and property info
    const leftColumnX = 50;
    const rightColumnX = 320;
    const columnWidth = 250;

    // Tenant Information (Left Column)
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text(frenchContent.tenantInfo.title, leftColumnX, doc.y);

    doc.moveDown(0.3);

    const tenantInfo = [
      ['Nom complet:', frenchContent.tenantInfo.name],
      ['Email:', frenchContent.tenantInfo.email],
      ['Téléphone:', frenchContent.tenantInfo.phone]
    ];

    yPosition = doc.y;
    doc.rect(leftColumnX, yPosition - 5, columnWidth, tenantInfo.length * rowHeight + 10)
       .fillAndStroke('#e3f2fd', '#bbdefb');

    tenantInfo.forEach((row, index) => {
      const rowY = yPosition + (index * rowHeight);
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#1565c0')
         .text(row[0], leftColumnX + 10, rowY + 5, { width: 100 });

      doc.font('Helvetica')
         .fillColor('#0d47a1')
         .text(row[1], leftColumnX + 120, rowY + 5, { width: 120 });
    });

    // Property Information (Right Column)
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text(frenchContent.propertyInfo.title, rightColumnX, yPosition - 30);

    const propertyInfo = [
      ['Propriété:', frenchContent.propertyInfo.name],
      ['Adresse:', frenchContent.propertyInfo.address],
      ['Ville:', frenchContent.propertyInfo.city],
      ['Pays:', frenchContent.propertyInfo.country]
    ];

    doc.rect(rightColumnX, yPosition - 5, columnWidth, propertyInfo.length * rowHeight + 10)
       .fillAndStroke('#f3e5f5', '#e1bee7');

    propertyInfo.forEach((row, index) => {
      const rowY = yPosition + (index * rowHeight);
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#7b1fa2')
         .text(row[0], rightColumnX + 10, rowY + 5, { width: 100 });

      doc.font('Helvetica')
         .fillColor('#4a148c')
         .text(row[1], rightColumnX + 120, rowY + 5, { width: 120 });
    });

    doc.y = yPosition + Math.max(tenantInfo.length, propertyInfo.length) * rowHeight + 30;

    // Payment Details Section
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text(frenchContent.billDetails.title, 50, doc.y);

    doc.moveDown(0.5);

    // Professional payment table
    const tableStartY = doc.y;
    const tableWidth = 495;
    const itemColWidth = 350;
    const amountColWidth = 120;

    // Table header with professional styling
    doc.rect(50, tableStartY, tableWidth, 30)
       .fillAndStroke('#2c3e50', '#2c3e50');

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text('DÉTAIL DU RÈGLEMENT', 60, tableStartY + 8, { width: itemColWidth });

    doc.text('MONTANT', 60 + itemColWidth, tableStartY + 8, { width: amountColWidth, align: 'right' });

    // Bill items with alternating colors
    let currentY = tableStartY + 30;
    frenchContent.billDetails.items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      const bgColor = isEven ? '#f8f9fa' : '#ffffff';
      
      doc.rect(50, currentY, tableWidth, 25)
         .fillAndStroke(bgColor, '#dee2e6');

      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#495057')
         .text(item.description, 60, currentY + 7, { width: itemColWidth });

      doc.font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text(`${item.amount} ${item.currency}`, 60 + itemColWidth, currentY + 7, { width: amountColWidth, align: 'right' });

      currentY += 25;
    });

    // Total row with emphasis
    doc.rect(50, currentY, tableWidth, 35)
       .fillAndStroke('#28a745', '#28a745');

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text(frenchContent.billDetails.total.label, 60, currentY + 10, { width: itemColWidth });

    doc.text(`${frenchContent.billDetails.total.amount} ${frenchContent.billDetails.total.currency}`, 
             60 + itemColWidth, currentY + 10, { width: amountColWidth, align: 'right' });

    doc.y = currentY + 50;

    // Payment Declaration Section
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text(frenchContent.paymentInfo.title, 50, doc.y);

    doc.moveDown(0.5);

    // Declaration box
    const declarationY = doc.y;
    doc.rect(50, declarationY, 495, 80)
       .fillAndStroke('#fff3cd', '#ffeaa7');

    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#856404')
       .text(frenchContent.paymentInfo.instructions[0], 60, declarationY + 15, { 
         width: 475, 
         align: 'justify' 
       });

    doc.moveDown(2);

    // Signature section
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('Signature du bailleur:', 50, doc.y);

    doc.moveDown(1);

    // Signature line
    doc.moveTo(50, doc.y)
       .lineTo(250, doc.y)
       .stroke('#2c3e50');

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#6c757d')
       .text('Date et signature', 50, doc.y + 5);

    // Date and place
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#495057')
       .text(frenchContent.paymentInfo.paymentDate, 300, doc.y - 15);

    doc.moveDown(2);

    // Professional footer
    doc.rect(40, doc.y, 515, 40)
       .fillAndStroke('#f8f9fa', '#dee2e6');

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#6c757d')
       .text('Document généré automatiquement par le Système de Gestion Immobilière', 50, doc.y + 10, { align: 'center', width: 495 });

    doc.text(`Quittance générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 50, doc.y + 25, { align: 'center', width: 495 });

    // Finalize
    doc.end();
  }
}

module.exports = PDFService;
