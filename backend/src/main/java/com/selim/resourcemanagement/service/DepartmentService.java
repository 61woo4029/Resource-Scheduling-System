package com.selim.resourcemanagement.service;

import com.selim.resourcemanagement.dto.DepartmentDto;
import com.selim.resourcemanagement.entity.Department;
import com.selim.resourcemanagement.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    @Transactional(readOnly = true)
    public List<DepartmentDto.Response> getActiveDepartments() {
        return departmentRepository.findByIsActiveTrueOrderByDepartmentName()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DepartmentDto.Response> getAllDepartments() {
        return departmentRepository.findAllByOrderByDepartmentName()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public DepartmentDto.Response createDepartment(DepartmentDto.CreateRequest request) {
        Department dept = Department.builder()
                .departmentName(request.getDepartmentName())
                .departmentCode(request.getDepartmentCode())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        if (request.getParentDepartmentId() != null) {
            Department parent = departmentRepository.findById(request.getParentDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException("상위 부서를 찾을 수 없습니다."));
            dept.setParentDepartment(parent);
        }

        return toDto(departmentRepository.save(dept));
    }

    @Transactional
    public DepartmentDto.Response updateDepartment(Long id, DepartmentDto.CreateRequest request) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("부서를 찾을 수 없습니다."));

        if (request.getDepartmentName() != null) dept.setDepartmentName(request.getDepartmentName());
        if (request.getDepartmentCode() != null) dept.setDepartmentCode(request.getDepartmentCode());
        if (request.getIsActive() != null) dept.setIsActive(request.getIsActive());

        if (request.getParentDepartmentId() != null) {
            Department parent = departmentRepository.findById(request.getParentDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException("상위 부서를 찾을 수 없습니다."));
            dept.setParentDepartment(parent);
        } else if (request.getParentDepartmentId() == null && request.getDepartmentName() != null) {
            dept.setParentDepartment(null);
        }

        return toDto(departmentRepository.save(dept));
    }

    @Transactional
    public void deleteDepartment(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("부서를 찾을 수 없습니다."));
        dept.setIsActive(false);
        departmentRepository.save(dept);
    }

    private DepartmentDto.Response toDto(Department dept) {
        DepartmentDto.ParentInfo parentInfo = null;
        if (dept.getParentDepartment() != null) {
            parentInfo = DepartmentDto.ParentInfo.builder()
                    .departmentId(dept.getParentDepartment().getDepartmentId())
                    .departmentName(dept.getParentDepartment().getDepartmentName())
                    .build();
        }
        return DepartmentDto.Response.builder()
                .departmentId(dept.getDepartmentId())
                .departmentName(dept.getDepartmentName())
                .departmentCode(dept.getDepartmentCode())
                .parentDepartment(parentInfo)
                .parentDepartmentId(dept.getParentDepartment() != null ? dept.getParentDepartment().getDepartmentId() : null)
                .isActive(dept.getIsActive())
                .build();
    }
}
