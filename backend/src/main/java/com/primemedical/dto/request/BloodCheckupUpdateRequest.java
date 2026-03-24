package com.primemedical.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BloodCheckupUpdateRequest {

    private Boolean bloodCheckCompleted = true;

    private String bloodTestType;

    private String bloodTestReport;

    private String bloodCheckupNotes;
}
