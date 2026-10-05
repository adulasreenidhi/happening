package com.happening.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.happening.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
}
