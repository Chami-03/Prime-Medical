package com.primemedical.controller;

import com.primemedical.dto.response.ApiResponse;
import com.primemedical.dto.response.SupplierResponse;
import com.primemedical.entity.Supplier;
import com.primemedical.service.SupplierService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR')")
    public ResponseEntity<ApiResponse<List<SupplierResponse>>> getAll(
            @RequestParam(required = false) String search) {
        List<SupplierResponse> list =
                search != null && !search.isEmpty()
                        ? supplierService.searchSuppliers(search)
                        : supplierService.getAllSuppliers();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR')")
    public ResponseEntity<ApiResponse<SupplierResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<ApiResponse<SupplierResponse>> create(@RequestBody Supplier supplier) {
        SupplierResponse created = supplierService.createSupplier(supplier);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Supplier added", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<ApiResponse<SupplierResponse>> update(
            @PathVariable Long id, @RequestBody Supplier supplier) {
        return ResponseEntity.ok(ApiResponse.success(supplierService.updateSupplier(id, supplier)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        supplierService.deleteSupplier(id);
        return ResponseEntity.ok(ApiResponse.success("Supplier deleted", null));
    }
}
