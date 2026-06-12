package com.vietskin.backend_springboot.modules.export.controller;

import com.vietskin.backend_springboot.modules.export.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    /**
     * GET /api/export/invoices/{id}/pdf
     * In hóa đơn PDF — lễ tân và admin đều dùng được.
     */
    @GetMapping("/invoices/{id}/pdf")
    @PreAuthorize("hasAnyRole('receptionist','admin')")
    public ResponseEntity<byte[]> invoicePdf(@PathVariable Integer id) {
        byte[] data = exportService.exportInvoicePdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"invoice-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    /**
     * GET /api/export/revenue/pdf?year=2026&month=5
     * Xuất báo cáo doanh thu tháng dạng PDF — chỉ admin.
     * Mặc định: tháng và năm hiện tại.
     */
    @GetMapping("/revenue/pdf")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<byte[]> revenuePdf(
            @RequestParam(defaultValue = "0") int year,
            @RequestParam(defaultValue = "0") int month) {

        int y = year  == 0 ? LocalDate.now().getYear()        : year;
        int m = month == 0 ? LocalDate.now().getMonthValue()  : month;

        byte[] data = exportService.exportRevenuePdf(y, m);
        String filename = String.format("revenue-%d-%02d.pdf", y, m);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    /**
     * GET /api/export/stats/patients/excel
     * Xuất toàn bộ thống kê bệnh nhân dạng Excel (4 sheet) — chỉ admin.
     */
    @GetMapping("/stats/patients/excel")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<byte[]> patientStatsExcel() {
        byte[] data = exportService.exportPatientStatsExcel();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"patient-stats.xlsx\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }
}
