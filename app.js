const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;


app.use(express.json());


const pdfOutputDir = path.join(__dirname, 'pdf_exports');
if (!fs.existsSync(pdfOutputDir)) {
    fs.mkdirSync(pdfOutputDir);
}

app.post('/generate-pdf', (req, res) => {
    const data = req.body;

    
    const doc = new PDFDocument({
        size: 'A4',
        margins: {
            top: 30,    
            bottom: 30, 
            left: 30,   
            right: 30   
        }
    });

    const fileName = `certificate_${Date.now()}.pdf`;
    const outputPath = path.join(pdfOutputDir, fileName);

    doc.pipe(fs.createWriteStream(outputPath));

    

    const borderWidth = 5;
    const borderColor = '#0066cc'; 

    
    doc.lineWidth(borderWidth)
       .rect(borderWidth / 2, borderWidth / 2, doc.page.width - borderWidth, doc.page.height - borderWidth)
       .stroke(borderColor);

    
    const innerBorderOffset = 15;
    doc.lineWidth(2)
       .rect(innerBorderOffset, innerBorderOffset, doc.page.width - (2 * innerBorderOffset), doc.page.height - (2 * innerBorderOffset))
       .stroke(borderColor);

    
    doc.fillColor('#e6f2ff') 
       .rect(innerBorderOffset, innerBorderOffset, doc.page.width - (2 * innerBorderOffset), doc.page.height - (2 * innerBorderOffset))
       .fill();

    
    doc.fillColor('black');

    
    const topSectionY = 60; 

    
    const msmeLogoPath = path.join(__dirname, 'images', 'msme_logo.png');
    const logoWidth = 70;
    const logoHeight = 70;
    const logoX = doc.page.width / 2 - logoWidth / 2; 

    if (fs.existsSync(msmeLogoPath)) {
        doc.image(msmeLogoPath, logoX, topSectionY, {
            width: logoWidth,
            height: logoHeight
        });
    } else {
        console.warn('MSME logo not found at specified path:', msmeLogoPath);
    }

    
    const leftColX = 55; 
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('black');
    doc.text(`Register-Id:- ${data.registerId || 'N/A'}`, leftColX, topSectionY);
    doc.text(`E-Mail: ${data.email || 'N/A'}`, leftColX, topSectionY + 15);
    doc.text(`Phone No.: ${data.phoneNo || 'N/A'}`, leftColX, topSectionY + 30);

    
    const rightColX = doc.page.width - 200; 
    doc.text(`Anand Farm, Sector 22`, rightColX, topSectionY);
    doc.text(`Gurugram (122016)`, rightColX, topSectionY + 15);
    doc.text(`(Haryana) India`, rightColX, topSectionY + 30);

   
    const titleY = 200; 
    doc.font('Helvetica-BoldOblique')
       .fontSize(24)
       .fillColor('#0066cc')
       .text('Certificate of Half Marathon', 0, titleY, { align: 'center' });

    
    const presentedToY = titleY + 50; 
    doc.font('Helvetica')
       .fontSize(14)
       .fillColor('black')
       .text('This Certificate Presented to', 0, presentedToY, { align: 'center' });

    const participantNameY = presentedToY + 25; 
    doc.font('Helvetica-Bold')
       .fontSize(28)
       .fillColor('#8b0000') 
       .text(data.participantName || 'Participant Name', 0, participantNameY, { align: 'center' });

    
    const descriptionY = participantNameY + 70; 
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('black')
       .text('The certificate of achievement is awarded to individuals who have demonstrated outstanding performance in their field. Here\'s an example text for a certificate.',
           doc.page.margins.left + 50, descriptionY, { 
           width: doc.page.width - (doc.page.margins.left + 50) * 2, 
           align: 'center',
           paragraphGap: 5 
       });

    
    const bottomDetailsY = doc.page.height - 180; 
    doc.font('Helvetica')
       .fontSize(12)
       .fillColor('black');

   
    doc.text(`Date of Birth: ${data.dateOfBirth || 'N/A'}`, leftColX, bottomDetailsY);

   
    doc.text(`Gender: ${data.gender || 'N/A'}`, leftColX + 220, bottomDetailsY); 

    
    doc.text(`Blood Group: ${data.bloodGroup || 'N/A'}`, rightColX, bottomDetailsY);

    
    const bottomRowY = doc.page.height - 90; 

    
    doc.font('Helvetica')
       .fontSize(12)
       .text(`${data.dateTime || 'N/A'}`, leftColX, bottomRowY);
    doc.fontSize(10)
       .text(`DATE-TIME`, leftColX, bottomRowY + 15);

    
    const sealImagePath = path.join(__dirname, 'images', 'certified_seal.png');
    const sealWidth = 80; 
    const sealHeight = 80; 
    const sealX = doc.page.width / 2 - sealWidth / 2; 
    const sealY = bottomRowY - 50; 

    if (fs.existsSync(sealImagePath)) {
        doc.image(sealImagePath, sealX, sealY, {
            width: sealWidth,
            height: sealHeight
        });
       
    } else {
        console.warn('Certified seal image not found at specified path:', sealImagePath);
        doc.font('Helvetica-Bold').fontSize(10).text('CERTIFIED PROFESSIONAL', sealX, sealY + sealHeight / 2, { width: sealWidth, align: 'center' });
    }

    
    doc.font('Helvetica')
       .fontSize(10)
       .text(`SIGNATURE`, rightColX, bottomRowY + 15); 

    
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