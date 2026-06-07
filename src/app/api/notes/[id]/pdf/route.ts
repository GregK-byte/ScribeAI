import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

// Dynamic import for jsPDF (it's a client-side library but works in server env too)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: note, error } = await supabaseAdmin
      .from("notes")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", userId)
      .single();

    if (error || !note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Generate PDF using jsPDF on the server
    const { jsPDF } = await import("jspdf");
    // @ts-ignore
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(note.title, pageWidth / 2, 20, { align: "center" });

    // Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date(note.created_at).toLocaleDateString()}`, pageWidth / 2, 28, {
      align: "center",
    });

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 34, pageWidth - 14, 34);

    // SOAP Note Content
    const soapText = note.soap_note || "No SOAP note generated yet.";
    doc.setFontSize(11);
    doc.setFont("courier", "normal");

    const lines = doc.splitTextToSize(soapText, pageWidth - 28);
    doc.text(lines, 14, 44);

    // Transcript (if exists)
    if (note.transcript) {
      const transcriptY = (doc as any).lastAutoTable?.finalY || 44 + lines.length * 5 + 20;
      
      if (transcriptY > 250) {
        doc.addPage();
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Original Transcript", 14, transcriptY > 250 ? 20 : transcriptY + 20);

      doc.setFontSize(10);
      doc.setFont("courier", "normal");
      const transLines = doc.splitTextToSize(note.transcript, pageWidth - 28);
      doc.text(transLines, 14, transcriptY > 250 ? 30 : transcriptY + 30);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `ScribeAI — Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${note.title.replace(/\s+/g, "_")}_SOAP_Note.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}