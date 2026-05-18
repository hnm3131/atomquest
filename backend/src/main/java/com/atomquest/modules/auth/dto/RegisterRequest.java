package com.atomquest.modules.auth.dto;

import com.atomquest.shared.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class RegisterRequest {
    @NotBlank @Email
    private String email;
    @NotBlank
    private String password;
    @NotBlank
    private String name;
    @NotNull
    private Role role;
    private String department;
    private UUID managerId;
    private String designation;
}
