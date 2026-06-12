package com.vietskin.backend_springboot.modules.export.service;

// OpenPDF — tường minh từng class, tránh conflict Row/Font với Apache POI
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.vietskin.backend_springboot.common.enums.PaymentStatus;
import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.modules.invoices.entity.Invoice;
import com.vietskin.backend_springboot.modules.invoices.repository.InvoiceRepository;
import com.vietskin.backend_springboot.modules.stats.service.StatsService;
import com.vietskin.backend_springboot.modules.stats.dto.PatientStatsResponse;
import lombok.RequiredArgsConstructor;
// Apache POI — wildcard an toàn vì đã loại bỏ wildcard OpenPDF
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final InvoiceRepository invoiceRepository;
    private final StatsService statsService;

    private static final DateTimeFormatter VN_DT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter VN_D  = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // ─────────────────────────────────────────────────────────────────
    //  PDF hóa đơn đơn lẻ
    // ─────────────────────────────────────────────────────────────────

    /**
     * Xuất PDF cho một hóa đơn cụ thể.
     * Trả về mảng byte sẵn sàng để ghi vào HTTP response.
     */
    public byte[] exportInvoicePdf(Integer invoiceId) {
        Invoice inv = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Hóa đơn không tồn tại"));

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A5);
            PdfWriter.getInstance(doc, out);
            doc.open();

            // Font — dùng Helvetica (built-in, không cần embed file font)
            com.lowagie.text.Font titleFont  = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 16, com.lowagie.text.Font.BOLD);
            com.lowagie.text.Font headerFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 10, com.lowagie.text.Font.BOLD);
            com.lowagie.text.Font normalFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 10, com.lowagie.text.Font.NORMAL);
            com.lowagie.text.Font smallFont  = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 8,  com.lowagie.text.Font.ITALIC);

            // Tiêu đề phòng khám
            Paragraph clinicName = new Paragraph("PHONG KHAM DA LIEU VIETSKIN", titleFont);
            clinicName.setAlignment(Element.ALIGN_CENTER);
            doc.add(clinicName);

            Paragraph sub = new Paragraph("123 Duong ABC, Quan 1, TP.HCM | 0901 234 567", smallFont);
            sub.setAlignment(Element.ALIGN_CENTER);
            doc.add(sub);
            doc.add(Chunk.NEWLINE);

            // Tên hóa đơn
            Paragraph invoiceTitle = new Paragraph("HOA DON THANH TOAN", headerFont);
            invoiceTitle.setAlignment(Element.ALIGN_CENTER);
            doc.add(invoiceTitle);
            doc.add(Chunk.NEWLINE);

            // Thông tin hóa đơn dạng bảng 2 cột
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingBefore(8);

            addInfoRow(infoTable, "Ma hoa don:",   inv.getInvoiceCode(),       headerFont, normalFont);
            addInfoRow(infoTable, "Benh nhan:",    inv.getPatientName(),        headerFont, normalFont);
            addInfoRow(infoTable, "Ngay thanh toan:",
                    inv.getPaidAt() != null ? inv.getPaidAt().format(VN_DT) : "Chua thanh toan",
                    headerFont, normalFont);
            addInfoRow(infoTable, "Hinh thuc:",
                    inv.getMethod() != null ? inv.getMethod().name() : "-",
                    headerFont, normalFont);
            if (inv.getDescription() != null && !inv.getDescription().isBlank()) {
                addInfoRow(infoTable, "Dich vu:", inv.getDescription(), headerFont, normalFont);
            }
            doc.add(infoTable);
            doc.add(Chunk.NEWLINE);

            // Dòng tổng tiền
            PdfPTable totalTable = new PdfPTable(2);
            totalTable.setWidthPercentage(100);
            PdfPCell labelCell = new PdfPCell(new Phrase("TONG TIEN:", headerFont));
            labelCell.setBorder(Rectangle.TOP);
            labelCell.setPadding(6);
            PdfPCell valueCell = new PdfPCell(new Phrase(formatVnd(inv.getAmount()), titleFont));
            valueCell.setBorder(Rectangle.TOP);
            valueCell.setPadding(6);
            valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalTable.addCell(labelCell);
            totalTable.addCell(valueCell);
            doc.add(totalTable);
            doc.add(Chunk.NEWLINE);

            // Ghi chú cuối
            Paragraph footer = new Paragraph("Cam on quy khach da su dung dich vu cua VietSkin!", smallFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            doc.add(footer);

            doc.close();
            return out.toByteArray();

        } catch (DocumentException | IOException e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Loi tao PDF: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    //  PDF báo cáo doanh thu tháng
    // ─────────────────────────────────────────────────────────────────

    public byte[] exportRevenuePdf(int year, int month) {
        LocalDateTime from = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime to   = from.plusMonths(1);

        List<Invoice> invoices = invoiceRepository.findByStatusAndPaidAtBetween(
                PaymentStatus.paid, from, to);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4.rotate()); // ngang
            PdfWriter.getInstance(doc, out);
            doc.open();

            com.lowagie.text.Font titleFont  = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 14, com.lowagie.text.Font.BOLD);
            com.lowagie.text.Font headerFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 9,  com.lowagie.text.Font.BOLD);
            com.lowagie.text.Font normalFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 9,  com.lowagie.text.Font.NORMAL);

            Paragraph title = new Paragraph(
                    "BAO CAO DOANH THU THANG " + month + "/" + year, titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            doc.add(title);

            Paragraph exportedAt = new Paragraph(
                    "Xuat bao cao luc: " + LocalDateTime.now().format(VN_DT),
                    new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 8, com.lowagie.text.Font.ITALIC));
            exportedAt.setAlignment(Element.ALIGN_RIGHT);
            doc.add(exportedAt);
            doc.add(Chunk.NEWLINE);

            // Bảng danh sách hóa đơn
            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.5f, 2.5f, 3f, 2f, 2f, 2f});

            addTableHeader(table, headerFont,
                    "STT", "Ma HD", "Benh nhan", "Ngay TT", "Hinh thuc", "So tien");

            BigDecimal grandTotal = BigDecimal.ZERO;
            int stt = 1;
            for (Invoice inv : invoices) {
                addTableCell(table, normalFont, String.valueOf(stt++));
                addTableCell(table, normalFont, inv.getInvoiceCode());
                addTableCell(table, normalFont, inv.getPatientName());
                addTableCell(table, normalFont,
                        inv.getPaidAt() != null ? inv.getPaidAt().format(VN_D) : "-");
                addTableCell(table, normalFont,
                        inv.getMethod() != null ? inv.getMethod().name() : "-");
                addTableCell(table, normalFont, formatVnd(inv.getAmount()));
                grandTotal = grandTotal.add(inv.getAmount());
            }
            doc.add(table);
            doc.add(Chunk.NEWLINE);

            // Tổng cộng
            Paragraph total = new Paragraph("TONG CONG: " + formatVnd(grandTotal), titleFont);
            total.setAlignment(Element.ALIGN_RIGHT);
            doc.add(total);

            doc.close();
            return out.toByteArray();

        } catch (DocumentException | IOException e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Loi tao PDF: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    //  Excel thống kê bệnh nhân
    // ─────────────────────────────────────────────────────────────────

    public byte[] exportPatientStatsExcel() {
        PatientStatsResponse stats = statsService.getPatientStats();

        try (Workbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // Sheet 1: Tổng quan
            Sheet overview = wb.createSheet("Tong quan");
            CellStyle bold = boldStyle(wb);

            addKvRow(overview, 0, "Tong benh nhan co tai khoan", stats.totalPatients(), bold);
            addKvRow(overview, 1, "Benh nhan moi thang nay",     stats.newThisMonth(),  bold);
            addKvRow(overview, 2, "Tong luot kham (done)",       stats.totalVisits(),   bold);
            addKvRow(overview, 3, "Ti le khong den (%)",          stats.noShowRate(),    bold);
            overview.autoSizeColumn(0);
            overview.autoSizeColumn(1);

            // Sheet 2: Lượt khám theo tháng
            Sheet monthSheet = wb.createSheet("Luot kham theo thang");
            addSheetHeader(monthSheet, bold, "Thang", "Luot kham");
            int r = 1;
            for (PatientStatsResponse.MonthlyVisit mv : stats.visitsByMonth()) {
                Row row = monthSheet.createRow(r++);
                row.createCell(0).setCellValue(mv.month());
                row.createCell(1).setCellValue(mv.count());
            }
            monthSheet.autoSizeColumn(0);
            monthSheet.autoSizeColumn(1);

            // Sheet 3: Top bác sĩ
            Sheet docSheet = wb.createSheet("Top bac si");
            addSheetHeader(docSheet, bold, "Bac si", "So ca kham");
            r = 1;
            for (PatientStatsResponse.DoctorStat ds : stats.topDoctors()) {
                Row row = docSheet.createRow(r++);
                row.createCell(0).setCellValue(ds.doctorName());
                row.createCell(1).setCellValue(ds.count());
            }
            docSheet.autoSizeColumn(0);
            docSheet.autoSizeColumn(1);

            // Sheet 4: Top chẩn đoán
            Sheet diagSheet = wb.createSheet("Chan doan pho bien");
            addSheetHeader(diagSheet, bold, "Chan doan", "So lan");
            r = 1;
            for (PatientStatsResponse.DiagnosisStat ds : stats.topDiagnoses()) {
                Row row = diagSheet.createRow(r++);
                row.createCell(0).setCellValue(ds.diagnosis());
                row.createCell(1).setCellValue(ds.count());
            }
            diagSheet.autoSizeColumn(0);
            diagSheet.autoSizeColumn(1);

            wb.write(out);
            return out.toByteArray();

        } catch (IOException e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Loi tao Excel: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────────

    private void addInfoRow(PdfPTable table,
                            String label, String value,
                            com.lowagie.text.Font lf, com.lowagie.text.Font vf) {
        PdfPCell lc = new PdfPCell(new Phrase(label, lf));
        lc.setBorder(Rectangle.NO_BORDER);
        lc.setPadding(4);
        PdfPCell vc = new PdfPCell(new Phrase(value, vf));
        vc.setBorder(Rectangle.NO_BORDER);
        vc.setPadding(4);
        table.addCell(lc);
        table.addCell(vc);
    }

    private void addTableHeader(PdfPTable table, com.lowagie.text.Font font, String... headers) {
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, font));
            cell.setBackgroundColor(new java.awt.Color(173, 216, 230));
            cell.setPadding(5);
            table.addCell(cell);
        }
    }

    private void addTableCell(PdfPTable table, com.lowagie.text.Font font, String value) {
        PdfPCell cell = new PdfPCell(new Phrase(value, font));
        cell.setPadding(4);
        table.addCell(cell);
    }

    private CellStyle boldStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont();
        f.setBold(true);
        s.setFont(f);
        return s;
    }

    private void addKvRow(Sheet sheet, int rowIdx, String key, Object value, CellStyle keyStyle) {
        Row row = sheet.createRow(rowIdx);
        Cell kc = row.createCell(0);
        kc.setCellValue(key);
        kc.setCellStyle(keyStyle);
        Cell vc = row.createCell(1);
        if (value instanceof Number n) vc.setCellValue(n.doubleValue());
        else vc.setCellValue(value.toString());
    }

    private void addSheetHeader(Sheet sheet, CellStyle style, String... headers) {
        Row row = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
        }
    }

    private String formatVnd(BigDecimal amount) {
        if (amount == null) return "0 d";
        NumberFormat fmt = NumberFormat.getNumberInstance(new Locale("vi", "VN"));
        return fmt.format(amount) + " d";
    }
}
