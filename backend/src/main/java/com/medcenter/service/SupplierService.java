package com.medcenter.service;

import com.medcenter.dto.response.SupplierResponse;
import com.medcenter.entity.Supplier;
import com.medcenter.exception.ResourceNotFoundException;
import com.medcenter.repository.SupplierRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;

    @Transactional(readOnly = true)
    public List<SupplierResponse> getAllSuppliers() {
        return supplierRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SupplierResponse> searchSuppliers(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllSuppliers();
        }
        List<Supplier> byName = supplierRepository.findByNameContainingIgnoreCase(keyword);
        List<Supplier> byContact =
                supplierRepository.findByContactPersonContainingIgnoreCase(keyword);
        return java.util.stream.Stream.concat(byName.stream(), byContact.stream())
                .distinct()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SupplierResponse getById(Long id) {
        Supplier s =
                supplierRepository
                        .findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
        return mapToResponse(s);
    }

    @Transactional
    public SupplierResponse createSupplier(Supplier supplier) {
        Supplier saved = supplierRepository.save(supplier);
        return mapToResponse(saved);
    }

    @Transactional
    public SupplierResponse updateSupplier(Long id, Supplier updated) {
        Supplier existing =
                supplierRepository
                        .findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
        existing.setName(updated.getName());
        existing.setContactPerson(updated.getContactPerson());
        existing.setPhone(updated.getPhone());
        existing.setEmail(updated.getEmail());
        existing.setAddress(updated.getAddress());
        return mapToResponse(supplierRepository.save(existing));
    }

    @Transactional
    public void deleteSupplier(Long id) {
        if (!supplierRepository.existsById(id)) {
            throw new ResourceNotFoundException("Supplier", "id", id);
        }
        supplierRepository.deleteById(id);
    }

    private SupplierResponse mapToResponse(Supplier s) {
        return SupplierResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .contactPerson(s.getContactPerson())
                .phone(s.getPhone())
                .email(s.getEmail())
                .address(s.getAddress())
                .build();
    }
}
