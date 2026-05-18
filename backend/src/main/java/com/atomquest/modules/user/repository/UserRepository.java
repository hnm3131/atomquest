package com.atomquest.modules.user.repository;

import com.atomquest.modules.user.entity.User;
import com.atomquest.shared.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByManagerId(UUID managerId);
    List<User> findByDepartment(String department);
    List<User> findByRole(Role role);
    List<User> findByDepartmentAndRole(String department, Role role);
}
