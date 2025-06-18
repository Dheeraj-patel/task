const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Ensure the PDF output directory exists
const pdfOutputDir = path.join(__dirname, 'pdf_exports');
if (!fs.existsSync(pdfOutputDir)) {
    fs.mkdirSync(pdfOutputDir);
}

app.post('/generate-pdf', (req, res) => {
    const data = req.body;

    // Create a new PDF document with A4 size and adjusted margins
    const doc = new PDFDocument({
        size: 'A4',
        margins: {
            top: 30,    // Adjusted top margin
            bottom: 30, // Adjusted bottom margin
            left: 30,   // Adjusted left margin
            right: 30   // Adjusted right margin
        }
    });

    const fileName = `certificate_${Date.now()}.pdf`;
    const outputPath = path.join(pdfOutputDir, fileName);

    doc.pipe(fs.createWriteStream(outputPath));

    // --- Start PDF Content Generation ---

    // Define border properties
    const borderWidth = 5;
    const borderColor = '#0066cc'; // A shade of blue

    // Draw the outer border
    doc.lineWidth(borderWidth)
       .rect(borderWidth / 2, borderWidth / 2, doc.page.width - borderWidth, doc.page.height - borderWidth)
       .stroke(borderColor);

    // Draw the inner border (slightly offset)
    const innerBorderOffset = 15;
    doc.lineWidth(2)
       .rect(innerBorderOffset, innerBorderOffset, doc.page.width - (2 * innerBorderOffset), doc.page.height - (2 * innerBorderOffset))
       .stroke(borderColor);

    // Fill the background of the certificate area (inside the inner border) with a light blue
    doc.fillColor('#e6f2ff') // Light blue background color
       .rect(innerBorderOffset, innerBorderOffset, doc.page.width - (2 * innerBorderOffset), doc.page.height - (2 * innerBorderOffset))
       .fill();

    // Reset fill color for text
    doc.fillColor('black');

    // --- Top Section: Logo, Contact, Address ---
    const topSectionY = 60; // Common Y-coordinate for the top row elements

    // MSME logo
    const msmeLogoPath = path.join(__dirname, 'images', 'msme_logo.png');
    const logoWidth = 70;
    const logoHeight = 70;
    const logoX = doc.page.width / 2 - logoWidth / 2; // Center logo horizontally

    if (fs.existsSync(msmeLogoPath)) {
        doc.image(msmeLogoPath, logoX, topSectionY, {
            width: logoWidth,
            height: logoHeight
        });
    } else {
        console.warn('MSME logo not found at specified path:', msmeLogoPath);
    }

    // Register-Id, E-Mail, Phone No. (Left side)
    const leftColX = 55; // Adjusted X for left column
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('black');
    doc.text(`Register-Id:- ${data.registerId || 'N/A'}`, leftColX, topSectionY);
    doc.text(`E-Mail: ${data.email || 'N/A'}`, leftColX, topSectionY + 15);
    doc.text(`Phone No.: ${data.phoneNo || 'N/A'}`, leftColX, topSectionY + 30);

    // Address (Right side)
    const rightColX = doc.page.width - 200; // Adjusted X for right column, approx 200px from right edge
    doc.text(`Anand Farm, Sector 22`, rightColX, topSectionY);
    doc.text(`Gurugram (122016)`, rightColX, topSectionY + 15);
    doc.text(`(Haryana) India`, rightColX, topSectionY + 30);

    // --- Main Certificate Title ---
    const titleY = 200; // Fixed Y position for the main title
    doc.font('Helvetica-BoldOblique')
       .fontSize(24)
       .fillColor('#0066cc')
       .text('Certificate of Half Marathon', 0, titleY, { align: 'center' });

    // --- Presented To Section ---
    const presentedToY = titleY + 50; // Y position relative to title
    doc.font('Helvetica')
       .fontSize(14)
       .fillColor('black')
       .text('This Certificate Presented to', 0, presentedToY, { align: 'center' });

    const participantNameY = presentedToY + 25; // Y position relative to "Presented to"
    doc.font('Helvetica-Bold')
       .fontSize(28)
       .fillColor('#8b0000') // Dark red/maroon color
       .text(data.participantName || 'Participant Name', 0, participantNameY, { align: 'center' });

    // --- Description Text ---
    const descriptionY = participantNameY + 70; // Y position relative to participant name
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('black')
       .text('The certificate of achievement is awarded to individuals who have demonstrated outstanding performance in their field. Here\'s an example text for a certificate.',
           doc.page.margins.left + 50, descriptionY, { // Start 50px from left margin
           width: doc.page.width - (doc.page.margins.left + 50) * 2, // Adjust width to center
           align: 'center',
           paragraphGap: 5 // Reduced paragraph gap
       });

    // --- Bottom Details Section ---
    const bottomDetailsY = doc.page.height - 180; // Fixed Y position for this row
    doc.font('Helvetica')
       .fontSize(12)
       .fillColor('black');

    // Date of Birth (Left)
    doc.text(`Date of Birth: ${data.dateOfBirth || 'N/A'}`, leftColX, bottomDetailsY);

    // Gender (Middle)
    doc.text(`Gender: ${data.gender || 'N/A'}`, leftColX + 220, bottomDetailsY); // Adjusted X for middle

    // Blood Group (Right)
    doc.text(`Blood Group: ${data.bloodGroup || 'N/A'}`, rightColX, bottomDetailsY);

    // --- Date-Time, Seal, Signature ---
    const bottomRowY = doc.page.height - 90; // Y position for the bottom row elements

    // Date-Time
    doc.font('Helvetica')
       .fontSize(12)
       .text(`${data.dateTime || 'N/A'}`, leftColX, bottomRowY);
    doc.fontSize(10)
       .text(`DATE-TIME`, leftColX, bottomRowY + 15);

    // "CERTIFIED PROFESSIONAL" Seal
    const sealImagePath = path.join(__dirname, 'images', 'certified_seal.png');
    const sealWidth = 80; // Adjusted width
    const sealHeight = 80; // Adjusted height
    const sealX = doc.page.width / 2 - sealWidth / 2; // Center horizontally
    const sealY = bottomRowY - 50; // Position above the DATE-TIME/SIGNATURE line

    if (fs.existsSync(sealImagePath)) {
        doc.image(sealImagePath, sealX, sealY, {
            width: sealWidth,
            height: sealHeight
        });
        // Position "CERTIFIED PROFESSIONAL" text below the seal if needed, but seal already has text
        // doc.font('Helvetica-Bold').fontSize(8).text('CERTIFIED PROFESSIONAL', sealX, sealY + sealHeight + 2, { width: sealWidth, align: 'center' });
    } else {
        console.warn('Certified seal image not found at specified path:', sealImagePath);
        doc.font('Helvetica-Bold').fontSize(10).text('CERTIFIED PROFESSIONAL', sealX, sealY + sealHeight / 2, { width: sealWidth, align: 'center' });
    }

    // SIGNATURE
    doc.font('Helvetica')
       .fontSize(10)
       .text(`SIGNATURE`, rightColX, bottomRowY + 15); // Align with DATE-TIME label

    // --- End PDF Content Generation ---

    // Finalize PDF file
    doc.end();

    doc.on('end', () => {
        res.status(200).json({
            message: 'PDF generated successfully',
            filePath: outputPath
        });
    });

    doc.on('error', (err) => {
        console.error('Error generating PDF:', err);
        res.status(500).json({ error: 'Failed to generate PDF' });
    });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});