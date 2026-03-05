package com.medcenter.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierResponse {

    private Long id;
    private String name;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;
}
