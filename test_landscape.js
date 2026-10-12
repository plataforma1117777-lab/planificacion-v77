const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, PageOrientation } = require('docx');

async function main() {
    const doc1 = new Document({
        sections: [{
            properties: {
                page: {
                    size: {
                        orientation: PageOrientation.LANDSCAPE,
                        width: 15840,
                        height: 12240
                    }
                }
            },
            children: [new Paragraph("Landscape Test 1")]
        }]
    });

    const doc2 = new Document({
        sections: [{
            properties: {
                page: {
                    size: {
                        orientation: PageOrientation.LANDSCAPE
                    }
                }
            },
            children: [new Paragraph("Landscape Test 2")]
        }]
    });

    const buffer1 = await Packer.toBuffer(doc1);
    fs.writeFileSync('test1.docx', buffer1);

    const buffer2 = await Packer.toBuffer(doc2);
    fs.writeFileSync('test2.docx', buffer2);
    console.log("Done");
}

main();
