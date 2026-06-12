package com.vietskin.backend_springboot.modules.invoices.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateInvoiceRequest {

    @NotNull(message = "appointmentId không được để trống")
    private Integer appointmentId;

    @NotNull(message = "Phương thức thanh toán không được để trống")
    private String paymentMethod;

    private String note;
}
