package com.medcenter.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationNotesRequest {

    private String notes;

    private String symptoms;
    private String examination;
    private String treatment;

    private String diagnosis;

    private Boolean isConfidential = false;
}
