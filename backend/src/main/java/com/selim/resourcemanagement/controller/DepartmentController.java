package com.selim.resourcemanagement.controller;

import com.selim.resourcemanagement.dto.ApiResponse;
import com.selim.resourcemanagement.dto.DepartmentDto;
import com.selim.resourcemanagement.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    public ApiResponse<?> getActiveDepartments() {
        return ApiResponse.success(departmentService.getActiveDepartments());
    }

    @GetMapping("/all")
    public ApiResponse<?> getAllDepartments() {
        return ApiResponse.success(departmentService.getAllDepartments());
    }

    @PostMapping
    public ApiResponse<?> createDepartment(@RequestBody DepartmentDto.CreateRequest request) {
        return ApiResponse.success("부서가 등록되었습니다.", departmentService.createDepartment(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<?> updateDepartment(@PathVariable Long id,
                                            @RequestBody DepartmentDto.CreateRequest request) {
        return ApiResponse.success("부서가 수정되었습니다.", departmentService.updateDepartment(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ApiResponse.success("부서가 삭제되었습니다.");
    }
}
