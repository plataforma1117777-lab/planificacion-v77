const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, PageOrientation } = require('docx');

async function main() {
    const doc3 = new Document({
        sections: [{
            properties: {
                page: {
                    size: {
                        orientation: PageOrientation.LANDSCAPE,
                        width: 12240, // 8.5 inches
                        height: 15840 // 11 inches
                    }
                }
            },
            children: [new Paragraph("Landscape Test 3")]
        }]
    });

    const buffer3 = await Packer.toBuffer(doc3);
    fs.writeFileSync('test3.docx', buffer3);
    console.log("Done");
}

main();
