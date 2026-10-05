package com.happening.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.happening.entity.Role;

import com.happening.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmailIgnoreCase(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    long countByRole(Role role);

    java.util.List<User> findAllByOrderByNameAsc();

    java.util.List<User> findByRoleOrderByNameAsc(Role role);
}
