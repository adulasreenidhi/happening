package com.happening.controller;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.happening.dto.NamedResourceResponse;
import com.happening.service.AdminService;

@RestController
@RequestMapping("/api")
public class CatalogController {
    private final AdminService adminService;

    public CatalogController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/categories")
    public List<NamedResourceResponse> categories() {
        return adminService.categories();
    }

    @GetMapping("/cities")
    public List<NamedResourceResponse> cities() {
        return adminService.cities();
    }
}
