package com.vietskin.backend_springboot.modules.rooms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateRoomRequest {

    @NotBlank(message = "Tên phòng không được để trống")
    @Size(max = 50)
    private String name;

    private Integer doctorId;
    private Boolean active;
}
